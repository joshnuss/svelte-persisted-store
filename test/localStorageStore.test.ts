import { writable } from '../src/index'
import { get } from 'svelte/store'
// import { writable } from 'svelte/store'

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
})
