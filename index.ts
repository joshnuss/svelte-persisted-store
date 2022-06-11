import {writable as internal, get, Writable} from 'svelte/store'

declare type Updater<T> = (value: T) => T;
declare type StoreDict<T> = { [key: string]: Writable<T> }

/* eslint-disable @typescript-eslint/no-explicit-any */
const stores: StoreDict<any> = {}

export type IFromJSON<T> = (json: any) => T;
export type IToJSON<T> = (value: T) => any;

function defaultFromJSON<T>(json: any): T {
  return json;
}

function defaultToJSON<T>(value: T): any {
  return value;
}

export function writable<T>(
  key: string, 
  initialValue: T,
  fromJSON: IFromJSON<T> = defaultFromJSON,
  toJSON: IToJSON<T> = defaultToJSON
): Writable<T> {
  const browser = typeof(localStorage) != 'undefined'

  function updateStorage(key: string, value: T) {
    if (!browser) return

    localStorage.setItem(key, JSON.stringify(toJSON(value)))
  }

  if (!stores[key]) {
    const store = internal(initialValue, (set) => {
      const json = browser ? localStorage.getItem(key) : null

      if (json) {
        set(fromJSON(JSON.parse(json)))
      }

      if (browser) {
        const handleStorage = (event: StorageEvent) => {
          if (event.key === key)
            set(event.newValue ? fromJSON(JSON.parse(event.newValue)) : null as unknown as T)
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
