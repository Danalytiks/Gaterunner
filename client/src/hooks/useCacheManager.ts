/**
 * Cache Manager Hook
 * 
 * Provides cache management utilities and monitoring for components.
 * Includes automatic update detection and manual refresh controls.
 */

import { useEffect, useState, useCallback } from 'react';
import { airportConfigManager, type LoaderStats } from '@/lib/airportConfigLoader';

export interface CacheStatus {
  isLoaded: boolean;
  stats: LoaderStats;
  updateAvailable: boolean;
  lastChecked?: Date;
}

const UPDATE_CHECK_INTERVAL = 5 * 60 * 1000; // Check for updates every 5 minutes

export function useCacheManager() {
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    isLoaded: false,
    stats: airportConfigManager.getStats(),
    updateAvailable: false,
  });

  // Check for updates periodically
  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const hasUpdates = await airportConfigManager.checkForUpdates();
        setCacheStatus((prev) => ({
          ...prev,
          updateAvailable: hasUpdates,
          lastChecked: new Date(),
          stats: airportConfigManager.getStats(),
        }));
      } catch (error) {
        console.error('Error checking for updates:', error);
      }
    };

    // Initial check
    checkUpdates();

    // Set up periodic checks
    const interval = setInterval(checkUpdates, UPDATE_CHECK_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  // Update stats periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setCacheStatus((prev) => ({
        ...prev,
        stats: airportConfigManager.getStats(),
      }));
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, []);

  /**
   * Manually refresh cache
   */
  const refreshCache = useCallback(async () => {
    try {
      await airportConfigManager.refreshConfig();
      setCacheStatus((prev) => ({
        ...prev,
        stats: airportConfigManager.getStats(),
        updateAvailable: false,
        lastChecked: new Date(),
      }));
      return true;
    } catch (error) {
      console.error('Error refreshing cache:', error);
      return false;
    }
  }, []);

  /**
   * Clear cache
   */
  const clearCache = useCallback(() => {
    airportConfigManager.clearCache();
    setCacheStatus((prev) => ({
      ...prev,
      stats: airportConfigManager.getStats(),
    }));
  }, []);

  /**
   * Print cache statistics
   */
  const printStats = useCallback(() => {
    airportConfigManager.printStats();
  }, []);

  return {
    cacheStatus,
    refreshCache,
    clearCache,
    printStats,
    getHitRate: () => airportConfigManager.getHitRate(),
  };
}
