/**
 * Airport Rules System (Refactored for Dynamic Loading)
 * 
 * This module now loads airport rules dynamically from the configuration file.
 * No hardcoded airport data - all rules are loaded at runtime.
 */

import { airportConfigManager, type AirportTransferRule } from './airportConfigLoader';

/**
 * Get deplane time based on gate type
 */
export function getDeplaneTimes(
  rule: AirportTransferRule,
  isRemote: boolean
): { p50: number; p90: number } {
  if (isRemote) {
    return {
      p50: rule.deplane_remote_p50,
      p90: rule.deplane_remote_p90,
    };
  }
  return {
    p50: rule.deplane_gate_p50,
    p90: rule.deplane_gate_p90,
  };
}

/**
 * Get security screening time based on flight type
 */
export function getSecurityTimes(
  rule: AirportTransferRule,
  isInternational: boolean
): { p50: number; p90: number } {
  if (isInternational) {
    return {
      p50: rule.security_international_p50,
      p90: rule.security_international_p90,
    };
  }
  return {
    p50: rule.security_domestic_p50,
    p90: rule.security_domestic_p90,
  };
}

/**
 * Get transfer time
 */
export function getTransferTimes(rule: AirportTransferRule): { p50: number; p90: number } {
  return {
    p50: rule.transfer_time_p50,
    p90: rule.transfer_time_p90,
  };
}

/**
 * Find airport rule for a specific transfer (async)
 */
export async function findAirportRule(
  airportCode: string,
  terminalFrom: string,
  terminalTo: string
): Promise<AirportTransferRule | null> {
  return airportConfigManager.getTransferRule(airportCode, terminalFrom, terminalTo);
}

/**
 * Get all available airports (async)
 */
export async function getAvailableAirports() {
  return airportConfigManager.getAirports();
}

/**
 * Get airport codes (async)
 */
export async function getAirportCodes() {
  return airportConfigManager.getAirportCodes();
}

/**
 * Get terminals for an airport (async)
 */
export async function getTerminalsForAirport(airportCode: string) {
  return airportConfigManager.getTerminals(airportCode);
}

/**
 * Check if airport exists (async)
 */
export async function airportExists(code: string) {
  return airportConfigManager.airportExists(code);
}

/**
 * Get generic fallback timings for unknown airports
 */
export async function getGenericFallbackTimings() {
  return airportConfigManager.getFallbackTimings();
}
