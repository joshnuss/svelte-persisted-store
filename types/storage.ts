/**
 * Defines the storage types that were available before the introduction of IndexedDB support.
 * This type is associated with the deprecated `persisted()` function.
 */
export type StorageType = "local" | "session";

/**
 * Interface representing a serializer.
 *
 * @template T - The type of the object to be serialized/deserialized.
 */
export interface Serializer<T> {
  /**
   * Parses a string and returns an object of type T.
   *
   * @param text - The string to parse.
   * @returns The parsed object.
   */
  parse(text: string): T;

  /**
   * Converts an object of type T to a string.
   *
   * @param object - The object to stringify.
   * @returns The stringified object.
   */
  stringify(object: T): string;
}
