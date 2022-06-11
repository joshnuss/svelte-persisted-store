import { writable } from '../index'
import { get } from 'svelte/store'

beforeEach(() => localStorage.clear())

describe('writable()', () => {
  test('uses initial value if nothing in local storage', () => {
    const store = writable('myKey', 123)
    const value = get(store)

    expect(value).toEqual(123)
  })

  test('uses existing value if data already in local storage', () => {
    localStorage.setItem('myKey2', '"existing"')

    const store = writable('myKey2', 'initial')
    const value = get(store)

    expect(value).toEqual('existing')
  })

  describe('set()', () => {
    test('replaces old value', () => {
      localStorage.setItem('myKey3', '"existing"')

      const store = writable('myKey3', '')
      store.set('new-value')
      const value = get(store)

      expect(localStorage.myKey3).toEqual('"new-value"')
      expect(value).toEqual('new-value')
    })

    test('adds new value', () => {
      const store = writable('myKey4', '')
      store.set('new-value')
      const value = get(store)

      expect(localStorage.myKey4).toEqual('"new-value"')
      expect(value).toEqual('new-value')
    })
  })

  describe('update()', () => {
    test('replaces old value', () => {
      localStorage.setItem('myKey5', '123')

      const store = writable('myKey5', 0)
      store.update(n => n + 1)
      const value = get(store)

      expect(localStorage.myKey5).toEqual('124')
      expect(value).toEqual(124)
    })

    test('adds new value', () => {
      const store = writable('myKey6', 123)
      store.update(n => n + 1)
      const value = get(store)

      expect(localStorage.myKey6).toEqual('124')
      expect(value).toEqual(124)
    })
  })

  describe('subscribe()', () => {
    it('publishes updates', () => {
      const store = writable('myKey7', 123)
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

  it('handles duplicate stores with the same key', () => {
    const store1 = writable('same-key', 1)
    const values1: number[] = []

    const unsub1 = store1.subscribe(value => {
      values1.push(value)
    })

    store1.set(2)

    const store2 = writable('same-key', 99)
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

  describe('handles window.storage event', () => {
    type NumberDict = { [key: string] : number }

    it('sets storage when key matches', () => {
      const store = writable('myKey8', {a: 1})
      const values: NumberDict[] = []

      const unsub = store.subscribe((value: NumberDict) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', {key: 'myKey8', newValue: '{"a": 1, "b": 2}'})
      window.dispatchEvent(event)

      expect(values).toEqual([{a: 1}, {a: 1, b: 2}])

      unsub()
    })

    it('sets store to null when value is null', () => {
      const store = writable('myKey9', {a: 1})
      const values: NumberDict[] = []

      const unsub = store.subscribe((value: NumberDict) => {
        values.push(value)
      })

      const event = new StorageEvent('storage', {key: 'myKey9', newValue: null})
      window.dispatchEvent(event)

      expect(values).toEqual([{a: 1}, null])

      unsub()
    })

    it("doesn't update store when key doesn't match", () => {
      const store = writable('myKey10', 1)
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

  describe('to/from JSON', () => {
    interface Entity {
      date: Date;
    }
    interface EntityJSON {
      date: string;
    }

    function toJSON(entity: Entity): EntityJSON {
      return {
        date: entity.date.toJSON()
      }
    } 

    function fromJSON(entity: EntityJSON): Entity {
      return {
        date: new Date(entity.date)
      }
    } 

    it('uses to/from JSON to convert value before setting', () => {
      const store = writable<Entity>('myKey11', { date: new Date('2020-01-01') }, fromJSON, toJSON)

      const initial = get(store)
      store.set({ date: new Date('2021-01-01') })
      const current = get(store)

      expect(initial).toEqual({ date: new Date('2020-01-01') })
      expect(current).toEqual({ date: new Date('2021-01-01') })
    })
  })
})
