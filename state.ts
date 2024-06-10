import { writable as internal, get } from "svelte/store";
import { Persisted, Stores, Updater } from "./types/store";
import { OptionsWithRequiredStorage } from "./types/options";

function maybeLoadInitial<StoreType, SerializerType>(
  key: string,
  initialValue: StoreType,
  options: OptionsWithRequiredStorage<StoreType, SerializerType> | undefined
): StoreType {
  const serializer = options?.serializer ?? JSON;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function serialize(json: any) {
    try {
      return <SerializerType>serializer.parse(json);
    } catch (e) {
      onParseError(json, e);
    }
  }
  const storageType = options?.storage;
  const browser =
    typeof window !== "undefined" && typeof document !== "undefined";
  const storage: Storage | null = browser
    ? storageType == "local"
      ? localStorage
      : sessionStorage
    : null;
  const json = storage?.getItem(key);
  if (json == null) return initialValue;

  const serialized = serialize(json);
  if (serialized == null) return initialValue;

  const newVal = beforeRead(serialized);
  return newVal;
}

function updateStorage<StoreType, SerializerType>(
  key: string,
  value: StoreType,
  options: OptionsWithRequiredStorage<StoreType, SerializerType> | undefined
) {
  const serializer = options?.serializer ?? JSON;
  const onWriteError =
    options?.onWriteError ??
    ((e) =>
      console.error(
        `Error when writing value from persisted store "${key}" to local`,
        e
      ));
  const beforeWrite =
    options?.beforeWrite ?? ((val) => val as unknown as SerializerType);
  const storageType = options?.storage;
  const browser =
    typeof window !== "undefined" && typeof document !== "undefined";
  const storage: Storage | null = browser
    ? storageType == "local"
      ? localStorage
      : sessionStorage
    : null;
  const newVal = beforeWrite(value);
  try {
    storage?.setItem(key, serializer.stringify(newVal));
  } catch (e) {
    onWriteError(e);
  }
}

export default function createState<StoreType, SerializerType = StoreType>(
  key: string,
  initialValue: StoreType,
  stores: Stores,
  options: OptionsWithRequiredStorage<StoreType, SerializerType>
): Persisted<StoreType> {
  if (options?.onError)
    console.warn(
      "onError has been deprecated. Please use onWriteError instead"
    );

  const serializer = options?.serializer ?? JSON;
  const syncTabs = options?.syncTabs ?? true;
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

  const storageType = options.storage;

  const browser =
    typeof window !== "undefined" && typeof document !== "undefined";

  if (!stores[storageType][key]) {
    const initial: StoreType = maybeLoadInitial(key, initialValue, options);
    const store = internal(initial, (set) => {
      if (browser && storageType == "local" && syncTabs) {
        const handleStorage = (event: StorageEvent) => {
          if (event.key === key && event.newValue) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      set(value: StoreType) {
        set(value);
        updateStorage(key, value, options);
      },
      update(callback: Updater<StoreType>) {
        // this is more concise than store.update
        this.set(callback(get(store)));
      },
      reset() {
        this.set(initialValue);
      },
      subscribe,
    };
  }
  return stores[storageType][key];
}
