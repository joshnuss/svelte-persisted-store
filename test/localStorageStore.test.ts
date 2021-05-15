import { writable } from '../src/index'
import { get } from 'svelte/store'

beforeEach(() => localStorage.clear())

describe('writable()', () => {
  test('uses initial value if nothing in local storage', () => {
    const store = writable('myKey', 123)
    const value = get(store)

    expect(value).toEqual(123)
  })

  test('uses existing value if data already in local storage', () => {
    localStorage.setItem('myKey', '"existing"')

    const store = writable('myKey', 'initial')
    const value = get(store)

    expect(value).toEqual('existing')
  })

  describe('set()', () => {
    test('replaces old value', () => {
      localStorage.setItem('myKey', '"existing"')

      const store = writable('myKey', '')
      store.set('new-value')
      const value = get(store)

      expect(localStorage.myKey).toEqual('"new-value"')
      expect(value).toEqual('new-value')
    })

    test('adds new value', () => {
      const store = writable('myKey', '')
      store.set('new-value')
      const value = get(store)

      expect(localStorage.myKey).toEqual('"new-value"')
      expect(value).toEqual('new-value')
    })
  })

  describe('update()', () => {
    test('replaces old value', () => {
      localStorage.setItem('myKey', '123')

      const store = writable('myKey', 0)
      store.update(n => n + 1)
      const value = get(store)

      expect(localStorage.myKey).toEqual('124')
      expect(value).toEqual(124)
    })

    test('adds new value', () => {
      const store = writable('myKey', 123)
      store.update(n => n + 1)
      const value = get(store)

      expect(localStorage.myKey).toEqual('124')
      expect(value).toEqual(124)
    })
  })

  describe('subscribe()', () => {
    it('publishes updates', () => {
      const store = writable('myKey', 123)
      const values: number[] = []
      const unsub = store.subscribe((value : number) => {
        if (value !== undefined) values.push(value)
      })
      store.set(456)
      store.set(999)

      expect(values).toEqual([123, 456, 999])

      unsub()
    })
  })

  describe('handles window.storage event', () => {
    type NumberDict = { [key: string] : number }

    it('sets storage when key matches', () => {
      const store = writable('myKey', {a: 1})
      const values: NumberDict[] = []

      const unsub = store.subscribe((value: NumberDict) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', {key: 'myKey', newValue: '{"a": 1, "b": 2}'})
      window.dispatchEvent(event)

      expect(values).toEqual([{a: 1}, {a: 1, b: 2}])

      unsub()
    })

    it('sets store to null when value is null', () => {
      const store = writable('myKey', {a: 1})
      const values: NumberDict[] = []

      const unsub = store.subscribe((value: NumberDict) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', {key: 'myKey', newValue: null})
      window.dispatchEvent(event)

      expect(values).toEqual([{a: 1}, null])

      unsub()
    })

    it("doesn't update store when key doesn't match", () => {
      const store = writable('myKey', 1)
      const values: number[] = []

      const unsub = store.subscribe((value: number) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', {key: 'unknownKey', newValue: '2'})
      window.dispatchEvent(event)

      expect(values).toEqual([1])

      unsub()
    })

    it("doesn't update store when there are no subscribers", () => {
      const store = writable('myKey', 1)
      const values: number[] = []

      const event = new StorageEvent('storage', {key: 'myKey', newValue: '2'})
      window.dispatchEvent(event)
      localStorage.setItem('myKey', '2')

      const unsub = store.subscribe((value: number) => {
        values.push(value)
      })

      expect(values).toEqual([2])

      unsub()
    })
  })
})
