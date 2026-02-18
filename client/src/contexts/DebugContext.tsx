/**
 * Debug Context
 * 
 * Provides global debug settings for development features
 * (hidden by default, only visible in development)
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface DebugContextType {
  showMissProbability: boolean;
  toggleMissProbability: () => void;
  isDevelopment: boolean;
}

const DebugContext = createContext<DebugContextType | undefined>(undefined);

export function DebugProvider({ children }: { children: ReactNode }) {
  const [showMissProbability, setShowMissProbability] = useState(false);
  const isDevelopment = import.meta.env.DEV;

  const toggleMissProbability = () => {
    setShowMissProbability(!showMissProbability);
    console.log(`[Debug] Miss probability display: ${!showMissProbability ? 'ON' : 'OFF'}`);
  };

  return (
    <DebugContext.Provider
      value={{
        showMissProbability,
        toggleMissProbability,
        isDevelopment,
      }}
    >
      {children}
    </DebugContext.Provider>
  );
}

export function useDebug() {
  const context = useContext(DebugContext);
  if (!context) {
    throw new Error('useDebug must be used within DebugProvider');
  }
  return context;
}
