/**
 * Cache Manager
 * 
 * Manages caching of airport configuration with:
 * - In-memory cache (fast access)
 * - localStorage persistence (survives page reloads)
 * - Version-based invalidation (detects config updates)
 * - TTL support (optional time-based expiration)
 * - Debug utilities (monitor cache hits/misses)
 */

export interface CacheEntry<T> {
  data: T;
  version: string;
  timestamp: number;
  ttl?: number; // Time to live in milliseconds
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  lastCleared?: number;
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private stats: Map<string, CacheStats> = new Map();
  private readonly STORAGE_PREFIX = 'gaterunner_cache_';
  private readonly STATS_PREFIX = 'gaterunner_stats_';
  private readonly VERSION_PREFIX = 'gaterunner_version_';

  /**
   * Get cached data with fallback to localStorage
   */
  get<T>(key: string, currentVersion?: string): T | null {
    // Check memory cache first
    const memEntry = this.memoryCache.get(key);
    if (memEntry) {
      // Check if expired
      if (this.isExpired(memEntry)) {
        this.memoryCache.delete(key);
        this.recordMiss(key);
        return null;
      }

      // Check version match
      if (currentVersion && memEntry.version !== currentVersion) {
        this.memoryCache.delete(key);
        this.recordMiss(key);
        return null;
      }

      this.recordHit(key);
      return memEntry.data;
    }

    // Check localStorage
    const storageEntry = this.getFromStorage<T>(key);
    if (storageEntry) {
      // Check if expired
      if (this.isExpired(storageEntry)) {
        this.removeFromStorage(key);
        this.recordMiss(key);
        return null;
      }

      // Check version match
      if (currentVersion && storageEntry.version !== currentVersion) {
        this.removeFromStorage(key);
        this.recordMiss(key);
        return null;
      }

      // Restore to memory cache
      this.memoryCache.set(key, storageEntry);
      this.recordHit(key);
      return storageEntry.data;
    }

    this.recordMiss(key);
    return null;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, version: string, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      version,
      timestamp: Date.now(),
      ttl,
    };

    // Store in memory
    this.memoryCache.set(key, entry);

    // Store in localStorage
    this.setInStorage(key, entry);

    // Store version
    this.setVersion(key, version);
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    if (!entry.ttl) return false;
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Clear cache for a specific key
   */
  clear(key: string): void {
    this.memoryCache.delete(key);
    this.removeFromStorage(key);
    this.removeVersion(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.memoryCache.clear();
    this.clearAllStorage();
    this.stats.clear();
  }

  /**
   * Invalidate cache if version changed
   */
  invalidateIfVersionChanged(key: string, newVersion: string): boolean {
    const storedVersion = this.getVersion(key);
    if (storedVersion && storedVersion !== newVersion) {
      this.clear(key);
      return true;
    }
    return false;
  }

  /**
   * Get cache statistics
   */
  getStats(key: string): CacheStats {
    return (
      this.stats.get(key) || {
        hits: 0,
        misses: 0,
        size: 0,
      }
    );
  }

  /**
   * Get all cache statistics
   */
  getAllStats(): Record<string, CacheStats> {
    const result: Record<string, CacheStats> = {};
    this.stats.forEach((stats, key) => {
      result[key] = stats;
    });
    return result;
  }

  /**
   * Record cache hit
   */
  private recordHit(key: string): void {
    const stats = this.stats.get(key) || { hits: 0, misses: 0, size: 0 };
    stats.hits++;
    this.stats.set(key, stats);
  }

  /**
   * Record cache miss
   */
  private recordMiss(key: string): void {
    const stats = this.stats.get(key) || { hits: 0, misses: 0, size: 0 };
    stats.misses++;
    this.stats.set(key, stats);
  }

  /**
   * Update cache size
   */
  private updateSize(key: string, size: number): void {
    const stats = this.stats.get(key) || { hits: 0, misses: 0, size: 0 };
    stats.size = size;
    this.stats.set(key, stats);
  }

  /**
   * Get from localStorage
   */
  private getFromStorage<T>(key: string): CacheEntry<T> | null {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const data = localStorage.getItem(storageKey);
      if (!data) return null;
      return JSON.parse(data) as CacheEntry<T>;
    } catch (error) {
      console.error(`Failed to read from localStorage for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Set in localStorage
   */
  private setInStorage<T>(key: string, entry: CacheEntry<T>): void {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      const data = JSON.stringify(entry);
      localStorage.setItem(storageKey, data);
      this.updateSize(key, data.length);
    } catch (error) {
      console.error(`Failed to write to localStorage for key ${key}:`, error);
    }
  }

  /**
   * Remove from localStorage
   */
  private removeFromStorage(key: string): void {
    try {
      const storageKey = this.STORAGE_PREFIX + key;
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error(`Failed to remove from localStorage for key ${key}:`, error);
    }
  }

  /**
   * Clear all storage
   */
  private clearAllStorage(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }

  /**
   * Store version
   */
  private setVersion(key: string, version: string): void {
    try {
      const versionKey = this.VERSION_PREFIX + key;
      localStorage.setItem(versionKey, version);
    } catch (error) {
      console.error(`Failed to store version for key ${key}:`, error);
    }
  }

  /**
   * Get stored version
   */
  private getVersion(key: string): string | null {
    try {
      const versionKey = this.VERSION_PREFIX + key;
      return localStorage.getItem(versionKey);
    } catch (error) {
      console.error(`Failed to get version for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove stored version
   */
  private removeVersion(key: string): void {
    try {
      const versionKey = this.VERSION_PREFIX + key;
      localStorage.removeItem(versionKey);
    } catch (error) {
      console.error(`Failed to remove version for key ${key}:`, error);
    }
  }

  /**
   * Get memory cache size (for debugging)
   */
  getMemoryCacheSize(): number {
    return this.memoryCache.size;
  }

  /**
   * Get all memory cache keys (for debugging)
   */
  getMemoryCacheKeys(): string[] {
    return Array.from(this.memoryCache.keys());
  }

  /**
   * Print cache statistics to console
   */
  printStats(): void {
    console.group('Cache Statistics');
    console.log('Memory Cache Size:', this.memoryCache.size);
    console.log('Stats:', this.getAllStats());
    console.groupEnd();
  }
}

// Singleton instance
export const cacheManager = new CacheManager();
