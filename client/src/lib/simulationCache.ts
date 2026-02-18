/**
 * Simulation Cache Manager
 * 
 * Caches Monte Carlo simulation results to avoid redundant calculations.
 * Uses input state hash as cache key for fast lookup.
 */

import { SimulationResult } from './monteCarloSimulation';

export interface CachedSimulation {
  result: SimulationResult;
  timestamp: number;
  inputHash: string;
}

class SimulationCacheManager {
  private cache: Map<string, CachedSimulation> = new Map();
  private readonly MAX_CACHE_SIZE = 100;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
  };

  /**
   * Generate hash from simulation input parameters
   */
  private generateInputHash(
    availableTime: number,
    deplanep50: number,
    deplanep90: number,
    transferp50: number,
    transferp90: number,
    securityp50: number,
    securityp90: number,
    buffer: number
  ): string {
    const input = `${availableTime}|${deplanep50}|${deplanep90}|${transferp50}|${transferp90}|${securityp50}|${securityp90}|${buffer}`;
    // Simple hash function
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached simulation result
   */
  get(
    availableTime: number,
    deplanep50: number,
    deplanep90: number,
    transferp50: number,
    transferp90: number,
    securityp50: number,
    securityp90: number,
    buffer: number
  ): SimulationResult | null {
    const inputHash = this.generateInputHash(
      availableTime,
      deplanep50,
      deplanep90,
      transferp50,
      transferp90,
      securityp50,
      securityp90,
      buffer
    );

    const cached = this.cache.get(inputHash);

    if (!cached) {
      this.stats.misses++;
      return null;
    }

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(inputHash);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    console.log(`[SimulationCache] Hit (${this.getHitRate().toFixed(1)}% hit rate)`);
    return cached.result;
  }

  /**
   * Set cached simulation result
   */
  set(
    availableTime: number,
    deplanep50: number,
    deplanep90: number,
    transferp50: number,
    transferp90: number,
    securityp50: number,
    securityp90: number,
    buffer: number,
    result: SimulationResult
  ): void {
    const inputHash = this.generateInputHash(
      availableTime,
      deplanep50,
      deplanep90,
      transferp50,
      transferp90,
      securityp50,
      securityp90,
      buffer
    );

    // Check cache size and evict oldest if needed
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      let oldestKey: string | null = null;
      let oldestTime = Date.now();

      this.cache.forEach((value, key) => {
        if (value.timestamp < oldestTime) {
          oldestTime = value.timestamp;
          oldestKey = key;
        }
      });

      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.stats.evictions++;
      }
    }

    this.cache.set(inputHash, {
      result,
      timestamp: Date.now(),
      inputHash,
    });

    console.log(`[SimulationCache] Stored result (cache size: ${this.cache.size}/${this.MAX_CACHE_SIZE})`);
  }

  /**
   * Clear all cached results
   */
  clear(): void {
    this.cache.clear();
    console.log('[SimulationCache] Cache cleared');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: this.getHitRate(),
    };
  }

  /**
   * Calculate hit rate percentage
   */
  private getHitRate(): number {
    const total = this.stats.hits + this.stats.misses;
    if (total === 0) return 0;
    return (this.stats.hits / total) * 100;
  }

  /**
   * Print statistics to console
   */
  printStats(): void {
    const stats = this.getStats();
    console.log('[SimulationCache] Statistics:');
    console.log(`  Hits: ${stats.hits}`);
    console.log(`  Misses: ${stats.misses}`);
    console.log(`  Hit Rate: ${stats.hitRate.toFixed(1)}%`);
    console.log(`  Cache Size: ${stats.size}/${this.MAX_CACHE_SIZE}`);
    console.log(`  Evictions: ${stats.evictions}`);
  }
}

// Singleton instance
export const simulationCacheManager = new SimulationCacheManager();
