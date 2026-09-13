import type { ProjectRecord, ProjectStore } from './ProjectStore';
import { upgradeOnList, upgradeOnRead } from './upgradeOnRead';

const DB_NAME = 'sandbox-editor';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction aborted'));
  });
}

/**
 * Browser-backed project library. Opens a single object store keyed by
 * `ProjectRecord.id`.
 */
export class IndexedDbProjectStore implements ProjectStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private open(): Promise<IDBDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error('Failed to open IndexedDB database'));
      });
    }
    return this.dbPromise;
  }

  public async list(): Promise<ProjectRecord[]> {
    const db = await this.open();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const records = await requestToPromise(store.getAll() as IDBRequest<unknown[]>);
    await transactionDone(tx);
    return upgradeOnList(records, (record) => this.save(record));
  }

  public async get(id: string): Promise<ProjectRecord | null> {
    const db = await this.open();
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const record = await requestToPromise(store.get(id) as IDBRequest<unknown>);
    await transactionDone(tx);
    return upgradeOnRead(record, (next) => this.save(next));
  }

  public async save(record: ProjectRecord): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(record);
    await transactionDone(tx);
  }

  public async delete(id: string): Promise<void> {
    const db = await this.open();
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(id);
    await transactionDone(tx);
  }
}
