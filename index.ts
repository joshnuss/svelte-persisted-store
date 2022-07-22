import {writable as internal, get, Writable} from 'svelte/store'

declare type Updater<T> = (value: T) => T;
declare type StoreDict<T> = { [key: string]: Writable<T> }

/* eslint-disable @typescript-eslint/no-explicit-any */
const stores: StoreDict<any> = {}

export function writable<T>(key: string, initialValue: T, options?: { serialize?: (value: T) => string, deserialize?: (s: string) => T }): Writable<T> {
  const browser = typeof(localStorage) != 'undefined'
  const serialize = options?.serialize || JSON.stringify
  const deserialize = options?.deserialize || JSON.parse

  function updateStorage(key: string, value: T) {
    if (!browser) return

    localStorage.setItem(key, serialize(value))
  }

  if (!stores[key]) {
    const store = internal(initialValue, (set) => {
      const json = browser ? localStorage.getItem(key) : null

      if (json) {
        set(<T>deserialize(json))
      }

      if (browser) {
        const handleStorage = (event: StorageEvent) => {
          if (event.key === key)
            set(event.newValue ? deserialize(event.newValue) : null)
        }

        window.addEventListener("storage", handleStorage)

        return () => window.removeEventListener("storage", handleStorage)
      }
    })

    const {subscribe, set} = store

    stores[key] = {
      set(value: T) {
        updateStorage(key, value)
        set(value)
      },
      update(updater: Updater<T>) {
        const value = updater(get(store))

        updateStorage(key, value)
        set(value)
      },
      subscribe
    }
  }

  return stores[key]
}
