/**
 * Offline Scan Queue - Sistema de fila para scans offline usando IndexedDB
 * Permite continuar escaneando mesmo sem conexão com a internet
 */

interface QueuedScan {
  id: string;
  auditId: string;
  scanData: any;
  timestamp: number;
  retries: number;
}

const DB_NAME = 'OfflineScanQueue';
const DB_VERSION = 1;
const STORE_NAME = 'scans';

export class OfflineScanQueue {
  private db: IDBDatabase | null = null;
  private syncInProgress = false;

  constructor() {
    this.initDB();
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        console.log('[OfflineQueue] Database initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('auditId', 'auditId', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('[OfflineQueue] Object store created');
        }
      };
    });
  }

  /**
   * Adiciona um scan à fila offline
   */
  async enqueue(auditId: string, scanData: any): Promise<string> {
    if (!this.db) await this.initDB();

    const queuedScan: QueuedScan = {
      id: `scan_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      auditId,
      scanData,
      timestamp: Date.now(),
      retries: 0
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.add(queuedScan);

      request.onsuccess = () => {
        console.log('[OfflineQueue] Scan enqueued:', queuedScan.id);
        resolve(queuedScan.id);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove um scan da fila
   */
  async dequeue(scanId: string): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(scanId);

      request.onsuccess = () => {
        console.log('[OfflineQueue] Scan dequeued:', scanId);
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Obtém todos os scans pendentes
   */
  async getAllPending(): Promise<QueuedScan[]> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const scans = request.result as QueuedScan[];
        console.log('[OfflineQueue] Pending scans:', scans.length);
        resolve(scans);
      };
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sincroniza scans pendentes com o servidor
   */
  async sync(addScanFn: (data: any) => Promise<void>): Promise<{
    success: number;
    failed: number;
    total: number;
  }> {
    if (this.syncInProgress) {
      console.log('[OfflineQueue] Sync already in progress');
      return { success: 0, failed: 0, total: 0 };
    }

    this.syncInProgress = true;
    console.log('[OfflineQueue] Starting sync...');

    const pending = await this.getAllPending();
    let success = 0;
    let failed = 0;

    for (const scan of pending) {
      try {
        await addScanFn(scan.scanData);
        await this.dequeue(scan.id);
        success++;
        console.log('[OfflineQueue] Synced:', scan.id);
      } catch (error) {
        console.error('[OfflineQueue] Sync failed for:', scan.id, error);
        failed++;

        // Incrementar retries
        if (scan.retries >= 3) {
          // Após 3 tentativas, remover da fila
          console.warn('[OfflineQueue] Max retries reached, removing:', scan.id);
          await this.dequeue(scan.id);
        } else {
          // Incrementar contador de retries
          const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
          const store = transaction.objectStore(STORE_NAME);
          scan.retries++;
          await store.put(scan);
        }
      }
    }

    this.syncInProgress = false;
    console.log(`[OfflineQueue] Sync complete: ${success} success, ${failed} failed`);

    return {
      success,
      failed,
      total: pending.length
    };
  }

  /**
   * Obtém quantidade de scans pendentes
   */
  async getPendingCount(): Promise<number> {
    const pending = await this.getAllPending();
    return pending.length;
  }

  /**
   * Limpa todos os scans pendentes
   */
  async clear(): Promise<void> {
    if (!this.db) await this.initDB();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('[OfflineQueue] Queue cleared');
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  }
}

// Singleton instance
let instance: OfflineScanQueue | null = null;

export function getOfflineScanQueue(): OfflineScanQueue {
  if (!instance) {
    instance = new OfflineScanQueue();
  }
  return instance;
}
