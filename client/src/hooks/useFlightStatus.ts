/**
 * Flight Status Hook
 * 
 * Manages flight status and landing alerts.
 * Tracks when flights land and triggers recalculation.
 */

import { useState, useCallback } from 'react';

export type FlightStatus = 'SCHEDULED' | 'BOARDING' | 'DEPARTED' | 'IN_FLIGHT' | 'LANDED' | 'CANCELLED';

export interface FlightInfo {
  id: string;
  flightNumber: string;
  status: FlightStatus;
  arrivalTime: string;
  hasShownLandingAlert: boolean;
}

export function useFlightStatus() {
  const [flights, setFlights] = useState<Map<string, FlightInfo>>(new Map());
  const [landingAlerts, setLandingAlerts] = useState<Set<string>>(new Set());

  const updateFlightStatus = useCallback(
    (flightId: string, newStatus: FlightStatus, arrivalTime: string, flightNumber: string) => {
      setFlights((prev) => {
        const updated = new Map(prev);
        const flight = updated.get(flightId) || {
          id: flightId,
          flightNumber,
          status: 'SCHEDULED' as FlightStatus,
          arrivalTime: '',
          hasShownLandingAlert: false,
        };

        const wasInFlight = flight.status === 'IN_FLIGHT';
        const isNowLanded = newStatus === 'LANDED';

        // Check if this is a new landing (transition from IN_FLIGHT to LANDED)
        if (wasInFlight && isNowLanded && !flight.hasShownLandingAlert) {
          // Mark that we should show the landing alert
          setLandingAlerts((prev) => new Set(prev).add(flightId));
          flight.hasShownLandingAlert = true;
        }

        updated.set(flightId, {
          id: flightId,
          flightNumber,
          status: newStatus,
          arrivalTime,
          hasShownLandingAlert: flight.hasShownLandingAlert,
        });

        return updated;
      });
    },
    []
  );

  const clearLandingAlert = useCallback((flightId: string) => {
    setLandingAlerts((prev) => {
      const updated = new Set(prev);
      updated.delete(flightId);
      return updated;
    });
  }, []);

  const getFlightStatus = useCallback(
    (flightId: string): FlightStatus | null => {
      return flights.get(flightId)?.status || null;
    },
    [flights]
  );

  const hasLandingAlert = useCallback(
    (flightId: string): boolean => {
      return landingAlerts.has(flightId);
    },
    [landingAlerts]
  );

  return {
    flights,
    updateFlightStatus,
    clearLandingAlert,
    getFlightStatus,
    hasLandingAlert,
    landingAlerts,
  };
}
