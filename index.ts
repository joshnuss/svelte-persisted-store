import {writable as internal, type Writable} from 'svelte/store'

declare type Updater<T> = (value: T) => T;
declare type StoreDict<T> = { [key: string]: Writable<T> }

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Stores {
  local: StoreDict<any>,
  session: StoreDict<any>,
  cookie: StoreDict<any>,
}

const stores: Stores = {
  local: {},
  session: {},
  cookie: {},
}

export interface Serializer<T> {
  parse(text: string): T
  stringify(object: T): string
}

export interface CookieOptions {
  sameSite: "Strict" | "Lax" | "None"
  secure: boolean
  path: string
  expires: Date
}

export interface StoreOptions<T> {
  serializer?: Serializer<T>
  storage: 'local' | 'session' | 'cookie'
}

export interface LocalStoreOptions<T> extends StoreOptions<T> {
  storage: 'local' | 'session'
}

export interface CookieStoreOptions<T> extends StoreOptions<T> {
  storage: 'cookie'
  cookieOptions?: CookieOptions
}

export function getDefaultCookieOptions(): CookieOptions {
  const expires = new Date()
  expires.setFullYear(expires.getFullYear() + 1)

  return {
    sameSite: 'Strict',
    secure: true,
    path: "/",
    expires
  }
}

function getStorage(type: 'local' | 'session') {
  return type === 'local' ? localStorage : sessionStorage
}

function isBrowser(): boolean {
  return typeof (window) !== 'undefined' && typeof (document) !== 'undefined'
}

/** @deprecated `writable()` has been renamed to `localPersisted()` */
export function writable<T>(key: string, initialValue: T, options?: LocalStoreOptions<T>): Writable<T> {
  console.warn("writable() has been deprecated. Please use localPersisted() instead.\n\nchange:\n\nimport { writable } from 'svelte-persisted-store'\n\nto:\n\nimport { localPersisted } from 'svelte-persisted-store'")
  return localPersisted<T>(key, initialValue, options)
}

/** @deprecated `persisted()` has been renamed to `localPersisted()` */
export function persisted<T>(key: string, initialValue: T, options?: LocalStoreOptions<T>): Writable<T> {
  console.warn("persisted() has been deprecated. Please use localPersisted() instead.\n\nchange:\n\nimport { persisted } from 'svelte-persisted-store'\n\nto:\n\nimport { localPersisted } from 'svelte-persisted-store'")
  return localPersisted<T>(key, initialValue, options)
}

export function localPersisted<T>(key: string, initialValue: T, options?: LocalStoreOptions<T>): Writable<T> {
  const serializer = options?.serializer ?? JSON
  const storageType = options?.storage ?? 'local'
  const browser = isBrowser()
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

export function cookiePersisted<T>(key: string, initialValue: T, options?: CookieStoreOptions<T>): Writable<T> {
  const serializer: Serializer<T> = options?.serializer ?? JSON
  const browser = isBrowser()
  let cookieOptions = options?.cookieOptions ?? getDefaultCookieOptions()

  function setCookie(key: string, value: T) {
    if (!browser) return

    const json = serializer.stringify(value)

    let cookieString = `${key}=${json}; Expires=${cookieOptions.expires.toString()}; SameSite=${cookieOptions.sameSite}; Path=${cookieOptions.path}`
    if (cookieOptions.secure) {
      cookieString += "; Secure"
    }

    document.cookie = cookieString
  }

  function getCookie(key: string) {
    if (!browser) return

    return document.cookie
      .split("; ")
      .find((row) => row.startsWith(`${key}=`))
      ?.split('=')[1]
  }

  if (!stores.cookie[key]) {
    const existingCookie = getCookie(key)
    const startValue = existingCookie ? serializer.parse(existingCookie) : initialValue
    const store = internal(startValue)

    store.subscribe((value) => setCookie(key, value))

    return store
  }

  return stores.cookie[key]
}
