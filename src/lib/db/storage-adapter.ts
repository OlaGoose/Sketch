/**
 * Zustand persist middleware storage adapter using IndexedDB.
 * Persists only gallery; avoids localStorage size limits for images/audio.
 */

import type { GalleryItem } from '@/types';
import type { PersistStorage, StorageValue } from 'zustand/middleware';
import { getGallery, setGallery, clearGallery } from './cinematic-db';

const PERSISTED_KEY = 'cinematic-sketch-storage';

type PersistedState = { gallery: GalleryItem[] };

function isClient(): boolean {
  return typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';
}

export const indexedDbStorage: PersistStorage<PersistedState> = {
  getItem: async (name: string): Promise<StorageValue<PersistedState> | null> => {
    if (name !== PERSISTED_KEY) return null;
    if (!isClient()) return null;
    try {
      const gallery = await getGallery();
      return { state: { gallery }, version: 1 };
    } catch {
      return null;
    }
  },

  setItem: async (name: string, value: StorageValue<PersistedState>): Promise<void> => {
    if (name !== PERSISTED_KEY) return;
    if (!isClient()) return;
    try {
      const gallery = value.state?.gallery ?? [];
      await setGallery(gallery);
    } catch {
      // ignore write errors
    }
  },

  removeItem: async (name: string): Promise<void> => {
    if (name !== PERSISTED_KEY) return;
    if (!isClient()) return;
    try {
      await clearGallery();
    } catch {
      // ignore
    }
  },
};
