import type { Serializer, StorageType } from "./storage";

export interface Options<StoreType, SerializerType> {
  serializer?: Serializer<SerializerType>;
  syncTabs?: boolean;
  onError?: (e: unknown) => void;
  onWriteError?: (e: unknown) => void;
  onParseError?: (newValue: string | null, e: unknown) => void;
  beforeRead?: (val: SerializerType) => StoreType;
  beforeWrite?: (val: StoreType) => SerializerType;
}

export interface OptionsWithRequiredStorage<StoreType, SerializerType>
  extends Options<StoreType, SerializerType> {
  storage: StorageType;
}

export interface DeprecatedOptions<StoreType, SerializerType>
  extends Options<StoreType, SerializerType> {
  storage?: StorageType;
}
