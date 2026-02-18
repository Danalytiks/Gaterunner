/**
 * Cache Metrics Collector
 * 
 * Collects and aggregates cache performance metrics over time.
 * Tracks hit rate, load times, network requests, and other KPIs.
 */

export interface CacheMetricSnapshot {
  timestamp: number;
  hitRate: number; // Percentage (0-100)
  totalHits: number;
  totalMisses: number;
  lastLoadTime: number; // milliseconds
  averageLoadTime: number; // milliseconds
  networkRequests: number;
  cacheSize: number; // bytes
}

export interface CacheMetricsWindow {
  period: 'minute' | 'hour' | 'day';
  snapshots: CacheMetricSnapshot[];
  averageHitRate: number;
  peakHitRate: number;
  minHitRate: number;
  averageLoadTime: number;
  peakLoadTime: number;
  minLoadTime: number;
  totalNetworkRequests: number;
}

export interface CacheMetricsTrend {
  direction: 'up' | 'down' | 'stable';
  percentageChange: number;
  timeframe: string;
}

class CacheMetricsCollector {
  private snapshots: CacheMetricSnapshot[] = [];
  private readonly MAX_SNAPSHOTS = 1440; // 24 hours of minute-level data
  private readonly SNAPSHOT_INTERVAL = 60000; // 1 minute
  private lastSnapshot: CacheMetricSnapshot | null = null;
  private collectionInterval: NodeJS.Timeout | null = null;
  private metricsCallback: ((snapshot: CacheMetricSnapshot) => void) | null = null;

  /**
   * Start collecting metrics
   */
  start(callback?: (snapshot: CacheMetricSnapshot) => void): void {
    if (this.collectionInterval) return;

    this.metricsCallback = callback || null;

    // Initial snapshot
    this.collectSnapshot();

    // Collect periodically
    this.collectionInterval = setInterval(() => {
      this.collectSnapshot();
    }, this.SNAPSHOT_INTERVAL);

    console.log('[Metrics] Cache metrics collection started');
  }

  /**
   * Stop collecting metrics
   */
  stop(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      console.log('[Metrics] Cache metrics collection stopped');
    }
  }

  /**
   * Collect a snapshot of current metrics
   */
  private collectSnapshot(): void {
    const snapshot = this.createSnapshot();
    this.snapshots.push(snapshot);

    // Keep only recent snapshots
    if (this.snapshots.length > this.MAX_SNAPSHOTS) {
      this.snapshots.shift();
    }

    this.lastSnapshot = snapshot;

    // Call callback if provided
    if (this.metricsCallback) {
      this.metricsCallback(snapshot);
    }
  }

  /**
   * Create a snapshot from current metrics
   */
  private createSnapshot(): CacheMetricSnapshot {
    // Get current metrics from cache manager
    const metrics = this.getCurrentMetrics();

    return {
      timestamp: Date.now(),
      hitRate: metrics.hitRate,
      totalHits: metrics.totalHits,
      totalMisses: metrics.totalMisses,
      lastLoadTime: metrics.lastLoadTime,
      averageLoadTime: metrics.averageLoadTime,
      networkRequests: metrics.networkRequests,
      cacheSize: metrics.cacheSize,
    };
  }

  /**
   * Get current metrics (to be implemented by caller)
   */
  private getCurrentMetrics(): any {
    // This will be populated by the metrics provider
    return {
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0,
      lastLoadTime: 0,
      averageLoadTime: 0,
      networkRequests: 0,
      cacheSize: 0,
    };
  }

  /**
   * Update metrics provider
   */
  setMetricsProvider(provider: () => any): void {
    this.getCurrentMetrics = provider;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): CacheMetricSnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get last snapshot
   */
  getLastSnapshot(): CacheMetricSnapshot | null {
    return this.lastSnapshot;
  }

  /**
   * Get metrics for a specific time window
   */
  getWindowMetrics(period: 'minute' | 'hour' | 'day'): CacheMetricsWindow {
    const now = Date.now();
    let windowSize = 0;

    switch (period) {
      case 'minute':
        windowSize = 60 * 1000;
        break;
      case 'hour':
        windowSize = 60 * 60 * 1000;
        break;
      case 'day':
        windowSize = 24 * 60 * 60 * 1000;
        break;
    }

    const windowStart = now - windowSize;
    const windowSnapshots = this.snapshots.filter((s) => s.timestamp >= windowStart);

    if (windowSnapshots.length === 0) {
      return {
        period,
        snapshots: [],
        averageHitRate: 0,
        peakHitRate: 0,
        minHitRate: 0,
        averageLoadTime: 0,
        peakLoadTime: 0,
        minLoadTime: 0,
        totalNetworkRequests: 0,
      };
    }

    const hitRates = windowSnapshots.map((s) => s.hitRate);
    const loadTimes = windowSnapshots.map((s) => s.lastLoadTime);

    return {
      period,
      snapshots: windowSnapshots,
      averageHitRate: hitRates.reduce((a, b) => a + b, 0) / hitRates.length,
      peakHitRate: Math.max(...hitRates),
      minHitRate: Math.min(...hitRates),
      averageLoadTime: loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length,
      peakLoadTime: Math.max(...loadTimes),
      minLoadTime: Math.min(...loadTimes),
      totalNetworkRequests: windowSnapshots[windowSnapshots.length - 1]?.networkRequests || 0,
    };
  }

  /**
   * Get trend analysis
   */
  getTrend(period: 'hour' | 'day'): CacheMetricsTrend {
    const windowSize = period === 'hour' ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
    const halfWindow = windowSize / 2;
    const now = Date.now();

    // Get first half metrics
    const firstHalf = this.snapshots.filter(
      (s) => s.timestamp >= now - windowSize && s.timestamp < now - halfWindow
    );

    // Get second half metrics
    const secondHalf = this.snapshots.filter(
      (s) => s.timestamp >= now - halfWindow && s.timestamp <= now
    );

    if (firstHalf.length === 0 || secondHalf.length === 0) {
      return {
        direction: 'stable',
        percentageChange: 0,
        timeframe: period,
      };
    }

    const firstHalfAvg =
      firstHalf.reduce((sum, s) => sum + s.hitRate, 0) / firstHalf.length;
    const secondHalfAvg =
      secondHalf.reduce((sum, s) => sum + s.hitRate, 0) / secondHalf.length;

    const change = secondHalfAvg - firstHalfAvg;
    const percentageChange = (change / firstHalfAvg) * 100;

    let direction: 'up' | 'down' | 'stable' = 'stable';
    if (percentageChange > 5) direction = 'up';
    else if (percentageChange < -5) direction = 'down';

    return {
      direction,
      percentageChange: Math.round(percentageChange * 100) / 100,
      timeframe: period,
    };
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.snapshots = [];
    this.lastSnapshot = null;
  }

  /**
   * Export metrics as JSON
   */
  export(): string {
    return JSON.stringify({
      snapshots: this.snapshots,
      lastSnapshot: this.lastSnapshot,
      exportedAt: new Date().toISOString(),
    });
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalSnapshots: number;
    timespan: string;
    averageHitRate: number;
    currentHitRate: number;
    peakHitRate: number;
  } {
    if (this.snapshots.length === 0) {
      return {
        totalSnapshots: 0,
        timespan: 'N/A',
        averageHitRate: 0,
        currentHitRate: 0,
        peakHitRate: 0,
      };
    }

    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    const timespan = ((last.timestamp - first.timestamp) / 1000 / 60).toFixed(1);
    const avgHitRate =
      this.snapshots.reduce((sum, s) => sum + s.hitRate, 0) / this.snapshots.length;
    const peakHitRate = Math.max(...this.snapshots.map((s) => s.hitRate));

    return {
      totalSnapshots: this.snapshots.length,
      timespan: `${timespan} minutes`,
      averageHitRate: Math.round(avgHitRate * 100) / 100,
      currentHitRate: last.hitRate,
      peakHitRate,
    };
  }
}

// Singleton instance
export const cacheMetricsCollector = new CacheMetricsCollector();
