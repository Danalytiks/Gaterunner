/**
 * Cache Debug Panel Component
 * 
 * Development tool for monitoring cache performance and statistics.
 * Shows hit rate, load times, and provides manual cache controls.
 * 
 * Usage: Add to App.tsx or a debug page
 * <CacheDebugPanel />
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCacheManager } from '@/hooks/useCacheManager';
import { RefreshCw, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

export default function CacheDebugPanel() {
  const { cacheStatus, refreshCache, clearCache, printStats, getHitRate } = useCacheManager();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshCache();
    } finally {
      setIsRefreshing(false);
    }
  };

  const stats = cacheStatus.stats;
  const hitRate = getHitRate();

  return (
    <Card className="fixed bottom-4 right-4 w-80 z-50 shadow-lg">
      <CardHeader
        className="cursor-pointer bg-slate-100 hover:bg-slate-200 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Cache Debug</CardTitle>
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="space-y-4 pt-4">
          {/* Status Indicator */}
          <div className="flex items-center gap-2">
            <div
              className={`w-3 h-3 rounded-full ${
                cacheStatus.updateAvailable ? 'bg-amber-500' : 'bg-green-500'
              }`}
            />
            <span className="text-xs text-slate-600">
              {cacheStatus.updateAvailable ? 'Update Available' : 'Up to Date'}
            </span>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 p-2 rounded">
              <p className="text-slate-600">Hit Rate</p>
              <p className="font-bold text-lg text-blue-600">{hitRate.toFixed(1)}%</p>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <p className="text-slate-600">Load Time</p>
              <p className="font-bold text-lg text-blue-600">
                {stats.lastLoadTime?.toFixed(0) || 0}ms
              </p>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <p className="text-slate-600">Hits</p>
              <p className="font-bold text-lg text-green-600">{stats.cacheHits}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <p className="text-slate-600">Misses</p>
              <p className="font-bold text-lg text-red-600">{stats.cacheMisses}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <p className="text-slate-600">Network</p>
              <p className="font-bold text-lg text-amber-600">{stats.networkRequests}</p>
            </div>
            <div className="bg-slate-50 p-2 rounded">
              <p className="text-slate-600">Avg Time</p>
              <p className="font-bold text-lg text-purple-600">
                {stats.averageLoadTime.toFixed(0)}ms
              </p>
            </div>
          </div>

          {/* Last Checked */}
          {cacheStatus.lastChecked && (
            <p className="text-xs text-slate-500">
              Last checked: {cacheStatus.lastChecked.toLocaleTimeString()}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex-1 text-xs"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={clearCache}
              className="flex-1 text-xs"
            >
              <Trash2 className="w-3 h-3 mr-1" />
              Clear
            </Button>
          </div>

          {/* Stats Button */}
          <Button
            size="sm"
            variant="ghost"
            onClick={printStats}
            className="w-full text-xs"
          >
            Print Stats to Console
          </Button>

          {/* Info Text */}
          <p className="text-xs text-slate-500 italic">
            Development tool only. Remove in production.
          </p>
        </CardContent>
      )}
    </Card>
  );
}
