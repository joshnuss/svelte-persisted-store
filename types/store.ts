import { type Writable } from "svelte/store";

/**
 * Type representing an updater function.
 *
 * @template T - The type of the value to be updated.
 */
export type Updater<T> = (value: T) => T;

/**
 * Interface representing the different types of stores.
 */
export interface Stores {
  /** Local storage dictionary. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  local: StoreDict<any>;
  /** Session storage dictionary. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: StoreDict<any>;
  /** IndexedDB storage dictionary. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indexedDB: StoreDict<any>;
}

/**
 * Type representing a dictionary of persisted stores.
 *
 * @template T - The type of the value in the store.
 */
export type StoreDict<T> = {
  [key: string]: Persisted<T> | AsyncPersisted<T>;
};

/**
 * Interface representing an asynchronous persisted store.
 *
 * @template T - The type of the value in the store.
 */
export interface AsyncPersisted<T> extends Writable<T> {
  /**
   * Asynchronously sets the value of the store.
   *
   * @param value - The new value.
   */
  set: (this: void, value: T) => Promise<void>;
  /** Asynchronously resets the store to its initial value. */
  reset: () => Promise<void>;
  /**
   * Asynchronously updates the value of the store using a callback function.
   *
   * @param callback - The updater function.
   */
  update: (callback: Updater<T>) => Promise<void>;
}

/**
 * Interface representing a persisted store.
 *
 * @template T - The type of the value in the store.
 */
export interface Persisted<T> extends Writable<T> {
  /**
   * Sets the value of the store.
   *
   * @param value - The new value.
   */
  set: (this: void, value: T) => void;
  /** Resets the store to its initial value. */
  reset: () => void;
  /**
   * Updates the value of the store using a callback function.
   *
   * @param callback - The updater function.
   */
  update: (callback: Updater<T>) => void;
}
