/**
 * Cache Patterns Visualization Component
 * 
 * Displays cache performance patterns and trends:
 * - Hourly patterns
 * - Performance insights
 * - Recommendations
 * - Comparison metrics
 */

import { useCacheAnalytics } from '@/hooks/useCacheAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, TrendingUp, Zap, Target } from 'lucide-react';

export default function CachePatternsVisualization() {
  const { analyticsData, getTrendAnalysis } = useCacheAnalytics();

  const trendHour = getTrendAnalysis('hour');
  const trendDay = getTrendAnalysis('day');

  // Generate insights
  const insights = generateInsights(analyticsData);

  return (
    <div className="space-y-3">
      {/* Performance Insights */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            Performance Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {insights.map((insight, idx) => (
            <div key={idx} className="flex gap-2 text-xs">
              <span className="text-blue-600 font-bold">•</span>
              <p className="text-slate-700">{insight}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Trend Comparison */}
      <div className="grid grid-cols-2 gap-2">
        {/* Hourly Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">1 Hour Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {trendHour.direction === 'up' && (
                <TrendingUp className="w-4 h-4 text-green-600" />
              )}
              {trendHour.direction === 'down' && (
                <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {trendHour.direction === 'up'
                    ? 'Improving'
                    : trendHour.direction === 'down'
                      ? 'Declining'
                      : 'Stable'}
                </p>
                <p className="text-xs text-slate-600">
                  {Math.abs(trendHour.percentageChange).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs">1 Day Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {trendDay.direction === 'up' && (
                <TrendingUp className="w-4 h-4 text-green-600" />
              )}
              {trendDay.direction === 'down' && (
                <TrendingUp className="w-4 h-4 text-red-600 rotate-180" />
              )}
              <div>
                <p className="text-sm font-bold">
                  {trendDay.direction === 'up'
                    ? 'Improving'
                    : trendDay.direction === 'down'
                      ? 'Declining'
                      : 'Stable'}
                </p>
                <p className="text-xs text-slate-600">
                  {Math.abs(trendDay.percentageChange).toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-amber-600" />
            Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {generateRecommendations(analyticsData).map((rec, idx) => (
            <div key={idx} className="flex gap-2 text-xs">
              <span className="text-amber-600 font-bold">→</span>
              <p className="text-slate-700">{rec}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Performance Metrics Comparison */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-600">Current Hit Rate</span>
              <span className="font-bold text-green-600">
                {analyticsData.currentHitRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-600">Average Hit Rate</span>
              <span className="font-bold text-blue-600">
                {analyticsData.averageHitRate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-600">Current Load Time</span>
              <span className="font-bold text-purple-600">
                {analyticsData.currentLoadTime.toFixed(0)}ms
              </span>
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50 rounded">
              <span className="text-slate-600">Average Load Time</span>
              <span className="font-bold text-purple-600">
                {analyticsData.averageLoadTime.toFixed(0)}ms
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Generate performance insights based on analytics data
 */
function generateInsights(data: any): string[] {
  const insights: string[] = [];

  // Hit rate insights
  if (data.currentHitRate >= 90) {
    insights.push('Excellent cache hit rate - configuration is well optimized');
  } else if (data.currentHitRate >= 70) {
    insights.push('Good cache hit rate - room for improvement');
  } else if (data.currentHitRate >= 50) {
    insights.push('Moderate hit rate - consider cache optimization');
  } else {
    insights.push('Low hit rate - cache may need adjustment');
  }

  // Load time insights
  if (data.currentLoadTime < 5) {
    insights.push('Fast load times - cache is performing well');
  } else if (data.currentLoadTime < 50) {
    insights.push('Acceptable load times for network requests');
  } else {
    insights.push('Slow load times - consider network optimization');
  }

  // Consistency insights
  const variance = Math.abs(data.averageHitRate - data.currentHitRate);
  if (variance < 10) {
    insights.push('Consistent performance - stable cache behavior');
  } else if (variance < 30) {
    insights.push('Variable performance - some fluctuation detected');
  } else {
    insights.push('High variance - performance is inconsistent');
  }

  return insights;
}

/**
 * Generate recommendations based on analytics data
 */
function generateRecommendations(data: any): string[] {
  const recommendations: string[] = [];

  // Hit rate recommendations
  if (data.currentHitRate < 80) {
    recommendations.push('Increase cache TTL to improve hit rate');
  }

  if (data.averageLoadTime > 100) {
    recommendations.push('Consider using IndexedDB for larger datasets');
  }

  if (data.currentLoadTime > data.averageLoadTime * 1.5) {
    recommendations.push('Current load time is above average - check network');
  }

  if (data.peakHitRate - data.currentHitRate > 20) {
    recommendations.push('Performance has declined - verify cache status');
  }

  if (recommendations.length === 0) {
    recommendations.push('Cache is performing optimally - no changes needed');
  }

  return recommendations;
}
