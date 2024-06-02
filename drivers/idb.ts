export default class indexedDB<T> {
  private defaultDb;
  private defaultVersion;
  private defaultObjectStore;
  constructor() {
    this.defaultDb = "svelte-persisted-store";
    this.defaultVersion = 1;
    this.defaultObjectStore = "keyvaluepairs";
  }
  public getItem(key: string): Promise<string | null> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(
        this.defaultDb,
        this.defaultVersion
      );
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(this.defaultObjectStore, "readonly");
        const store = tx.objectStore(this.defaultObjectStore);
        const getRequest = store.get(key);
        getRequest.onerror = () => reject(getRequest.error);
        getRequest.onsuccess = () => resolve(getRequest.result);
      };
    });
  }
  public setItem(key: string, value: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = window.indexedDB.open(
        this.defaultDb,
        this.defaultVersion
      );
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.defaultObjectStore))
          db.createObjectStore(this.defaultObjectStore);
      };
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(this.defaultObjectStore, "readwrite");
        const store = tx.objectStore(this.defaultObjectStore);
        const putRequest = store.put(value, key);
        putRequest.onerror = () => reject(putRequest.error);
        putRequest.onsuccess = () => resolve();
      };
    });
  }
}
