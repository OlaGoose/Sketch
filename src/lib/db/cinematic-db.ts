/**
 * IndexedDB persistence for Cinematic Sketch.
 * Stores gallery items (images, audio, text) without localStorage size limits.
 */

import type { GalleryItem } from '@/types';

const DB_NAME = 'cinematic-sketch-db';
const DB_VERSION = 1;
const STORE_GALLERY = 'gallery';
const KEY_PATH = 'id';

function openDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.reject(new Error('IndexedDB not available'));
  }
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_GALLERY)) {
        db.createObjectStore(STORE_GALLERY, { keyPath: KEY_PATH });
      }
    };
  });
}

/**
 * Read all gallery items from IndexedDB (order not guaranteed; sort by timestamp in app).
 */
export function getGallery(): Promise<GalleryItem[]> {
  return openDB().then(
    (db) =>
      new Promise<GalleryItem[]>((resolve, reject) => {
        const tx = db.transaction(STORE_GALLERY, 'readonly');
        const store = tx.objectStore(STORE_GALLERY);
        const request = store.getAll();
        request.onsuccess = () => {
          const items = (request.result ?? []) as GalleryItem[];
          items.sort((a, b) => b.timestamp - a.timestamp);
          resolve(items);
        };
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

/**
 * Replace entire gallery in IndexedDB (clear + put all). Single write transaction.
 */
export function setGallery(items: GalleryItem[]): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_GALLERY, 'readwrite');
        const store = tx.objectStore(STORE_GALLERY);
        store.clear();
        for (const item of items) {
          store.put(item);
        }
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

/**
 * Remove all gallery items (for persist removeItem).
 */
export function clearGallery(): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_GALLERY, 'readwrite');
        const store = tx.objectStore(STORE_GALLERY);
        const request = store.clear();
        request.onsuccess = () => {
          tx.oncomplete = () => {
            db.close();
            resolve();
          };
        };
        request.onerror = () => {
          db.close();
          reject(request.error);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}
