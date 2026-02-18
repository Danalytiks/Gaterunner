/**
 * Connection Calculator (Refactored for Dynamic Airport Rules)
 * 
 * Calculates connection risk based on:
 * - Available time: boarding_time - arrival_time
 * - Required time: deplane + transfer + security + operational buffer
 * - Monte Carlo simulation for miss probability
 * 
 * Risk classification based on miss probability:
 * - SAFE: miss_probability < 10%
 * - TIGHT: 10% <= miss_probability <= 35%
 * - RISKY: miss_probability > 35%
 */

import {
  findAirportRule,
  getDeplaneTimes,
  getSecurityTimes,
  getTransferTimes,
  getGenericFallbackTimings,
} from './airportRules';
import {
  createTriangularDistribution,
  runMonteCarloSimulation,
  classifyRiskByMissProbability,
} from './monteCarloSimulation';
import { simulationCacheManager } from './simulationCache';
import { airportProfileManager } from './airportProfileSelector';

export type ConnectionStatus = 'SAFE' | 'TIGHT' | 'RISKY';

export interface ConnectionCalculation {
  available_time: number;
  required_time_p50: number;
  required_time_p90: number;
  status: ConnectionStatus;
  missProbability?: number; // Probability of missing connection (from Monte Carlo)
  details: {
    deplane_p50: number;
    deplane_p90: number;
    transfer_p50: number;
    transfer_p90: number;
    security_p50: number;
    security_p90: number;
    buffer: number;
  };
  airportFound: boolean;
  warning?: string;
  profileType?: string; // Type of profile used (small/medium/hub) for generic airports
  profileReason?: string; // Reason why profile was selected
}

const OPERATIONAL_BUFFER = 5; // 5 minutes buffer for operational contingencies

/**
 * Calculate connection risk (async)
 * 
 * @param arrivalTime - Arrival time in minutes (from midnight)
 * @param boardingTime - Boarding time in minutes (from midnight)
 * @param airportCode - IATA airport code
 * @param terminalFrom - Departure terminal
 * @param terminalTo - Arrival terminal
 * @param isRemoteGate - Whether arrival is at a remote gate
 * @param isInternational - Whether connection involves international flight
 * 
 * @returns Connection calculation with status and timing details
 */
export async function calculateConnection(
  arrivalTime: number,
  boardingTime: number,
  airportCode: string,
  terminalFrom: string,
  terminalTo: string,
  isRemoteGate: boolean,
  isInternational: boolean
): Promise<ConnectionCalculation> {
  // Calculate available time
  let available_time = boardingTime - arrivalTime;

  // Handle overnight connections (e.g., arrival at 23:00, boarding at 02:00 next day)
  if (available_time < 0) {
    available_time += 24 * 60; // Add 24 hours in minutes
  }

  // Find airport rule
  const rule = await findAirportRule(airportCode, terminalFrom, terminalTo);

  if (!rule) {
    // Use generic airport profile for unknown airport
    const isTerminalChange = terminalFrom !== terminalTo;
    const profileSelection = await airportProfileManager.selectProfile(
      isTerminalChange,
      isRemoteGate,
      isInternational
    );

    const deplane = await airportProfileManager.getDeplaneTimes(
      isRemoteGate,
      profileSelection.profileType
    );

    const transfer = await airportProfileManager.calculateTransferTime(
      isTerminalChange,
      isRemoteGate,
      profileSelection.profileType
    );

    const security = await airportProfileManager.getSecurityTimes(
      isInternational,
      profileSelection.profileType
    );

    const required_time_p50 = deplane.p50 + transfer.p50 + security.p50 + OPERATIONAL_BUFFER;
    const required_time_p90 = deplane.p90 + transfer.p90 + security.p90 + OPERATIONAL_BUFFER;

    // Run Monte Carlo simulation for profile case (with cache)
    let simResult = simulationCacheManager.get(
      available_time,
      deplane.p50,
      deplane.p90,
      transfer.p50,
      transfer.p90,
      security.p50,
      security.p90,
      OPERATIONAL_BUFFER
    );

    if (!simResult) {
      const distributions = new Map([
        ['deplane', createTriangularDistribution(deplane.p50, deplane.p90)],
        ['transfer', createTriangularDistribution(transfer.p50, transfer.p90)],
        ['security', createTriangularDistribution(security.p50, security.p90)],
        ['buffer', createTriangularDistribution(OPERATIONAL_BUFFER, OPERATIONAL_BUFFER)],
      ]);

      simResult = runMonteCarloSimulation(distributions, available_time, 3000);
      simulationCacheManager.set(
        available_time,
        deplane.p50,
        deplane.p90,
        transfer.p50,
        transfer.p90,
        security.p50,
        security.p90,
        OPERATIONAL_BUFFER,
        simResult
      );
    }

    const missProbability = simResult.missProbability;
    const status = classifyRiskByMissProbability(missProbability);

    return {
      available_time,
      required_time_p50,
      required_time_p90,
      status,
      missProbability,
      details: {
        deplane_p50: deplane.p50,
        deplane_p90: deplane.p90,
        transfer_p50: transfer.p50,
        transfer_p90: transfer.p90,
        security_p50: security.p50,
        security_p90: security.p90,
        buffer: OPERATIONAL_BUFFER,
      },
      airportFound: false,
      warning: `Aeroporto ${airportCode} nao encontrado. Usando modelo generico de timing.`,
      profileType: profileSelection.profileType,
      profileReason: profileSelection.reason,
    };
  }

  // Get timing components
  const deplane = getDeplaneTimes(rule, isRemoteGate);
  const transfer = getTransferTimes(rule);
  const security = getSecurityTimes(rule, isInternational);

  // Calculate required times
  const required_time_p50 =
    deplane.p50 + transfer.p50 + security.p50 + OPERATIONAL_BUFFER;
  const required_time_p90 =
    deplane.p90 + transfer.p90 + security.p90 + OPERATIONAL_BUFFER;

  // Run Monte Carlo simulation to calculate miss probability (with cache)
  let simResult = simulationCacheManager.get(
    available_time,
    deplane.p50,
    deplane.p90,
    transfer.p50,
    transfer.p90,
    security.p50,
    security.p90,
    OPERATIONAL_BUFFER
  );

  if (!simResult) {
    const distributions = new Map([
      ['deplane', createTriangularDistribution(deplane.p50, deplane.p90)],
      ['transfer', createTriangularDistribution(transfer.p50, transfer.p90)],
      ['security', createTriangularDistribution(security.p50, security.p90)],
      ['buffer', createTriangularDistribution(OPERATIONAL_BUFFER, OPERATIONAL_BUFFER)],
    ]);

    simResult = runMonteCarloSimulation(distributions, available_time, 3000);
    simulationCacheManager.set(
      available_time,
      deplane.p50,
      deplane.p90,
      transfer.p50,
      transfer.p90,
      security.p50,
      security.p90,
      OPERATIONAL_BUFFER,
      simResult
    );
  }

  const missProbability = simResult.missProbability;

  // Determine status based on miss probability
  const status = classifyRiskByMissProbability(missProbability);

  return {
    available_time,
    required_time_p50,
    required_time_p90,
    status,
    missProbability,
    details: {
      deplane_p50: deplane.p50,
      deplane_p90: deplane.p90,
      transfer_p50: transfer.p50,
      transfer_p90: transfer.p90,
      security_p50: security.p50,
      security_p90: security.p90,
      buffer: OPERATIONAL_BUFFER,
    },
    airportFound: true,
  };
}

/**
 * Format time in minutes to HH:MM format
 */
export function formatMinutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Convert HH:MM string to minutes from midnight
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Get human-readable status message
 */
export function getStatusMessage(status: ConnectionStatus): string {
  const messages = {
    SAFE: 'Conexao segura',
    TIGHT: 'Conexao apertada',
    RISKY: 'Conexao arriscada',
  };
  return messages[status];
}

/**
 * Get status color for UI
 */
export function getStatusColor(status: ConnectionStatus): string {
  const colors = {
    SAFE: 'text-green-600 bg-green-50',
    TIGHT: 'text-amber-600 bg-amber-50',
    RISKY: 'text-red-600 bg-red-50',
  };
  return colors[status];
}
