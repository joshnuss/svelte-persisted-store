import { get, writable as internal } from "svelte/store";
import indexedDB from "./drivers/idb";
import { AsyncPersisted, Persisted, Stores } from "./types/store";
import { Options, DeprecatedOptions } from "./types/options";
import createState from "./state";
if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
  // structured-clone is not supported in jsdom
  require("core-js/stable/structured-clone");
  require("fake-indexeddb/auto");
}

const stores: Stores = {
  local: {},
  session: {},
  indexedDB: {},
};

/**
 * @deprecated `writable()` has been renamed to `persisted()`
 * @param {string} key - The key for the store.
 * @param {StoreType} initialValue - The initial value for the store.
 * @param {Options<StoreType, SerializerType>} options - The options for the store.
 * @returns {Persisted<StoreType>} - The persisted store.
 */
export function writable<StoreType, SerializerType = StoreType>(
  key: string,
  initialValue: StoreType,
  options?: Options<StoreType, SerializerType>
): Persisted<StoreType> {
  console.warn(
    "writable() has been deprecated. Please use localState() instead.\n\nchange:\n\nimport { writable } from 'svelte-persisted-store'\n\nto:\n\nimport { persisted } from 'svelte-persisted-store'"
  );
  return persisted<StoreType, SerializerType>(key, initialValue, options);
}

/**
 * @deprecated `persisted()` has been deprecated.
 * @param {string} key - The key for the store.
 * @param {StoreType} initialValue - The initial value for the store.
 * @param {DeprecatedOptions<StoreType, SerializerType>} options - The options for the store.
 * @returns {Persisted<StoreType>} - The persisted store.
 */
export function persisted<StoreType, SerializerType = StoreType>(
  key: string,
  initialValue: StoreType,
  options?: DeprecatedOptions<StoreType, SerializerType>
): Persisted<StoreType> {
  console.warn(
    "persisted() has been deprecated. Please use localState() or sessionState()) instead."
  );
  const storageType = options?.storage || "local";
  switch (storageType) {
    case "local":
      return localState(key, initialValue, options);
    case "session":
      return sessionState(key, initialValue, options);
    default:
      throw new Error("Invalid storage type. Please use 'local' or 'session'");
  }
}
/**
 * Creates a local state.
 * @param {string} key - The key for the store.
 * @param {StoreType} initialValue - The initial value for the store.
 * @param {Options<StoreType, SerializerType>} options - The options for the store.
 * @returns {Persisted<StoreType>} - The persisted store.
 */
export function localState<StoreType, SerializerType = StoreType>(
  key: string,
  initialValue: StoreType,
  options?: Options<StoreType, SerializerType>
): Persisted<StoreType> {
  return createState(key, initialValue, stores, {
    ...options,
    storage: "local",
  });
}
/**
 * Creates a session state.
 * @param {string} key - The key for the store.
 * @param {StoreType} initialValue - The initial value for the store.
 * @param {Options<StoreType, SerializerType>} options - The options for the store.
 * @returns {Persisted<StoreType>} - The persisted store.
 */
export function sessionState<StoreType, SerializerType = StoreType>(
  key: string,
  initialValue: StoreType,
  options?: Options<StoreType, SerializerType>
): Persisted<StoreType> {
  return createState(key, initialValue, stores, {
    ...options,
    storage: "session",
  });
}
/**
 * Creates an IndexedDB state.
 * @param {string} key - The key for the store.
 * @param {T} initialValue - The initial value for the store.
 * @returns {Promise<Persisted<T> | AsyncPersisted<T>>} - The persisted store.
 */
export async function indexedDBState<T>(
  key: string,
  initialValue: T
): Promise<Persisted<T> | AsyncPersisted<T>> {
  const store = internal(initialValue);
  const { subscribe } = store;
  const storage = new indexedDB();

  stores["indexedDB"][key] = {
    async set(value: T): Promise<void> {
      store.set(value);
      await storage.setItem(key, value);
    },

    async update(updater: (value: T) => T): Promise<void> {
      const updatedValue = updater(get(store));
      await this.set(updatedValue);
    },

    async reset(): Promise<void> {
      this.set(initialValue);
    },
    subscribe,
  };
  return stores["indexedDB"][key];
}
