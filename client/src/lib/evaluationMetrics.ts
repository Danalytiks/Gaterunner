/**
 * Evaluation Metrics
 * 
 * Calculates performance metrics for connection risk predictions:
 * - Brier Score: Measures calibration of miss_probability predictions
 * - Cost-Sensitive Loss: Weights different types of prediction errors
 * 
 * Cost weights:
 * - False SAFE (predicted SAFE but missed): 5 (most costly)
 * - False TIGHT (predicted TIGHT but missed): 2
 * - False RISKY (predicted RISKY but made): 1 (least costly)
 */

import type { FeedbackEntry } from './feedbackLogger';

export interface EvaluationResult {
  total_entries: number;
  entries_with_probability: number;
  brier_score: number | null;
  cost_sensitive_loss: number;
  accuracy: number;
  confusion_matrix: {
    true_positive: number; // Predicted SAFE, made connection
    false_positive: number; // Predicted SAFE, missed connection
    true_negative: number; // Predicted RISKY, missed connection
    false_negative: number; // Predicted RISKY, made connection
  };
  risk_tier_breakdown: {
    SAFE: { total: number; correct: number; accuracy: number };
    TIGHT: { total: number; correct: number; accuracy: number };
    RISKY: { total: number; correct: number; accuracy: number };
  };
}

/**
 * Calculate Brier Score
 * Measures calibration: average squared difference between predicted probability and actual outcome
 * Range: 0 (perfect) to 1 (worst)
 */
function calculateBrierScore(entries: FeedbackEntry[]): number | null {
  const entriesWithProb = entries.filter((e) => e.prediction.miss_probability !== undefined);

  if (entriesWithProb.length === 0) return null;

  const sumSquaredDiff = entriesWithProb.reduce((sum, entry) => {
    const predicted = entry.prediction.miss_probability!;
    // Actual outcome: 1 if missed connection, 0 if made connection
    const actual = entry.outcome.made_connection ? 0 : 1;
    return sum + Math.pow(predicted - actual, 2);
  }, 0);

  return sumSquaredDiff / entriesWithProb.length;
}

/**
 * Calculate Cost-Sensitive Loss
 * Weights different types of errors:
 * - False SAFE (predicted SAFE but missed): weight 5
 * - False TIGHT (predicted TIGHT but missed): weight 2
 * - False RISKY (predicted RISKY but made): weight 1
 */
function calculateCostSensitiveLoss(entries: FeedbackEntry[]): number {
  if (entries.length === 0) return 0;

  const totalCost = entries.reduce((sum, entry) => {
    const predicted = entry.prediction.risk_tier;
    const madeConnection = entry.outcome.made_connection;

    // Cost for each prediction-outcome combination
    if (!madeConnection) {
      // Missed connection (outcome = 1)
      if (predicted === 'SAFE') return sum + 5; // False SAFE
      if (predicted === 'TIGHT') return sum + 2; // False TIGHT
      if (predicted === 'RISKY') return sum + 0; // Correct RISKY
    } else {
      // Made connection (outcome = 0)
      if (predicted === 'SAFE') return sum + 0; // Correct SAFE
      if (predicted === 'TIGHT') return sum + 0; // Correct TIGHT
      if (predicted === 'RISKY') return sum + 1; // False RISKY
    }

    return sum;
  }, 0);

  return totalCost / entries.length;
}

/**
 * Calculate accuracy metrics
 */
function calculateAccuracy(entries: FeedbackEntry[]): {
  accuracy: number;
  confusion_matrix: {
    true_positive: number;
    false_positive: number;
    true_negative: number;
    false_negative: number;
  };
} {
  let truePositive = 0; // Predicted SAFE, made connection
  let falsePositive = 0; // Predicted SAFE, missed connection
  let trueNegative = 0; // Predicted RISKY, missed connection
  let falseNegative = 0; // Predicted RISKY, made connection

  entries.forEach((entry) => {
    const predicted = entry.prediction.risk_tier;
    const madeConnection = entry.outcome.made_connection;

    // Simplified: SAFE/TIGHT = positive, RISKY = negative
    const predictedPositive = predicted === 'SAFE' || predicted === 'TIGHT';

    if (predictedPositive && madeConnection) truePositive++;
    else if (predictedPositive && !madeConnection) falsePositive++;
    else if (!predictedPositive && !madeConnection) trueNegative++;
    else if (!predictedPositive && madeConnection) falseNegative++;
  });

  const total = truePositive + falsePositive + trueNegative + falseNegative;
  const accuracy = total > 0 ? (truePositive + trueNegative) / total : 0;

  return {
    accuracy,
    confusion_matrix: {
      true_positive: truePositive,
      false_positive: falsePositive,
      true_negative: trueNegative,
      false_negative: falseNegative,
    },
  };
}

/**
 * Calculate per-tier accuracy
 */
function calculateRiskTierBreakdown(entries: FeedbackEntry[]): {
  SAFE: { total: number; correct: number; accuracy: number };
  TIGHT: { total: number; correct: number; accuracy: number };
  RISKY: { total: number; correct: number; accuracy: number };
} {
  const breakdown = {
    SAFE: { total: 0, correct: 0 },
    TIGHT: { total: 0, correct: 0 },
    RISKY: { total: 0, correct: 0 },
  };

  entries.forEach((entry) => {
    const tier = entry.prediction.risk_tier;
    breakdown[tier].total++;

    // Correct if: SAFE/TIGHT and made connection, or RISKY and missed connection
    const isCorrect =
      (tier !== 'RISKY' && entry.outcome.made_connection) ||
      (tier === 'RISKY' && !entry.outcome.made_connection);

    if (isCorrect) breakdown[tier].correct++;
  });

  return {
    SAFE: {
      total: breakdown.SAFE.total,
      correct: breakdown.SAFE.correct,
      accuracy: breakdown.SAFE.total > 0 ? breakdown.SAFE.correct / breakdown.SAFE.total : 0,
    },
    TIGHT: {
      total: breakdown.TIGHT.total,
      correct: breakdown.TIGHT.correct,
      accuracy: breakdown.TIGHT.total > 0 ? breakdown.TIGHT.correct / breakdown.TIGHT.total : 0,
    },
    RISKY: {
      total: breakdown.RISKY.total,
      correct: breakdown.RISKY.correct,
      accuracy: breakdown.RISKY.total > 0 ? breakdown.RISKY.correct / breakdown.RISKY.total : 0,
    },
  };
}

/**
 * Evaluate all feedback entries
 */
export function evaluateFeedback(entries: FeedbackEntry[]): EvaluationResult {
  const entriesWithProb = entries.filter((e) => e.prediction.miss_probability !== undefined);
  const { accuracy, confusion_matrix } = calculateAccuracy(entries);
  const riskTierBreakdown = calculateRiskTierBreakdown(entries);

  return {
    total_entries: entries.length,
    entries_with_probability: entriesWithProb.length,
    brier_score: calculateBrierScore(entries),
    cost_sensitive_loss: calculateCostSensitiveLoss(entries),
    accuracy,
    confusion_matrix,
    risk_tier_breakdown: riskTierBreakdown,
  };
}

/**
 * Format evaluation result for display
 */
export function formatEvaluationResult(result: EvaluationResult): string {
  const lines = [
    '=== GateRunner Evaluation Metrics ===',
    '',
    `Total Entries: ${result.total_entries}`,
    `Entries with Miss Probability: ${result.entries_with_probability}`,
    '',
    '--- Calibration ---',
    `Brier Score: ${result.brier_score !== null ? result.brier_score.toFixed(4) : 'N/A'} (lower is better)`,
    '',
    '--- Cost-Sensitive Loss ---',
    `Average Cost: ${result.cost_sensitive_loss.toFixed(4)} (lower is better)`,
    '',
    '--- Accuracy ---',
    `Overall Accuracy: ${(result.accuracy * 100).toFixed(1)}%`,
    '',
    '--- Risk Tier Breakdown ---',
    `SAFE: ${result.risk_tier_breakdown.SAFE.correct}/${result.risk_tier_breakdown.SAFE.total} (${(result.risk_tier_breakdown.SAFE.accuracy * 100).toFixed(1)}%)`,
    `TIGHT: ${result.risk_tier_breakdown.TIGHT.correct}/${result.risk_tier_breakdown.TIGHT.total} (${(result.risk_tier_breakdown.TIGHT.accuracy * 100).toFixed(1)}%)`,
    `RISKY: ${result.risk_tier_breakdown.RISKY.correct}/${result.risk_tier_breakdown.RISKY.total} (${(result.risk_tier_breakdown.RISKY.accuracy * 100).toFixed(1)}%)`,
    '',
    '--- Confusion Matrix ---',
    `True Positive (SAFE/TIGHT, made): ${result.confusion_matrix.true_positive}`,
    `False Positive (SAFE/TIGHT, missed): ${result.confusion_matrix.false_positive}`,
    `True Negative (RISKY, missed): ${result.confusion_matrix.true_negative}`,
    `False Negative (RISKY, made): ${result.confusion_matrix.false_negative}`,
  ];

  return lines.join('\n');
}
