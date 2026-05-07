import type { QueuedLocationUpdate, RawPosition } from '../types';
import { supabase } from './supabaseClient';

const DB_NAME    = 'grouptrace_offline';
const STORE_NAME = 'location_queue';
const DB_VERSION = 1;

let _db: IDBDatabase | null = null;

async function openDB(): Promise<IDBDatabase> {
  if (_db) return _db;
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
      }
    };
    req.onsuccess = (e) => {
      _db = (e.target as IDBOpenDBRequest).result;
      resolve(_db);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueLocation(
  groupId: string,
  userId: string,
  position: RawPosition
): Promise<void> {
  const db = await openDB();
  const entry: QueuedLocationUpdate = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    groupId,
    userId,
    position,
    queuedAt: Date.now(),
  };
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getAllQueued(): Promise<QueuedLocationUpdate[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).index('queuedAt').getAll();
    req.onsuccess = () => resolve(req.result as QueuedLocationUpdate[]);
    req.onerror = () => reject(req.error);
  });
}

async function deleteQueued(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueueLength(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Flush all queued locations to Supabase in chronological order.
 * Calls onProgress(flushed, total) so the UI can show a badge.
 */
export async function flushQueue(
  onProgress?: (flushed: number, total: number) => void
): Promise<void> {
  const queue = await getAllQueued();
  if (queue.length === 0) return;

  let flushed = 0;
  for (const item of queue) {
    try {
      const { error } = await supabase.rpc('sync_location', {
        p_group_id: item.groupId,
        p_user_id:  item.userId,
        p_lat:      item.position.lat,
        p_lng:      item.position.lng,
        p_accuracy: item.position.accuracy,
        p_speed:    item.position.speed,
        p_heading:  item.position.heading,
      });
      if (!error) {
        await deleteQueued(item.id);
        flushed++;
        onProgress?.(flushed, queue.length);
      }
    } catch {
      // Network still down — stop flush, try again next reconnect
      break;
    }
  }
}
