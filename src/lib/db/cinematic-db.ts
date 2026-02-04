/**
 * IndexedDB persistence for Cinematic Sketch.
 * Stores gallery items (images, audio, text) without localStorage size limits.
 * Also stores storybooks and pages for the new picture book system.
 */

import type { GalleryItem, Storybook, StorybookPage } from '@/types';

const DB_NAME = 'cinematic-sketch-db';
const DB_VERSION = 2; // Incremented for new object stores
const STORE_GALLERY = 'gallery';
const STORE_STORYBOOKS = 'storybooks';
const STORE_PAGES = 'pages';
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
      if (!db.objectStoreNames.contains(STORE_STORYBOOKS)) {
        db.createObjectStore(STORE_STORYBOOKS, { keyPath: KEY_PATH });
      }
      if (!db.objectStoreNames.contains(STORE_PAGES)) {
        const pageStore = db.createObjectStore(STORE_PAGES, { keyPath: KEY_PATH });
        pageStore.createIndex('storybookId', 'storybookId', { unique: false });
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

// ==================== Storybook CRUD ====================

export function getAllStorybooks(): Promise<Storybook[]> {
  return openDB().then(
    (db) =>
      new Promise<Storybook[]>((resolve, reject) => {
        const tx = db.transaction(STORE_STORYBOOKS, 'readonly');
        const store = tx.objectStore(STORE_STORYBOOKS);
        const request = store.getAll();
        request.onsuccess = () => {
          const items = (request.result ?? []) as Storybook[];
          items.sort((a, b) => b.updatedAt - a.updatedAt);
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

export function getStorybookById(id: string): Promise<Storybook | null> {
  return openDB().then(
    (db) =>
      new Promise<Storybook | null>((resolve, reject) => {
        const tx = db.transaction(STORE_STORYBOOKS, 'readonly');
        const store = tx.objectStore(STORE_STORYBOOKS);
        const request = store.get(id);
        request.onsuccess = () => resolve((request.result as Storybook) ?? null);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

export function saveStorybook(storybook: Storybook): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_STORYBOOKS, 'readwrite');
        const store = tx.objectStore(STORE_STORYBOOKS);
        store.put(storybook);
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

export function deleteStorybook(id: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction([STORE_STORYBOOKS, STORE_PAGES], 'readwrite');
        const storybookStore = tx.objectStore(STORE_STORYBOOKS);
        const pageStore = tx.objectStore(STORE_PAGES);
        
        storybookStore.delete(id);
        
        // Delete all pages belonging to this storybook
        const index = pageStore.index('storybookId');
        const request = index.openCursor(IDBKeyRange.only(id));
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result;
          if (cursor) {
            cursor.delete();
            cursor.continue();
          }
        };
        
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

// ==================== StorybookPage CRUD ====================

export function getPagesByStorybookId(storybookId: string): Promise<StorybookPage[]> {
  return openDB().then(
    (db) =>
      new Promise<StorybookPage[]>((resolve, reject) => {
        const tx = db.transaction(STORE_PAGES, 'readonly');
        const store = tx.objectStore(STORE_PAGES);
        const index = store.index('storybookId');
        const request = index.getAll(storybookId);
        request.onsuccess = () => {
          const pages = (request.result ?? []) as StorybookPage[];
          pages.sort((a, b) => a.order - b.order);
          resolve(pages);
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

export function getPageById(id: string): Promise<StorybookPage | null> {
  return openDB().then(
    (db) =>
      new Promise<StorybookPage | null>((resolve, reject) => {
        const tx = db.transaction(STORE_PAGES, 'readonly');
        const store = tx.objectStore(STORE_PAGES);
        const request = store.get(id);
        request.onsuccess = () => resolve((request.result as StorybookPage) ?? null);
        request.onerror = () => reject(request.error);
        tx.oncomplete = () => db.close();
        tx.onerror = () => {
          db.close();
          reject(tx.error);
        };
      })
  );
}

export function savePage(page: StorybookPage): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_PAGES, 'readwrite');
        const store = tx.objectStore(STORE_PAGES);
        store.put(page);
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

export function deletePage(id: string): Promise<void> {
  return openDB().then(
    (db) =>
      new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_PAGES, 'readwrite');
        const store = tx.objectStore(STORE_PAGES);
        store.delete(id);
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
