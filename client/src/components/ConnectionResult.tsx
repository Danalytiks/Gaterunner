/**
 * Connection Result Component (Updated for Generic Airport Profiles)
 * 
 * Displays connection risk assessment with:
 * - Estimated time needed (p50–p90 range)
 * - Time available
 * - Connection status (SAFE / TIGHT / RISKY)
 * - Warning if airport not found (generic model used)
 * - Profile information for generic airports
 * 
 * No technical terms are shown to users.
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, AlertTriangle, Info } from 'lucide-react';
import {
  getStatusMessage,
  type ConnectionCalculation,
} from '@/lib/connectionCalculator';
import { useDebug } from '@/contexts/DebugContext';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ConnectionResultProps {
  result: ConnectionCalculation;
}

export default function ConnectionResult({ result }: ConnectionResultProps) {
  const { showMissProbability } = useDebug();
  const { available_time, required_time_p50, required_time_p90, status, details, airportFound, warning, missProbability, profileType, profileReason } = result;

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'SAFE':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'TIGHT':
        return <Clock className="w-6 h-6 text-amber-600" />;
      case 'RISKY':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
    }
  };

  const getStatusBgColor = () => {
    switch (status) {
      case 'SAFE':
        return 'bg-green-50 border-green-200';
      case 'TIGHT':
        return 'bg-amber-50 border-amber-200';
      case 'RISKY':
        return 'bg-red-50 border-red-200';
    }
  };

  const getStatusTextColor = () => {
    switch (status) {
      case 'SAFE':
        return 'text-green-900';
      case 'TIGHT':
        return 'text-amber-900';
      case 'RISKY':
        return 'text-red-900';
    }
  };

  const getProfileDisplayName = (type: string): string => {
    const names: Record<string, string> = {
      small: 'Pequeno',
      medium: 'Médio',
      hub: 'Hub',
    };
    return names[type] || type;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Resultado da Conexão</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Warning if airport not found */}
        {!airportFound && warning && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">Usando modelo genérico de timing</p>
              <p className="text-sm text-amber-700 mt-1">{warning}</p>
              {profileType && profileReason && (
                <div className="mt-2 pt-2 border-t border-amber-200">
                  <p className="text-xs text-amber-600">
                    <span className="font-medium">Perfil:</span> {getProfileDisplayName(profileType)}
                  </p>
                  <p className="text-xs text-amber-600 italic mt-1">{profileReason}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Status Banner */}
        <div className={`border rounded-lg p-4 flex items-start gap-3 ${getStatusBgColor()}`}>
          <div className="mt-1">{getStatusIcon()}</div>
          <div className="flex-1">
            <p className={`font-semibold text-lg ${getStatusTextColor()}`}>
              {getStatusMessage(status)}
            </p>
            <p className={`text-sm mt-1 ${getStatusTextColor()}`}>
              {status === 'SAFE' &&
                'Você tem tempo suficiente para fazer a conexão com conforto.'}
              {status === 'TIGHT' &&
                'A conexão é possível, mas com pouca margem. Fique atento aos atrasos.'}
              {status === 'RISKY' &&
                'Há risco significativo de perder a conexão. Considere um voo posterior.'}
            </p>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-50 rounded-lg p-4">
            <p className="text-sm text-slate-600 mb-1">Tempo disponível</p>
            <p className="text-2xl font-bold text-slate-900">{formatTime(available_time)}</p>
          </div>
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 mb-1">Tempo necessário</p>
                <p className="text-2xl font-bold text-slate-900">
                  {formatTime(required_time_p50)}–{formatTime(required_time_p90)}
                </p>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-4 h-4 text-slate-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs">Inclui incerteza nos tempos</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Debug: Miss Probability */}
        {showMissProbability && missProbability !== undefined && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <p className="text-sm text-purple-900">
              <span className="font-semibold">Miss Probability (Debug):</span> {(missProbability * 100).toFixed(1)}%
            </p>
          </div>
        )}

        {/* Timing Breakdown */}
        <div className="space-y-3">
          <p className="font-semibold text-sm text-slate-700">Detalhamento do tempo necessário:</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-slate-600">Desembarque</span>
              <span className="font-medium">
                {details.deplane_p50}–{details.deplane_p90} min
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-slate-600">Transferência entre terminais</span>
              <span className="font-medium">
                {details.transfer_p50}–{details.transfer_p90} min
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-slate-600">Segurança</span>
              <span className="font-medium">
                {details.security_p50}–{details.security_p90} min
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-slate-600">Margem de segurança</span>
              <span className="font-medium">{details.buffer} min</span>
            </div>
          </div>
        </div>

        {/* Recommendation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">Dica:</span> Estes tempos são baseados em dados históricos
            de aeroportos. Atrasos podem ocorrer. Se sua conexão for apertada, chegue cedo no
            aeroporto.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
