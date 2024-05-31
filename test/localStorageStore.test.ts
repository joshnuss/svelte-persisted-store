import { persisted, writable } from '../index'
import { get } from 'svelte/store'
import { expect, vi, beforeEach, describe, test, it } from 'vitest'

beforeEach(() => localStorage.clear())

describe('writable()', () => {
  test('it works, but raises deprecation warning', () => {
    console.warn = vi.fn()

    localStorage.setItem('myKey2', '"existing"')

    const store = writable('myKey2', 'initial')
    const value = get(store)

    expect(value).toEqual('existing')
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/deprecated/))
  })
})

describe('persisted()', () => {
  test('uses initial value if nothing in local storage', () => {
    const store = persisted('myKey', 123)
    const value = get(store)

    expect(value).toEqual(123)
    expect(localStorage.myKey).toBeUndefined()
  })

  test('uses existing value if data already in local storage', () => {
    localStorage.setItem('myKey2', '"existing"')

    const store = persisted('myKey2', 'initial')
    const value = get(store)

    expect(value).toEqual('existing')
  })

  describe('set()', () => {
    test('replaces old value', () => {
      localStorage.setItem('myKey3', '"existing"')

      const store = persisted('myKey3', '')
      store.set('new-value')
      const value = get(store)

      expect(localStorage.myKey3).toEqual('"new-value"')
      expect(value).toEqual('new-value')
    })

    test('adds new value', () => {
      const store = persisted('myKey4', '')
      store.set('new-value')
      const value = get(store)

      expect(localStorage.myKey4).toEqual('"new-value"')
      expect(value).toEqual('new-value')
    })
  })

  describe('update()', () => {
    test('replaces old value', () => {
      const store = persisted('myKey5', 123)
      store.update(n => n + 1)
      const value = get(store)

      expect(localStorage.myKey5).toEqual('124')
      expect(value).toEqual(124)
    })

    test('adds new value', () => {
      const store = persisted('myKey6', 123)
      store.update(n => n + 1)
      const value = get(store)

      expect(localStorage.myKey6).toEqual('124')
      expect(value).toEqual(124)
    })

    test("BUG: update should use existing value", () => {
      localStorage.setItem('myKey6b', '12345')
      const store = persisted('myKey6b', 123)
      store.update(n => { n += 1; return n })

      expect(localStorage.myKey6b).toEqual('12346')
    })
  })

  describe('subscribe()', () => {
    it('publishes updates', () => {
      const store = persisted('myKey7', 123)
      const values: number[] = []
      const unsub = store.subscribe((value: number) => {
        if (value !== undefined) values.push(value)
      })
      store.set(456)
      store.set(999)

      expect(values).toEqual([123, 456, 999])

      unsub()
    })
  })

  it('handles duplicate stores with the same key', () => {
    const store1 = persisted('same-key', 1)
    const values1: number[] = []

    const unsub1 = store1.subscribe(value => {
      values1.push(value)
    })

    store1.set(2)

    const store2 = persisted('same-key', 99)
    const values2: number[] = []

    const unsub2 = store2.subscribe(value => {
      values2.push(value)
    })

    store1.set(3)
    store2.set(4)

    expect(values1).toEqual([1, 2, 3, 4])
    expect(values2).toEqual([2, 3, 4])
    expect(get(store1)).toEqual(get(store2))

    expect(store1).toEqual(store2)

    unsub1()
    unsub2()
  })

  describe("beforeRead and beforeWrite", () => {
    it("allows modifying initial value before reading", () => {
      localStorage.setItem("beforeRead-init-test", JSON.stringify(2))
      const store = persisted("beforeRead-init-test", 0, { beforeRead: (v: number) => v * 2 })
      expect(get(store)).toEqual(4)
    })
    it("allows modifying value before reading upon event", () => {
      const store = persisted("beforeRead-test", 0, { beforeRead: (v: number) => v * 2 })
      const values: number[] = []

      const unsub = store.subscribe((val: number) => {
        values.push(val)
      })

      const event = new StorageEvent('storage', { key: 'beforeRead-test', newValue: "2" })
      window.dispatchEvent(event)

      expect(values).toEqual([0, 4])

      unsub()
    })

    it("allows modifying value before writing", () => {
      const store = persisted("beforeWrite-test", 0, { beforeWrite: (v) => v * 2 })
      store.set(2)

      expect(JSON.parse(localStorage.getItem("beforeWrite-test") as string)).toEqual(4)
    })
  })

  describe('handles window.storage event', () => {
    type NumberDict = { [key: string]: number }

    it('sets storage when key matches', () => {
      const store = persisted('myKey8', { a: 1 })
      const values: NumberDict[] = []

      const unsub = store.subscribe((value: NumberDict) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', { key: 'myKey8', newValue: '{"a": 1, "b": 2}' })
      window.dispatchEvent(event)

      expect(values).toEqual([{ a: 1 }, { a: 1, b: 2 }])

      unsub()
    })

    it('ignores storages events when value is null', () => {
      const store = persisted('myKey9', { a: 1 })
      const values: NumberDict[] = []

      const unsub = store.subscribe((value: NumberDict) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', { key: 'myKey9', newValue: null })
      window.dispatchEvent(event)

      expect(values).toEqual([{ a: 1 }])

      unsub()
    })

    it("doesn't update store when key doesn't match", () => {
      const store = persisted('myKey10', 1)
      const values: number[] = []

      const unsub = store.subscribe((value: number) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', { key: 'unknownKey', newValue: '2' })
      window.dispatchEvent(event)

      expect(values).toEqual([1])

      unsub()
    })

    it("doesn't update store when there are no subscribers", () => {
      localStorage.setItem('myKeyb', '2')

      const store = persisted('myKeyb', 1)
      const values: number[] = []

      const event = new StorageEvent('storage', { key: 'myKeyb', newValue: '2' })
      window.dispatchEvent(event)

      const unsub = store.subscribe((value: number) => {
        values.push(value)
      })

      expect(values).toEqual([2])

      unsub()
    })

    it('ignores session-backed stores', () => {
      const store = persisted('myKey10', 1, { storage: 'session' })
      const values: number[] = []

      const unsub = store.subscribe((value) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', { key: 'myKey10', newValue: '2' })
      window.dispatchEvent(event)

      expect(values).toEqual([1])

      unsub()
    })

    it("doesn't update, when syncTabs option is disabled", () => {
      const store = persisted('myKey13', 1, { syncTabs: false })
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

  it('allows custom serialize/deserialize functions', () => {
    const serializer = {
      stringify: (set: Set<number>) => JSON.stringify(Array.from(set)),
      parse: (json: string) => new Set(JSON.parse(json)),
    }

    const testSet = new Set([1, 2, 3])

    const store = persisted('myKey11', testSet, { serializer })
    const value = get(store)

    store.update(d => d.add(4))

    expect(value).toEqual(testSet)
    expect(localStorage.myKey11).toEqual(serializer.stringify(new Set([1, 2, 3, 4])))
  })

  it('lets you switch storage type', () => {
    vi.spyOn(Object.getPrototypeOf(window.sessionStorage), 'setItem')
    Object.setPrototypeOf(window.sessionStorage.setItem, vi.fn())

    const value = 'foo'

    const store = persisted('myKey12', value, {
      storage: 'session'
    })

    store.set('bar')

    expect(window.sessionStorage.setItem).toHaveBeenCalled()
  })
})
