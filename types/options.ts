import type { Serializer, StorageType } from "./storage";

/**
 * Options interface with optional properties for customizing the store behavior.
 *
 * @template StoreType - The type of the store.
 * @template SerializerType - The type of the serializer.
 */
export interface Options<StoreType, SerializerType> {
  /** Optional serializer for custom serialization logic. */
  serializer?: Serializer<SerializerType>;
  /** If true, synchronizes the store across multiple tabs. */
  syncTabs?: boolean;
  /** Callback function to handle errors. */
  onError?: (e: unknown) => void;
  /** Callback function to handle write errors. */
  onWriteError?: (e: unknown) => void;
  /** Callback function to handle parse errors. */
  onParseError?: (newValue: string | null, e: unknown) => void;
  /** Function to process values before reading from the store. */
  beforeRead?: (val: SerializerType) => StoreType;
  /** Function to process values before writing to the store. */
  beforeWrite?: (val: StoreType) => SerializerType;
}

/**
 * Options interface with required storage property.
 *
 * @template StoreType - The type of the store.
 * @template SerializerType - The type of the serializer.
 */
export interface OptionsWithRequiredStorage<StoreType, SerializerType>
  extends Options<StoreType, SerializerType> {
  /** Required storage type. */
  storage: StorageType;
}

/**
 * Deprecated options interface with optional storage property.
 *
 * @template StoreType - The type of the store.
 * @template SerializerType - The type of the serializer.
 */
export interface DeprecatedOptions<StoreType, SerializerType>
  extends Options<StoreType, SerializerType> {
  /** Optional storage type. */
  storage?: StorageType;
}
