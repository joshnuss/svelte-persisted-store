// @vitest-environment node
import { persisted, writable } from '../index'
import { get } from 'svelte/store'
import { expect, vi, describe, test, it } from 'vitest'

describe('writable()', () => {
  test('it works, but raises deprecation warning', () => {
    console.warn = vi.fn()

    const store = writable('myKey2', 'initial')
    const value = get(store)

    expect(value).toEqual('initial')
    expect(console.warn).toHaveBeenCalledWith(expect.stringMatching(/deprecated/))
  })
})

describe('persisted()', () => {
  test('uses initial value if nothing in local storage', () => {
    const store = persisted('myKey', 123)
    const value = get(store)

    expect(value).toEqual(123)
  })

  describe('set()', () => {
    test('replaces old value', () => {
      const store = persisted('myKey3', '')
      store.set('new-value')
      const value = get(store)

      expect(value).toEqual('new-value')
    })

    test('adds new value', () => {
      const store = persisted('myKey4', '')
      store.set('new-value')
      const value = get(store)

      expect(value).toEqual('new-value')
    })
  })

  describe('update()', () => {
    test('replaces old value', () => {
      const store = persisted('myKey5', 123)
      store.update(n => n + 1)
      const value = get(store)

      expect(value).toEqual(124)
    })

    test('adds new value', () => {
      const store = persisted('myKey6', 123)
      store.update(n => n + 1)
      const value = get(store)

      expect(value).toEqual(124)
    })
  })

  describe('reset', () => {
    it('resets to initial value', () => {
      const store = persisted('myKey14', 123);
      store.set(456);
      store.reset();
      const value = get(store);

      expect(value).toEqual(123);
    });
  });

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

  it("doesn't handle duplicate stores with the same key", () => {
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

    expect(values1).toEqual([1, 2, 3])
    expect(values2).toEqual([99, 4])
    expect(get(store1)).not.toEqual(get(store2))

    expect(store1).not.toEqual(store2)

    unsub1()
    unsub2()
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
  })

  it('lets you switch storage type', () => {
    const store = persisted('myKey12', 'foo', {
      storage: 'session'
    })

    store.set('bar')

    expect(get(store)).toEqual('bar')
  })
})
