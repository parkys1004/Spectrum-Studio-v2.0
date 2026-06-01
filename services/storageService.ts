import { Track, VisualizerSettings } from '../types';

const DB_NAME = 'SpectrumStudioDB';
const DB_VERSION = 1;
const FILE_STORE = 'audio_files';
const METADATA_KEY = 'spectrum_studio_library';
const SETTINGS_KEY = 'spectrum_studio_settings';

class StorageService {
  private dbPromise: Promise<IDBDatabase>;

  constructor() {
    this.dbPromise = this.openDB();
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(FILE_STORE)) {
          db.createObjectStore(FILE_STORE);
        }
      };

      request.onsuccess = (event) => {
        resolve((event.target as IDBOpenDBRequest).result);
      };

      request.onerror = (event) => {
        console.error('IndexedDB Error:', event);
        reject((event.target as IDBOpenDBRequest).error);
      };
    });
  }

  // --- Metadata (LocalStorage) ---

  saveLibrary(tracks: Track[]) {
    // We do not store the ephemeral URL or the File object in LocalStorage
    // We only store serializable metadata
    const serializedTracks = tracks.map(t => ({
      id: t.id,
      name: t.name,
      artist: t.artist,
      duration: t.duration,
      mood: t.mood,
      moodColor: t.moodColor
    }));

    const data = {
      tracks: serializedTracks
    };

    localStorage.setItem(METADATA_KEY, JSON.stringify(data));
  }

  loadLibrary(): { tracks: Track[] } | null {
    const json = localStorage.getItem(METADATA_KEY);
    if (!json) return null;
    try {
      const data = JSON.parse(json);
      // Rehydrate tracks (url will be empty initially)
      const tracks = data.tracks.map((t: any) => ({
        ...t,
        url: '', // Needs to be regenerated from Blob
        file: undefined
      }));
      return { tracks };
    } catch (e) {
      console.error('Failed to parse library', e);
      return null;
    }
  }

  // --- Settings (LocalStorage) ---

  saveSettings(settings: VisualizerSettings) {
    try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
        console.error("Failed to save settings", e);
    }
  }

  loadSettings(): VisualizerSettings | null {
    const json = localStorage.getItem(SETTINGS_KEY);
    if (!json) return null;
    try {
        return JSON.parse(json);
    } catch (e) {
        console.error("Failed to parse settings", e);
        return null;
    }
  }

  // --- Files (IndexedDB) ---

  async saveFile(id: string, file: File | Blob): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FILE_STORE, 'readwrite');
      const store = transaction.objectStore(FILE_STORE);
      const request = store.put(file, id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getFile(id: string): Promise<Blob | null> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FILE_STORE, 'readonly');
      const store = transaction.objectStore(FILE_STORE);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async deleteFile(id: string): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FILE_STORE, 'readwrite');
      const store = transaction.objectStore(FILE_STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearAllFiles(): Promise<void> {
    const db = await this.dbPromise;
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(FILE_STORE, 'readwrite');
      const store = transaction.objectStore(FILE_STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }
}

export const storageService = new StorageService();