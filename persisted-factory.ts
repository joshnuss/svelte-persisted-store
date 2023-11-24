import {writable as internal, type Writable} from 'svelte/store'

declare type Updater<T> = (value: T) => T;
declare type StoreDict<T> = Record<string, Writable<T>>;

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

export interface PersistedStorage {
  getItem(key: string): string | null;
  removeItem(key: string): void;
  setItem(key: string, value: string): void;
}

export interface Options<T> {
  serializer?: Serializer<T>
  storage?: StorageType
}

/**
 * Returns the specified storage object.
 * @param type Type of storage needed.
 * @returns The needed storage object.
 */
export function prodGetStorage(type: StorageType): PersistedStorage {
  return type === 'local' ? globalThis?.localStorage : globalThis?.sessionStorage
}

/**
 * Determines if the current execution is happening in the browser.
 * @returns `true` if code is running in the browser, or `false` otherwise.
 */
export function prodIsBrowser() {
  return typeof(globalThis?.window) !== 'undefined' && typeof(globalThis?.document) !== 'undefined'
}

/**
 * Create a `persisted()` function that uses the provided dependencies in its implementation.
 * @param getStorage Storage object provider function.
 * @param isBrowser Browser tester function.
 * @returns The `persisted()` function that uses the prvodided dependencies.
 */
export function persistedFactory(getStorage: typeof prodGetStorage, isBrowser: typeof prodIsBrowser) {
  return function<T>(key: string, initialValue: T, options?: Options<T>): Writable<T> {
    const serializer = options?.serializer ?? JSON
    const storageType = options?.storage ?? 'local'
    const storage = isBrowser() ? getStorage(storageType) : null
  
    function updateStorage(key: string, value: T) {
      storage?.setItem(key, serializer.stringify(value))
    }
  
    if (!stores[storageType][key]) {
      const store = internal(initialValue, (set: (v: T) => void) => {
        const json = storage?.getItem(key)
  
        if (json) {
          set(<T>serializer.parse(json))
        }
  
        if (isBrowser() && storageType == 'local') {
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
          return store.update((last: T) => {
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
}
