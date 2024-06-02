import { persisted, writable } from '../index'
import { get } from 'svelte/store'
import { expect, vi, beforeEach, describe, test, it } from 'vitest'
import localforage from 'localforage'

beforeEach(async () => {
  await localforage.clear();
  /* Set the driver to localStorage, overriding the default IndexedDB,
     since localStorage is used in all but the final two tests. */
  await localforage.setDriver(localforage.LOCALSTORAGE);
})

describe('writable()', () => {
  test('it works, but raises deprecation warning', async () => {
    console.warn = vi.fn()

    await localforage.setItem('myKey2', '"existing"')

    const store = await writable('myKey2', 'initial')
    const value = get(store)

    expect(value).toEqual('existing')
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/deprecated/))
  })
})

describe('persisted()', () => {
  test('uses initial value if nothing in local storage', async () => {
    const store = await persisted('myKey', 123)
    const value = get(store)

    expect(value).toEqual(123)
    expect(await localforage.getItem("myKey")).toBeNull()
  })

  test('uses existing value if data already in local storage', async () => {
    await localforage.setItem('myKey2', '"existing"')

    const store = await persisted('myKey2', 'initial')
    const value = get(store)

    expect(value).toEqual('existing')
  })

  describe('set()', () => {
    test('replaces old value', async () => {
      await localforage.setItem('myKey3', '"existing"')

      const store = await persisted('myKey3', '')
      await store.set('new-value')
      const value = get(store)

      expect(await localforage.getItem("myKey3")).toEqual('"new-value"')
      expect(value).toEqual('new-value')
    })

    test('adds new value', async () => {
      const store = await persisted('myKey4', '')
      await store.set('new-value')
      const value = get(store)

      expect(await localforage.getItem("myKey4")).toEqual('"new-value"')
      expect(value).toEqual('new-value')
    })
  })

  describe('update()', () => {
    test('replaces old value', async () => {
      const store = await persisted('myKey5', 123)
      store.update(n => n + 1)
      const value = get(store)

      expect(await (await localforage.getItem("myKey5"))).toEqual('124')
      expect(value).toEqual(124)
    })

    test('adds new value', async () => {
      const store = await persisted('myKey6', 123)
      await store.update(n => n + 1)
      const value = get(store)

      expect(await localforage.getItem("myKey6")).toEqual('124')
      expect(value).toEqual(124)
    })

    test("BUG: update should use existing value", async () => {
      await localforage.setItem('myKey6b', '12345')
      const store = await persisted('myKey6b', 123)
      await store.update(n => { n += 1; return n })

      expect(await localforage.getItem("myKey6b")).toEqual('12346')
    })
  })

  describe('reset', () => {
    it('resets to initial value', async () => {
      const store = await persisted('myKey14', 123);
      await store.set(456);
      await store.reset();
      const value = get(store);

      expect(value).toEqual(123);
      expect(await localforage.getItem("myKey14")).toEqual('123');
      });
    });

  describe('subscribe()', () => {
    it('publishes updates', async () => {
      const store = await persisted('myKey7', 123)
      const values: number[] = []
      const unsub = store.subscribe((value: number) => {
        if (value !== undefined) values.push(value)
      })
      await store.set(456)
      await store.set(999)

      expect(values).toEqual([123, 456, 999])

      unsub()
    })
  })

  it('handles duplicate stores with the same key', async () => {
    const store1 = await persisted('same-key', 1)
    const values1: number[] = []

    const unsub1 = (await store1).subscribe(value => {
      values1.push(value)
    })

  await store1.set(2)

    const store2 = await persisted('same-key', 99)
    const values2: number[] = []

    const unsub2 = (await store2).subscribe(value => {
      values2.push(value)
    })

    await store1.set(3)
    await store2.set(4)

    expect(values1).toEqual([1, 2, 3, 4])
    expect(values2).toEqual([2, 3, 4])
    expect(get(store1)).toEqual(get(store2))

    expect(store1).toEqual(store2)

    unsub1()
    unsub2()
  })

  describe("beforeRead and beforeWrite", () => {
    it("allows modifying initial value before reading", async () => {
      await localforage.setItem("beforeRead-init-test", JSON.stringify(2))
      const store = await persisted("beforeRead-init-test", 0, { beforeRead: (v: number) => v * 2 })
      expect(get(store)).toEqual(4)
    })
    it("allows modifying value before reading upon event", async () => {
      const store = await persisted("beforeRead-test", 0, { beforeRead: (v: number) => v * 2 })
      const values: number[] = []

      const unsub = store.subscribe((val: number) => {
        values.push(val)
      })

      const event = new StorageEvent('storage', { key: 'beforeRead-test', newValue: "2" })
      window.dispatchEvent(event)

      expect(values).toEqual([0, 4])

      unsub()
    })

    it("allows modifying value before writing", async () => {
      const store = await persisted("beforeWrite-test", 0, { beforeWrite: (v) => v * 2 })
      await store.set(2)

      expect(JSON.parse(await localforage.getItem("beforeWrite-test") as string)).toEqual(4)
    })
  })

  describe('handles window.storage event', () => {
    type NumberDict = { [key: string]: number }

    it('sets storage when key matches', async () => {
      const store = await persisted('myKey8', { a: 1 })
      const values: NumberDict[] = []

      const unsub = store.subscribe((value: NumberDict) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', { key: 'myKey8', newValue: '{"a": 1, "b": 2}' })
      window.dispatchEvent(event)

      expect(values).toEqual([{ a: 1 }, { a: 1, b: 2 }])

      unsub()
    })

    it('ignores storages events when value is null', async () => {
      const store = await persisted('myKey9', { a: 1 })
      const values: NumberDict[] = []

      const unsub = store.subscribe((value: NumberDict) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', { key: 'myKey9', newValue: null })
      window.dispatchEvent(event)

      expect(values).toEqual([{ a: 1 }])

      unsub()
    })

    it("doesn't update store when key doesn't match", async () => {
      const store = await persisted('myKey10', 1)
      const values: number[] = []

      const unsub = store.subscribe((value: number) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', { key: 'unknownKey', newValue: '2' })
      window.dispatchEvent(event)

      expect(values).toEqual([1])

      unsub()
    })

    it("doesn't update store when there are no subscribers", async () => {
      await localforage.setItem('myKeyb', '2')

      const store = await persisted('myKeyb', 1)
      const values: number[] = []

      const event = new StorageEvent('storage', { key: 'myKeyb', newValue: '2' })
      window.dispatchEvent(event)

      const unsub = store.subscribe((value: number) => {
        values.push(value)
      })

      expect(values).toEqual([2])

      unsub()
    })

    it('ignores session-backed stores', async () => {
      const store = await persisted('myKey10', 1, { storage: 'session' })
      const values: number[] = []

      const unsub = store.subscribe((value) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', { key: 'myKey10', newValue: '2' })
      window.dispatchEvent(event)

      expect(values).toEqual([1])

      unsub()
    })

    it("doesn't update, when syncTabs option is disabled", async () => {
      const store = await persisted('myKey13', 1, { syncTabs: false })
      const values: number[] = []

      const unsub = store.subscribe((value) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', { key: 'myKey13', newValue: '2' })
      window.dispatchEvent(event)

      expect(values).toEqual([1])

      unsub()
    })
  })

  it('allows custom serialize/deserialize functions', async () => {
    const serializer = {
      stringify: (set: Set<number>) => JSON.stringify(Array.from(set)),
      parse: (json: string) => new Set(JSON.parse(json)),
    }

    const testSet = new Set([1, 2, 3])

    const store = await persisted('myKey11', testSet, { serializer })
    const value = get(store)

    await store.update(d => d.add(4))

    expect(value).toEqual(testSet)
    expect(await localforage.getItem("myKey11")).toEqual(serializer.stringify(new Set([1, 2, 3, 4])))
  })

  it('lets you switch storage type to sessionStorage', async () => {
    vi.spyOn(Object.getPrototypeOf(window.sessionStorage), 'setItem')
    Object.setPrototypeOf(window.sessionStorage.setItem, vi.fn())

    const value = 'foo'

    const store = await persisted('myKey12', value, {
      storage: 'session'
    })

    await store.set('bar')

    expect(window.sessionStorage.setItem).toHaveBeenCalled()
  })

  it("lets you switch storage type to indexedDB", async () => {
    /* Testing direct calls to the mock IndexedDB is not feasible due to the timing
     of spy setup and localforage import. 
     Localforage's internal calls to IndexedDB occur before the spy can be set up. 
     As a workaround, verify if localforage's setDriver method was called with the correct arguments. */
    const setDriverSpy = vi.spyOn(localforage, "setDriver");

    const value = "foo";

    const store = await persisted("myKey12", value, {
      storage: "indexedDB",
    });

    await store.set("bar");

    expect(setDriverSpy).toHaveBeenCalledWith(localforage.INDEXEDDB);
  });
})