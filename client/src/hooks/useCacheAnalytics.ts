/**
 * Cache Analytics Hook
 * 
 * Provides cache metrics and analytics data for components.
 * Integrates metrics collection with React lifecycle.
 */

import { useEffect, useState, useCallback } from 'react';
import { cacheMetricsCollector, type CacheMetricSnapshot, type CacheMetricsTrend } from '@/lib/cacheMetricsCollector';
import { airportConfigManager } from '@/lib/airportConfigLoader';

export interface CacheAnalyticsData {
  currentHitRate: number;
  averageHitRate: number;
  peakHitRate: number;
  currentLoadTime: number;
  averageLoadTime: number;
  trend: CacheMetricsTrend | null;
  snapshots: any[];
  isCollecting: boolean;
}

export function useCacheAnalytics() {
  const [analyticsData, setAnalyticsData] = useState<CacheAnalyticsData>({
    currentHitRate: 0,
    averageHitRate: 0,
    peakHitRate: 0,
    currentLoadTime: 0,
    averageLoadTime: 0,
    trend: null,
    snapshots: [],
    isCollecting: false,
  });

  // Initialize metrics collection
  useEffect(() => {
    // Set metrics provider
    cacheMetricsCollector.setMetricsProvider(() => {
      const stats = airportConfigManager.getStats();
      return {
        hitRate: airportConfigManager.getHitRate(),
        totalHits: stats.cacheHits,
        totalMisses: stats.cacheMisses,
        lastLoadTime: stats.lastLoadTime || 0,
        averageLoadTime: stats.averageLoadTime,
        networkRequests: stats.networkRequests,
        cacheSize: 0,
      };
    });

    // Start collection
    cacheMetricsCollector.start();
    setAnalyticsData((prev) => ({ ...prev, isCollecting: true }));

    return () => {
      cacheMetricsCollector.stop();
    };
  }, []);

  // Update analytics data periodically
  useEffect(() => {
    const updateAnalytics = () => {
      const summary = cacheMetricsCollector.getSummary();
      const trend = cacheMetricsCollector.getTrend('hour');
      const window = cacheMetricsCollector.getWindowMetrics('hour');

      const chartData = window.snapshots.map((snapshot: CacheMetricSnapshot) => ({
        time: new Date(snapshot.timestamp).toLocaleTimeString(),
        hitRate: Math.round(snapshot.hitRate * 100) / 100,
        loadTime: Math.round(snapshot.lastLoadTime * 100) / 100,
      }));

      setAnalyticsData({
        currentHitRate: summary.currentHitRate,
        averageHitRate: summary.averageHitRate,
        peakHitRate: summary.peakHitRate,
        currentLoadTime: window.snapshots[window.snapshots.length - 1]?.lastLoadTime || 0,
        averageLoadTime: window.averageLoadTime,
        trend,
        snapshots: chartData,
        isCollecting: true,
      });
    };

    updateAnalytics();
    const interval = setInterval(updateAnalytics, 5000);

    return () => clearInterval(interval);
  }, []);

  /**
   * Get metrics for a specific time period
   */
  const getMetricsForPeriod = useCallback((period: 'hour' | 'day') => {
    return cacheMetricsCollector.getWindowMetrics(period);
  }, []);

  /**
   * Get trend analysis
   */
  const getTrendAnalysis = useCallback((period: 'hour' | 'day') => {
    return cacheMetricsCollector.getTrend(period);
  }, []);

  /**
   * Export analytics data
   */
  const exportData = useCallback(() => {
    return cacheMetricsCollector.export();
  }, []);

  /**
   * Get all snapshots
   */
  const getSnapshots = useCallback(() => {
    return cacheMetricsCollector.getSnapshots();
  }, []);

  return {
    analyticsData,
    getMetricsForPeriod,
    getTrendAnalysis,
    exportData,
    getSnapshots,
  };
}
