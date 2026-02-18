/**
 * Cache Analytics Panel Component
 * 
 * Real-time visualization of cache performance metrics with:
 * - Line charts for hit rate and load times
 * - Statistics cards with key metrics
 * - Time period selector (1 hour, 1 day)
 * - Trend indicators
 * - Export functionality
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cacheMetricsCollector, type CacheMetricSnapshot } from '@/lib/cacheMetricsCollector';
import { airportConfigManager } from '@/lib/airportConfigLoader';

type TimePeriod = 'hour' | 'day';

export default function CacheAnalyticsPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('hour');
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [trend, setTrend] = useState<any>(null);

  // Start metrics collection on mount
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

    return () => {
      cacheMetricsCollector.stop();
    };
  }, []);

  // Update data when time period changes
  useEffect(() => {
    const updateData = () => {
      const window = cacheMetricsCollector.getWindowMetrics(timePeriod);
      const summaryData = cacheMetricsCollector.getSummary();
      const trendData = cacheMetricsCollector.getTrend(timePeriod);

      // Format data for chart
      const chartData = window.snapshots.map((snapshot: CacheMetricSnapshot) => ({
        time: new Date(snapshot.timestamp).toLocaleTimeString(),
        hitRate: Math.round(snapshot.hitRate * 100) / 100,
        loadTime: Math.round(snapshot.lastLoadTime * 100) / 100,
        timestamp: snapshot.timestamp,
      }));

      setSnapshots(chartData);
      setSummary(summaryData);
      setTrend(trendData);
    };

    updateData();
    const interval = setInterval(updateData, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [timePeriod]);

  const handleExport = () => {
    const data = cacheMetricsCollector.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-metrics-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRefresh = () => {
    const window = cacheMetricsCollector.getWindowMetrics(timePeriod);
    const summaryData = cacheMetricsCollector.getSummary();
    const trendData = cacheMetricsCollector.getTrend(timePeriod);

    const chartData = window.snapshots.map((snapshot: CacheMetricSnapshot) => ({
      time: new Date(snapshot.timestamp).toLocaleTimeString(),
      hitRate: Math.round(snapshot.hitRate * 100) / 100,
      loadTime: Math.round(snapshot.lastLoadTime * 100) / 100,
      timestamp: snapshot.timestamp,
    }));

    setSnapshots(chartData);
    setSummary(summaryData);
    setTrend(trendData);
  };

  if (!summary) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 max-h-96 overflow-y-auto z-40 shadow-lg">
      <Card>
        <CardHeader
          className="cursor-pointer bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Cache Analytics</CardTitle>
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className="space-y-4 pt-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                <p className="text-xs text-green-600 font-semibold">Hit Rate</p>
                <p className="text-2xl font-bold text-green-700">
                  {summary.currentHitRate.toFixed(1)}%
                </p>
                <p className="text-xs text-green-600 mt-1">Peak: {summary.peakHitRate.toFixed(1)}%</p>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-3 rounded-lg border border-blue-200">
                <p className="text-xs text-blue-600 font-semibold">Avg Hit Rate</p>
                <p className="text-2xl font-bold text-blue-700">
                  {summary.averageHitRate.toFixed(1)}%
                </p>
                <p className="text-xs text-blue-600 mt-1">Timespan: {summary.timespan}</p>
              </div>
            </div>

            {/* Trend Indicator */}
            {trend && (
              <div
                className={`flex items-center gap-2 p-2 rounded-lg ${
                  trend.direction === 'up'
                    ? 'bg-green-50 border border-green-200'
                    : trend.direction === 'down'
                      ? 'bg-red-50 border border-red-200'
                      : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {trend.direction === 'up' && (
                  <TrendingUp className="w-4 h-4 text-green-600" />
                )}
                {trend.direction === 'down' && (
                  <TrendingDown className="w-4 h-4 text-red-600" />
                )}
                <div className="flex-1">
                  <p className="text-xs font-semibold">
                    {trend.direction === 'up' ? 'Improving' : trend.direction === 'down' ? 'Declining' : 'Stable'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {Math.abs(trend.percentageChange).toFixed(1)}% change in last {trend.timeframe}
                  </p>
                </div>
              </div>
            )}

            {/* Time Period Selector */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={timePeriod === 'hour' ? 'default' : 'outline'}
                onClick={() => setTimePeriod('hour')}
                className="flex-1 text-xs"
              >
                1 Hour
              </Button>
              <Button
                size="sm"
                variant={timePeriod === 'day' ? 'default' : 'outline'}
                onClick={() => setTimePeriod('day')}
                className="flex-1 text-xs"
              >
                1 Day
              </Button>
            </div>

            {/* Hit Rate Chart */}
            {snapshots.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Hit Rate Trend</p>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={snapshots}>
                    <defs>
                      <linearGradient id="colorHitRate" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      interval={Math.floor(snapshots.length / 5)}
                    />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="hitRate"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#colorHitRate)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Load Time Chart */}
            {snapshots.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-slate-700">Load Time Trend (ms)</p>
                <ResponsiveContainer width="100%" height={150}>
                  <LineChart data={snapshots}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10 }}
                      interval={Math.floor(snapshots.length / 5)}
                    />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #ccc',
                        borderRadius: '4px',
                        fontSize: '12px',
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="loadTime"
                      stroke="#3b82f6"
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRefresh}
                className="flex-1 text-xs"
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                Refresh
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleExport}
                className="flex-1 text-xs"
              >
                <Download className="w-3 h-3 mr-1" />
                Export
              </Button>
            </div>

            {/* Info Text */}
            <p className="text-xs text-slate-500 italic">
              Real-time cache performance monitoring. Development tool.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
