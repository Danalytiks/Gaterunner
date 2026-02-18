/**
 * Home Page
 * 
 * Main page for GateRunner MVP.
 * Displays connection risk calculator with form and results.
 */

import { useState } from 'react';
import ConnectionForm from '@/components/ConnectionForm';
import ConnectionResult from '@/components/ConnectionResult';
import PostTripFeedback from '@/components/PostTripFeedback';
import LandingAlert from '@/components/LandingAlert';
import DebugToggle from '@/components/DebugToggle';
import { useFlightStatus } from '@/hooks/useFlightStatus';
import { type ConnectionCalculation } from '@/lib/connectionCalculator';

export default function Home() {
  const [result, setResult] = useState<ConnectionCalculation | null>(null);
  const { hasLandingAlert, clearLandingAlert } = useFlightStatus();

  const handleRecalculate = () => {
    // In a real app, this would recalculate based on current flight data
    // For now, just show a message
    console.log('Recalculating connection...');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">GateRunner</h1>
            <p className="text-sm text-slate-600">Calculadora de Risco de Conexão</p>
          </div>
          <div className="text-right text-sm text-slate-600">
            <p>MVP Simplificado</p>
            <p>Dados automáticos de aeroporto</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {/* Debug Toggle */}
        <DebugToggle />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form - Takes up 1 column on large screens */}
          <div className="lg:col-span-1">
            <ConnectionForm onCalculate={setResult} />
          </div>

          {/* Result - Takes up 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {result ? (
              <>
                <ConnectionResult result={result} />
                <PostTripFeedback result={result} />
              </>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <div className="text-slate-400 mb-4">
                  <svg
                    className="w-16 h-16 mx-auto"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <p className="text-slate-600">
                  Preencha o formulário e clique em "Calcular Risco" para ver o resultado.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 bg-white rounded-lg border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Como funciona</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">1. Informe seus voos</h3>
              <p className="text-sm text-slate-600">
                Selecione os aeroportos, terminais e horários de chegada e embarque.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">2. Dados automáticos</h3>
              <p className="text-sm text-slate-600">
                Os tempos de transferência, segurança e deplane são calculados automaticamente
                a partir dos dados do aeroporto.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 mb-2">3. Avaliação de risco</h3>
              <p className="text-sm text-slate-600">
                Receba uma classificação clara: SEGURA, APERTADA ou ARRISCADA.
              </p>
            </div>
          </div>
        </div>

        {/* Status Classifications */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-semibold text-green-900">✓ Conexão Segura</p>
            <p className="text-sm text-green-700 mt-1">
              Tempo disponível ≥ tempo necessário (p90)
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="font-semibold text-amber-900">⚠ Conexão Apertada</p>
            <p className="text-sm text-amber-700 mt-1">
              Tempo disponível entre p50 e p90
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="font-semibold text-red-900">✗ Conexão Arriscada</p>
            <p className="text-sm text-red-700 mt-1">
              Tempo disponível &lt; tempo necessário (p50)
            </p>
          </div>
        </div>
      </main>

      {/* Landing Alerts */}
      {hasLandingAlert('flight-1') && (
        <LandingAlert
          flightNumber="AA123"
          onDismiss={() => clearLandingAlert('flight-1')}
          onRecalculate={handleRecalculate}
        />
      )}
    </div>
  );
}
