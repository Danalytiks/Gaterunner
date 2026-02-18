/**
 * Feedback Logger
 * 
 * Stores post-trip feedback locally in localStorage as JSONL (JSON Lines).
 * Each line is a complete JSON object representing one feedback entry.
 * 
 * Format:
 * {"timestamp": "2026-02-17T...", "inputs": {...}, "prediction": {...}, "outcome": {...}}
 */

export interface FeedbackEntry {
  timestamp: string;
  inputs: {
    available_time: number;
    airport_found: boolean;
    profile_type?: string;
  };
  prediction: {
    risk_tier: 'SAFE' | 'TIGHT' | 'RISKY';
    required_time_p50: number;
    required_time_p90: number;
    miss_probability?: number;
  };
  outcome: {
    made_connection: boolean;
    time_left_category?: string; // '0-5', '5-15', '15+'
  };
}

class FeedbackLogger {
  private readonly STORAGE_KEY = 'gaterunner_feedback_log';
  private readonly MAX_ENTRIES = 10000; // Prevent storage bloat

  /**
   * Log a feedback entry
   */
  async logFeedback(entry: Omit<FeedbackEntry, 'timestamp'>): Promise<void> {
    try {
      const feedbackEntry: FeedbackEntry = {
        timestamp: new Date().toISOString(),
        ...entry,
      };

      // Get existing log
      const existingLog = this.getLog();

      // Add new entry
      existingLog.push(feedbackEntry);

      // Keep only recent entries to prevent storage bloat
      const recentLog = existingLog.slice(-this.MAX_ENTRIES);

      // Store as JSONL (one JSON per line)
      const jsonl = recentLog.map((e) => JSON.stringify(e)).join('\n');
      localStorage.setItem(this.STORAGE_KEY, jsonl);

      console.log('[FeedbackLogger] Entry logged:', feedbackEntry);
    } catch (error) {
      console.error('[FeedbackLogger] Error logging feedback:', error);
    }
  }

  /**
   * Get all feedback entries
   */
  getLog(): FeedbackEntry[] {
    try {
      const jsonl = localStorage.getItem(this.STORAGE_KEY);
      if (!jsonl) return [];

      return jsonl
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => JSON.parse(line) as FeedbackEntry);
    } catch (error) {
      console.error('[FeedbackLogger] Error reading feedback log:', error);
      return [];
    }
  }

  /**
   * Export log as CSV
   */
  exportAsCSV(): string {
    const entries = this.getLog();
    if (entries.length === 0) return 'No feedback entries';

    const headers = [
      'timestamp',
      'available_time',
      'airport_found',
      'profile_type',
      'risk_tier',
      'required_time_p50',
      'required_time_p90',
      'miss_probability',
      'made_connection',
      'time_left_category',
    ];

    const rows = entries.map((e) => [
      e.timestamp,
      e.inputs.available_time,
      e.inputs.airport_found,
      e.inputs.profile_type || '',
      e.prediction.risk_tier,
      e.prediction.required_time_p50,
      e.prediction.required_time_p90,
      e.prediction.miss_probability ?? '',
      e.outcome.made_connection,
      e.outcome.time_left_category || '',
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n');
    return csv;
  }

  /**
   * Export log as JSONL
   */
  exportAsJSONL(): string {
    const entries = this.getLog();
    return entries.map((e) => JSON.stringify(e)).join('\n');
  }

  /**
   * Clear all feedback entries
   */
  clearLog(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('[FeedbackLogger] Log cleared');
  }

  /**
   * Get log statistics
   */
  getStats() {
    const entries = this.getLog();
    const total = entries.length;
    const madeConnection = entries.filter((e) => e.outcome.made_connection).length;
    const missedConnection = total - madeConnection;

    return {
      total,
      madeConnection,
      missedConnection,
      makeConnectionRate: total > 0 ? (madeConnection / total) * 100 : 0,
    };
  }
}

export const feedbackLogger = new FeedbackLogger();
