import { Writable } from "svelte/store";
import { type Options, persistedFactory, prodGetStorage, prodIsBrowser } from "./persisted-factory.js";

/**
 * Factory function that creates Svelte writable stores backed up by persistent storage.  See the 
 * [documentation](https://github.com/joshnuss/svelte-persisted-store) for more details.
 * @param key {string} The key (unique name) to give to the value inside the persisted storage.
 * @param initialValue {T} The store's initial value.  It is used on first storage read if the storage doesn't have a 
 * value to offer for the specified key.
 * @param options {Options<T>} Optional options to fine tune the store's behavior.
 * @return {Writable<T>} A new Svelte writable store backed up by persisted storage.
 * @template T
 */
export const persisted = persistedFactory(prodGetStorage, prodIsBrowser);

/** @deprecated `writable()` has been renamed to `persisted()` */
export function writable<T>(key: string, initialValue: T, options?: Options<T>): Writable<T> {
  console.warn("writable() has been deprecated. Please use persisted() instead.\n\nchange:\n\nimport { writable } from 'svelte-persisted-store'\n\nto:\n\nimport { persisted } from 'svelte-persisted-store'")
  return persisted<T>(key, initialValue, options)
}
