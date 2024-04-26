import { writable as internal, type Writable } from 'svelte/store'

declare type Updater<T> = (value: T) => T;
declare type StoreDict<T> = { [key: string]: Writable<T> }

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Stores {
  local: StoreDict<any>,
  session: StoreDict<any>,
}

const stores: Stores = {
  local: {},
  session: {}
}

export interface Serializer {
  parse(text: string): any
  stringify(object: any): string
}

export type StorageType = 'local' | 'session'

export interface Options<T> {
  serializer?: Serializer
  storage?: StorageType,
  syncTabs?: boolean,
  onError?: (e: unknown) => void
  onWriteError?: (e: unknown) => void
  onParseError?: (newValue: string | null, e: unknown) => void
  beforeRead?: (val: any) => T
  beforeWrite?: (val: T) => any
}

function getStorage(type: StorageType) {
  return type === 'local' ? localStorage : sessionStorage
}

/** @deprecated `writable()` has been renamed to `persisted()` */
export function writable<T>(key: string, initialValue: T, options?: Options<T>): Writable<T> {
  console.warn("writable() has been deprecated. Please use persisted() instead.\n\nchange:\n\nimport { writable } from 'svelte-persisted-store'\n\nto:\n\nimport { persisted } from 'svelte-persisted-store'")
  return persisted<T>(key, initialValue, options)
}
export function persisted<T>(key: string, initialValue: T, options?: Options<T>): Writable<T> {
  if (options?.onError) console.warn("onError has been deprecated. Please use onWriteError instead")

  const serializer = options?.serializer ?? JSON
  const storageType = options?.storage ?? 'local'
  const syncTabs = options?.syncTabs ?? true
  const onWriteError = options?.onWriteError ?? options?.onError ?? ((e) => console.error(`Error when writing value from persisted store "${key}" to ${storageType}`, e))
  const onParseError = options?.onParseError ?? ((newVal, e) => console.error(`Error when parsing ${newVal ? '"' + newVal + '"' : "value"} from persisted store "${key}"`, e))

  const beforeRead = options?.beforeRead ?? ((val) => val as T)
  const beforeWrite = options?.beforeWrite ?? ((val) => val as any)

  const browser = typeof (window) !== 'undefined' && typeof (document) !== 'undefined'
  const storage = browser ? getStorage(storageType) : null

  function updateStorage(key: string, value: T) {
    const newVal = beforeWrite(value)
    try {
      storage?.setItem(key, serializer.stringify(newVal))
    } catch (e) {
      onWriteError(e)
    }
  }

  function maybeLoadInitial(): T {
    function serialize(json: any) {
      try {
        return <T>serializer.parse(json)
      } catch (e) {
        onParseError(json, e)
      }
    }
    const json = storage?.getItem(key)

    return json ? beforeRead(serialize(json)) : initialValue
  }

  if (!stores[storageType][key]) {
    const initial = maybeLoadInitial()
    const store = internal(initial, (set) => {
      if (browser && storageType == 'local' && syncTabs) {
        const handleStorage = (event: StorageEvent) => {
          if (event.key === key && event.newValue) {
            let newVal: any
            try {
              newVal = serializer.parse(event.newValue)
            } catch (e) {
              onParseError(event.newValue, e)
              return
            }
            const processedVal = beforeRead(newVal)
            set(processedVal)
          }
        }

        window.addEventListener("storage", handleStorage)

        return () => window.removeEventListener("storage", handleStorage)
      }
    })

    const { subscribe, set } = store

    stores[storageType][key] = {
      set(value: T) {
        set(value)
        updateStorage(key, value)
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
