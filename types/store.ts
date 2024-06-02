import { type Writable } from "svelte/store";

export type Updater<T> = (value: T) => T;
export interface Stores {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  local: StoreDict<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: StoreDict<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indexedDB: StoreDict<any>;
}

export type StoreDict<T> = {
  [key: string]: Persisted<T> | AsyncPersisted<T>;
};
export interface AsyncPersisted<T> extends Writable<T> {
  set: (this: void, value: T) => Promise<void>;
  reset: () => Promise<void>;
  update: (callback: Updater<T>) => Promise<void>;
}

export interface Persisted<T> extends Writable<T> {
  set: (this: void, value: T) => void;
  reset: () => void;
  update: (callback: Updater<T>) => void;
}

export interface Stores {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  local: StoreDict<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: StoreDict<any>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  indexedDB: StoreDict<any>;
}
