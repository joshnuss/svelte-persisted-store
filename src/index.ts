import {writable as internal, get} from 'svelte/store'
import { Writable } from 'svelte/store'
declare type Updater<T> = (value: T) => T;

export function writable<T>(key: string, initialValue: T): Writable<T> {
  
  const store = internal(initialValue, (set) => {
    const browser = typeof(localStorage) != 'undefined'
    const json = browser ? localStorage.getItem(key) : null

    if (json) {
      set(<T> JSON.parse(json))
    }

    if (browser) {
      const handleStorage = (event: StorageEvent) => {
        if (event.key === key)
          set(event.newValue ? JSON.parse(event.newValue) : null)
      }

      window.addEventListener("storage", handleStorage)

      return () => window.removeEventListener("storage", handleStorage)
    }
  })

  const {subscribe, set} = store

  function updateStorage(key: string, value: T) {
    if (typeof(localStorage) == 'undefined')
      return

    localStorage.setItem(key, JSON.stringify(value))
  }

  return {
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
