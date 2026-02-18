/**
 * Monte Carlo Simulation for Connection Risk Analysis
 * 
 * Uses triangular distributions to model uncertainty in timing components
 * and calculates miss probability through simulation.
 */

/**
 * Triangular distribution parameters
 * min: lower bound (e.g., p50 * 0.6)
 * mode: most likely value (p50)
 * max: upper bound (p90)
 */
export interface TriangularDistribution {
  min: number;
  mode: number;
  max: number;
}

/**
 * Simulation result containing miss probability and statistics
 */
export interface SimulationResult {
  missProbability: number;
  meanRequiredTime: number;
  stdDevRequiredTime: number;
  percentile95: number;
  percentile99: number;
  sampleCount: number;
}

/**
 * Sample from triangular distribution
 * Uses inverse transform method for efficiency
 */
function sampleTriangular(dist: TriangularDistribution): number {
  const { min, mode, max } = dist;
  const range = max - min;
  const modePos = (mode - min) / range;
  
  const u = Math.random();
  
  if (u < modePos) {
    return min + Math.sqrt(u * range * (mode - min));
  } else {
    return max - Math.sqrt((1 - u) * range * (max - mode));
  }
}

/**
 * Create triangular distribution from p50 and p90
 * Derives min as p50 * 0.6 (60% of p50)
 */
export function createTriangularDistribution(p50: number, p90: number): TriangularDistribution {
  const min = Math.max(0, p50 * 0.6);
  return {
    min,
    mode: p50,
    max: p90,
  };
}

/**
 * Run Monte Carlo simulation to calculate miss probability
 * 
 * @param distributions - Map of timing components to their distributions
 * @param availableTime - Time available for connection (in minutes)
 * @param sampleCount - Number of Monte Carlo samples (default 3000)
 * @returns Simulation result with miss probability and statistics
 */
export function runMonteCarloSimulation(
  distributions: Map<string, TriangularDistribution>,
  availableTime: number,
  sampleCount: number = 3000
): SimulationResult {
  const samples: number[] = [];
  let missCount = 0;

  // Run simulation
  for (let i = 0; i < sampleCount; i++) {
    let totalRequiredTime = 0;

    // Sum samples from all distributions
    distributions.forEach((dist) => {
      totalRequiredTime += sampleTriangular(dist);
    });

    samples.push(totalRequiredTime);

    // Count misses (required time > available time)
    if (totalRequiredTime > availableTime) {
      missCount++;
    }
  }

  // Calculate statistics
  const missProbability = missCount / sampleCount;
  const meanRequiredTime = samples.reduce((a, b) => a + b, 0) / sampleCount;
  
  // Calculate standard deviation
  const variance = samples.reduce((sum, val) => sum + Math.pow(val - meanRequiredTime, 2), 0) / sampleCount;
  const stdDevRequiredTime = Math.sqrt(variance);

  // Sort for percentile calculation
  samples.sort((a, b) => a - b);
  const percentile95 = samples[Math.floor(sampleCount * 0.95)];
  const percentile99 = samples[Math.floor(sampleCount * 0.99)];

  return {
    missProbability,
    meanRequiredTime,
    stdDevRequiredTime,
    percentile95,
    percentile99,
    sampleCount,
  };
}

/**
 * Classify connection risk based on miss probability
 * 
 * SAFE: miss_probability < 10%
 * TIGHT: 10% <= miss_probability <= 35%
 * RISKY: miss_probability > 35%
 */
export function classifyRiskByMissProbability(missProbability: number): 'SAFE' | 'TIGHT' | 'RISKY' {
  if (missProbability < 0.10) {
    return 'SAFE';
  } else if (missProbability <= 0.35) {
    return 'TIGHT';
  } else {
    return 'RISKY';
  }
}

/**
 * Format miss probability as percentage string
 */
export function formatMissProbability(probability: number): string {
  return `${(probability * 100).toFixed(1)}%`;
}

/**
 * Format time value with decimal places
 */
export function formatTime(minutes: number): string {
  return minutes.toFixed(1);
}
