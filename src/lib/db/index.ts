/**
 * IndexedDB persistence for Cinematic Sketch.
 * Use storage-adapter for Zustand; use cinematic-db for direct access if needed.
 */

export { getGallery, setGallery, clearGallery } from './cinematic-db';
export { indexedDbStorage } from './storage-adapter';
