import { useState, useCallback, useRef } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

interface AuditCacheOptions {
  maxAge?: number; // milliseconds
  maxSize?: number;
}

export function useAuditCache<T>(options: AuditCacheOptions = {}) {
  const { maxAge = 5 * 60 * 1000, maxSize = 100 } = options; // 5 minutes default
  const cache = useRef<Map<string, CacheEntry<T>>>(new Map());
  const [hitCount, setHitCount] = useState(0);
  const [missCount, setMissCount] = useState(0);

  const get = useCallback((key: string): T | null => {
    const entry = cache.current.get(key);
    
    if (!entry) {
      setMissCount(prev => prev + 1);
      return null;
    }

    if (Date.now() > entry.expiry) {
      cache.current.delete(key);
      setMissCount(prev => prev + 1);
      return null;
    }

    setHitCount(prev => prev + 1);
    return entry.data;
  }, []);

  const set = useCallback((key: string, data: T): void => {
    // Remove oldest entries if cache is full
    if (cache.current.size >= maxSize) {
      const oldestKey = cache.current.keys().next().value;
      if (oldestKey) {
        cache.current.delete(oldestKey);
      }
    }

    cache.current.set(key, {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + maxAge
    });
  }, [maxAge, maxSize]);

  const clear = useCallback(() => {
    cache.current.clear();
    setHitCount(0);
    setMissCount(0);
  }, []);

  const remove = useCallback((key: string) => {
    cache.current.delete(key);
  }, []);

  const getStats = useCallback(() => {
    const total = hitCount + missCount;
    return {
      hitCount,
      missCount,
      hitRate: total > 0 ? (hitCount / total) * 100 : 0,
      size: cache.current.size
    };
  }, [hitCount, missCount]);

  return {
    get,
    set,
    clear,
    remove,
    getStats
  };
}