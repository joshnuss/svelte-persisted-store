import {writable as internal, type Writable} from 'svelte/store'

declare type Updater<T> = (value: T) => T;
declare type StoreDict<T> = { [key: string]: Writable<T> }

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Stores {
  local: StoreDict<any>,
  session: StoreDict<any>,
}

const stores : Stores = {
  local: {},
  session: {}
}

export interface Serializer<T> {
  parse(text: string): T
  stringify(object: T): string
}

export type StorageType = 'local' | 'session'

export interface Options<T> {
  serializer?: Serializer<T>
  storage?: StorageType
}

function getStorage(type: StorageType) {
  return type === 'local' ? localStorage : sessionStorage
}

/** @deprecated `writable()` has been renamed to `localPersisted()` */
export function writable<T>(key: string, initialValue: T, options?: Options<T>): Writable<T> {
  console.warn("writable() has been deprecated. Please use localPersisted() instead.\n\nchange:\n\nimport { writable } from 'svelte-persisted-store'\n\nto:\n\nimport { localPersisted } from 'svelte-persisted-store'")
  return localPersisted<T>(key, initialValue, options)
}

/** @deprecated `persisted()` has been renamed to `localPersisted()` */
export function persisted<T>(key: string, initialValue: T, options?: Options<T>): Writable<T> {
  console.warn("persisted() has been deprecated. Please use localPersisted() instead.\n\nchange:\n\nimport { persisted } from 'svelte-persisted-store'\n\nto:\n\nimport { localPersisted } from 'svelte-persisted-store'")
  return localPersisted<T>(key, initialValue, options)
}

export function localPersisted<T>(key: string, initialValue: T, options?: Options<T>): Writable<T> {
  const serializer = options?.serializer ?? JSON
  const storageType = options?.storage ?? 'local'
  const browser = typeof (window) !== 'undefined' && typeof (document) !== 'undefined'
  const storage = browser ? getStorage(storageType) : null

  function updateStorage(key: string, value: T) {
    storage?.setItem(key, serializer.stringify(value))
  }

  if (!stores[storageType][key]) {
    const store = internal(initialValue, (set) => {
      const json = storage?.getItem(key)

      if (json) {
        set(<T>serializer.parse(json))
      }

      if (browser && storageType == 'local') {
        const handleStorage = (event: StorageEvent) => {
          if (event.key === key)
            set(event.newValue ? serializer.parse(event.newValue) : null)
        }

        window.addEventListener("storage", handleStorage)

        return () => window.removeEventListener("storage", handleStorage)
      }
    })

    const {subscribe, set} = store

    stores[storageType][key] = {
      set(value: T) {
        updateStorage(key, value)
        set(value)
      },
      update(callback: Updater<T>) {
        return store.update((last) => {
          const value = callback(last)

          updateStorage(key, value)

          return value
        })
      },
      subscribe
    }
  }

  return stores[storageType][key]
}
