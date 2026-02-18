/**
 * Debug Evaluation Page
 * 
 * Developer-only page for viewing feedback logs and evaluation metrics.
 * Accessible via /debug-eval route.
 * 
 * Features:
 * - View all feedback entries
 * - Export as CSV or JSONL
 * - Calculate and display evaluation metrics
 * - Clear logs
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Trash2, RefreshCw } from 'lucide-react';
import { feedbackLogger, type FeedbackEntry } from '@/lib/feedbackLogger';
import { evaluateFeedback, formatEvaluationResult, type EvaluationResult } from '@/lib/evaluationMetrics';

export default function DebugEvaluation() {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [metrics, setMetrics] = useState<EvaluationResult | null>(null);
  const [stats, setStats] = useState<{ total: number; madeConnection: number; missedConnection: number; makeConnectionRate: number }>({ total: 0, madeConnection: 0, missedConnection: 0, makeConnectionRate: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const log = feedbackLogger.getLog();
    setEntries(log);
    setMetrics(evaluateFeedback(log));
    setStats(feedbackLogger.getStats());
  };

  const handleExportCSV = () => {
    const csv = feedbackLogger.exportAsCSV();
    downloadFile(csv, 'gaterunner-feedback.csv', 'text/csv');
  };

  const handleExportJSONL = () => {
    const jsonl = feedbackLogger.exportAsJSONL();
    downloadFile(jsonl, 'gaterunner-feedback.jsonl', 'application/jsonl');
  };

  const handleClearLog = () => {
    if (confirm('Are you sure? This will delete all feedback entries.')) {
      feedbackLogger.clearLog();
      loadData();
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Debug: Evaluation Metrics</h1>
          <p className="text-sm text-slate-600 mt-1">Developer-only page for feedback analysis</p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Total Entries</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Made Connection</p>
              <p className="text-3xl font-bold text-green-600">{stats.madeConnection}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Missed Connection</p>
              <p className="text-3xl font-bold text-red-600">{stats.missedConnection}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Success Rate</p>
              <p className="text-3xl font-bold text-slate-900">{stats.makeConnectionRate.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Metrics */}
        {metrics && (
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-100 p-4 rounded-lg overflow-auto text-xs font-mono whitespace-pre-wrap">
                {formatEvaluationResult(metrics)}
              </pre>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={loadData} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button onClick={handleExportCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
          <Button onClick={handleExportJSONL} variant="outline" className="gap-2">
            <Download className="w-4 h-4" />
            Export JSONL
          </Button>
          <Button onClick={handleClearLog} variant="destructive" className="gap-2 ml-auto">
            <Trash2 className="w-4 h-4" />
            Clear Log
          </Button>
        </div>

        {/* Entries Table */}
        {entries.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Recent Entries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-2 text-left">Timestamp</th>
                      <th className="px-4 py-2 text-left">Available Time</th>
                      <th className="px-4 py-2 text-left">Risk Tier</th>
                      <th className="px-4 py-2 text-left">Miss Prob</th>
                      <th className="px-4 py-2 text-left">Made Connection</th>
                      <th className="px-4 py-2 text-left">Time Left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.slice(-20).reverse().map((entry, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="px-4 py-2 text-xs text-slate-600">
                          {new Date(entry.timestamp).toLocaleString()}
                        </td>
                        <td className="px-4 py-2 font-mono">{entry.inputs.available_time} min</td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              entry.prediction.risk_tier === 'SAFE'
                                ? 'bg-green-100 text-green-800'
                                : entry.prediction.risk_tier === 'TIGHT'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {entry.prediction.risk_tier}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono">
                          {entry.prediction.miss_probability !== undefined
                            ? (entry.prediction.miss_probability * 100).toFixed(1) + '%'
                            : 'N/A'}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              entry.outcome.made_connection
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {entry.outcome.made_connection ? 'Yes' : 'No'}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-slate-600">{entry.outcome.time_left_category || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {entries.length === 0 && (
          <Card className="bg-slate-100">
            <CardContent className="pt-6 text-center">
              <p className="text-slate-600">No feedback entries yet. Submit feedback after calculating connection risk.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
