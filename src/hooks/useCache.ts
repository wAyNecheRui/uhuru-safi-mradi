
import { useState, useEffect, useCallback } from 'react';

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  maxSize?: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  hits: number;
}

class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private maxSize: number;
  private ttl: number;

  constructor(maxSize: number = 100, ttl: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Update hits and move to end (most recently used)
    entry.hits++;
    this.cache.delete(key);
    this.cache.set(key, entry);
    
    return entry.data;
  }

  set(key: string, data: T): void {
    // Remove oldest entry if at max size
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      hits: 0
    });
  }

  clear(): void {
    this.cache.clear();
  }

  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      entries: Array.from(this.cache.entries()).map(([key, entry]) => ({
        key,
        hits: entry.hits,
        age: Date.now() - entry.timestamp
      }))
    };
  }
}

const globalCache = new LRUCache();

export const useCache = <T>(options: CacheOptions = {}) => {
  const { ttl = 5 * 60 * 1000, maxSize = 100 } = options;
  const [cache] = useState(() => new LRUCache<T>(maxSize, ttl));

  const get = useCallback((key: string): T | null => {
    return cache.get(key);
  }, [cache]);

  const set = useCallback((key: string, data: T): void => {
    cache.set(key, data);
  }, [cache]);

  const clear = useCallback((): void => {
    cache.clear();
  }, [cache]);

  const getStats = useCallback(() => {
    return cache.getStats();
  }, [cache]);

  return { get, set, clear, getStats };
};

// Hook for caching API requests
export const useCachedFetch = <T>(
  url: string,
  options: RequestInit = {},
  cacheOptions: CacheOptions = {}
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { get, set } = useCache<T>(cacheOptions);

  const fetchData = useCallback(async (force: boolean = false) => {
    const cacheKey = `${url}-${JSON.stringify(options)}`;
    
    // Check cache first
    if (!force) {
      const cachedData = get(cacheKey);
      if (cachedData) {
        setData(cachedData);
        return cachedData;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      // Cache the result
      set(cacheKey, result);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [url, options, get, set]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: () => fetchData(true),
    fetchData
  };
};
