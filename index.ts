import { get, writable as internal, type Writable } from "svelte/store";
if (process.env.NODE_ENV === "test" || process.env.NODE_ENV === "development") {
  require("fake-indexeddb/auto");
}
import localforage from "localforage";
declare type StoreDict<T> = { [key: string]: Persisted<T> };
declare type Updater<T> = (value: T) => T;

interface Persisted<T> extends Writable<T> {
  set: (this: void, value: T) => Promise<void>;
  reset: () => Promise<void>;
  update: (callback: Updater<T>) => Promise<void>;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
interface Stores {
  local: StoreDict<any>;
  session: StoreDict<any>;
  indexedDB: StoreDict<any>;
}

const stores: Stores = {
  local: {},
  session: {},
  indexedDB: {},
};

export interface Serializer<T> {
  parse(text: string): T;
  stringify(object: T): string;
}

export type StorageType = "local" | "session" | "indexedDB";

export interface Options<StoreType, SerializerType> {
  serializer?: Serializer<SerializerType>;
  storage?: StorageType;
  syncTabs?: boolean;
  onError?: (e: unknown) => void;
  onWriteError?: (e: unknown) => void;
  onParseError?: (newValue: string | null, e: unknown) => void;
  beforeRead?: (val: SerializerType) => StoreType;
  beforeWrite?: (val: StoreType) => SerializerType;
}

async function getStorage(type: StorageType) {
  let storage: LocalForage | Storage | null;
  try {
    storage = type === "session" ? window.sessionStorage : localforage;
    if (type === "local") await storage.setDriver(localforage.LOCALSTORAGE);
    if (type === "indexedDB") await storage.setDriver(localforage.INDEXEDDB);
  } catch (error) {
    storage = null;
  }
  return storage;
}

/** @deprecated `writable()` has been renamed to `persisted()` */
export async function writable<StoreType, SerializerType = StoreType>(
  key: string,
  initialValue: StoreType,
  options?: Options<StoreType, SerializerType>
): Promise<Persisted<StoreType>> {
  console.warn(
    "writable() has been deprecated. Please use persisted() instead.\n\nchange:\n\nimport { writable } from 'svelte-persisted-store'\n\nto:\n\nimport { persisted } from 'svelte-persisted-store'"
  );
  return await persisted<StoreType, SerializerType>(key, initialValue, options);
}
export async function persisted<StoreType, SerializerType = StoreType>(
  key: string,
  initialValue: StoreType,
  options?: Options<StoreType, SerializerType>
): Promise<Persisted<StoreType>> {
  if (options?.onError)
    console.warn(
      "onError has been deprecated. Please use onWriteError instead"
    );

  const serializer = options?.serializer ?? JSON;
  const storageType = options?.storage ?? "local";
  const syncTabs = options?.syncTabs ?? true;
  const onWriteError =
    options?.onWriteError ??
    options?.onError ??
    ((e) =>
      console.error(
        `Error when writing value from persisted store "${key}" to ${storageType}`,
        e
      ));
  const onParseError =
    options?.onParseError ??
    ((newVal, e) =>
      console.error(
        `Error when parsing ${
          newVal ? '"' + newVal + '"' : "value"
        } from persisted store "${key}"`,
        e
      ));

  const beforeRead =
    options?.beforeRead ?? ((val) => val as unknown as StoreType);
  const beforeWrite =
    options?.beforeWrite ?? ((val) => val as unknown as SerializerType);

  const browser =
    typeof window !== "undefined" && typeof document !== "undefined";
  const storage: Storage | LocalForage | null = browser
    ? await getStorage(storageType)
    : null;
  async function updateStorage(key: string, value: StoreType) {
    const newVal = beforeWrite(value);
    try {
      await storage?.setItem(key, serializer.stringify(newVal));
    } catch (e) {
      onWriteError(e);
    }
  }

  async function maybeLoadInitial(): Promise<StoreType> {
    function serialize(json: any) {
      try {
        return <SerializerType>serializer.parse(json);
      } catch (e) {
        onParseError(json, e);
      }
    }
    const json = await storage?.getItem(key);
    if (json == null) return initialValue;

    const serialized = serialize(json);
    if (serialized == null) return initialValue;

    const newVal = beforeRead(serialized);
    return newVal;
  }

  if (!stores[storageType][key]) {
    const initial: StoreType = await maybeLoadInitial();
    const store = internal(initial, (set) => {
      if (browser && storageType == "local" && syncTabs) {
        const handleStorage = async (event: StorageEvent) => {
          if (event.key === key && event.newValue) {
            let newVal: any;
            try {
              newVal = serializer.parse(event.newValue);
            } catch (e) {
              onParseError(event.newValue, e);
              return;
            }
            const processedVal = beforeRead(newVal);

            set(processedVal);
          }
        };

        window.addEventListener("storage", handleStorage);

        return () => window.removeEventListener("storage", handleStorage);
      }
    });

    const { subscribe, set } = store;

    stores[storageType][key] = {
      async set(value: StoreType) {
        set(value);
        await updateStorage(key, value);
      },
      async update(callback: Updater<StoreType>) {
        // this is more concise than store.update
        await this.set(callback(get(store)));
      },
      async reset() {
        await this.set(initialValue);
      },
      subscribe,
    };
  }
  return stores[storageType][key];
}
