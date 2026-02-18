/**
 * Connection Form Component (Refactored for Dynamic Airport Loading)
 * 
 * Simplified form that removes manual time entry fields.
 * Dynamically loads airports from configuration file.
 * Users only input:
 * - Arrival airport and time
 * - Boarding airport and time
 * - Terminal information
 * - Gate type (gate vs remote)
 * - Flight type (domestic vs international)
 * 
 * All timing calculations are automatic from airport rules.
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  calculateConnection,
  timeStringToMinutes,
  type ConnectionCalculation,
} from '@/lib/connectionCalculator';
import {
  getAirportCodes,
  getTerminalsForAirport,
  getAvailableAirports,
} from '@/lib/airportRules';

interface ConnectionFormProps {
  onCalculate: (result: ConnectionCalculation) => void;
}

export default function ConnectionForm({ onCalculate }: ConnectionFormProps) {
  const [airports, setAirports] = useState<string[]>([]);
  const [arrivalTerminals, setArrivalTerminals] = useState<string[]>([]);
  const [boardingTerminals, setBoardingTerminals] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [arrivalAirport, setArrivalAirport] = useState('');
  const [arrivalTime, setArrivalTime] = useState('14:30');
  const [arrivalTerminal, setArrivalTerminal] = useState('');
  const [isRemoteGate, setIsRemoteGate] = useState(false);

  const [boardingAirport, setBoardingAirport] = useState('');
  const [boardingTime, setBoardingTime] = useState('16:00');
  const [boardingTerminal, setBoardingTerminal] = useState('');
  const [isInternational, setIsInternational] = useState(false);

  const [errors, setErrors] = useState<string[]>([]);
  const [calculating, setCalculating] = useState(false);

  // Load airports on component mount
  useEffect(() => {
    const loadAirports = async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const codes = await getAirportCodes();
        setAirports(codes);

        // Set default airports if available
        if (codes.length > 0) {
          setArrivalAirport(codes[0]);
          setBoardingAirport(codes[0]);
        }
      } catch (error) {
        console.error('Failed to load airports:', error);
        setLoadError('Erro ao carregar lista de aeroportos. Tente recarregar a página.');
      } finally {
        setLoading(false);
      }
    };

    loadAirports();
  }, []);

  // Load terminals when arrival airport changes
  useEffect(() => {
    const loadTerminals = async () => {
      if (!arrivalAirport) return;

      try {
        const terminals = await getTerminalsForAirport(arrivalAirport);
        setArrivalTerminals(terminals);
        if (terminals.length > 0) {
          setArrivalTerminal(terminals[0]);
        }
      } catch (error) {
        console.error('Failed to load terminals:', error);
      }
    };

    loadTerminals();
  }, [arrivalAirport]);

  // Load terminals when boarding airport changes
  useEffect(() => {
    const loadTerminals = async () => {
      if (!boardingAirport) return;

      try {
        const terminals = await getTerminalsForAirport(boardingAirport);
        setBoardingTerminals(terminals);
        if (terminals.length > 0) {
          setBoardingTerminal(terminals[0]);
        }
      } catch (error) {
        console.error('Failed to load terminals:', error);
      }
    };

    loadTerminals();
  }, [boardingAirport]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: string[] = [];

    // Validate inputs
    if (!arrivalAirport) newErrors.push('Selecione o aeroporto de chegada');
    if (!arrivalTime) newErrors.push('Informe a hora de chegada');
    if (!arrivalTerminal) newErrors.push('Selecione o terminal de chegada');
    if (!boardingAirport) newErrors.push('Selecione o aeroporto de embarque');
    if (!boardingTime) newErrors.push('Informe a hora de embarque');
    if (!boardingTerminal) newErrors.push('Selecione o terminal de embarque');

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setCalculating(true);
      setErrors([]);

      // Convert times to minutes
      const arrivalMinutes = timeStringToMinutes(arrivalTime);
      const boardingMinutes = timeStringToMinutes(boardingTime);

      // Calculate connection
      const result = await calculateConnection(
        arrivalMinutes,
        boardingMinutes,
        arrivalAirport,
        arrivalTerminal,
        boardingTerminal,
        isRemoteGate,
        isInternational
      );

      onCalculate(result);
    } catch (error) {
      console.error('Calculation error:', error);
      setErrors(['Erro ao calcular risco de conexão. Tente novamente.']);
    } finally {
      setCalculating(false);
    }
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Calcular Risco de Conexão</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Carregando dados de aeroportos...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Calcular Risco de Conexão</CardTitle>
        <CardDescription>
          Informe seus voos e terminais. Os tempos de transferência são calculados automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loadError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-700">{loadError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                {errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Arrival Section */}
          <div className="space-y-4 pb-6 border-b">
            <h3 className="font-semibold text-base">Voo de Chegada</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrival-airport">Aeroporto</Label>
                <Select value={arrivalAirport} onValueChange={setArrivalAirport}>
                  <SelectTrigger id="arrival-airport">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="arrival-time">Hora de Chegada</Label>
                <Input
                  id="arrival-time"
                  type="time"
                  value={arrivalTime}
                  onChange={(e) => setArrivalTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="arrival-terminal">Terminal</Label>
                <Select value={arrivalTerminal} onValueChange={setArrivalTerminal}>
                  <SelectTrigger id="arrival-terminal">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {arrivalTerminals.map((terminal) => (
                      <SelectItem key={terminal} value={terminal}>
                        Terminal {terminal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote-gate"
                    checked={isRemoteGate}
                    onCheckedChange={(checked) => setIsRemoteGate(checked as boolean)}
                  />
                  <Label htmlFor="remote-gate" className="font-normal cursor-pointer">
                    Portão remoto
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Boarding Section */}
          <div className="space-y-4 pb-6 border-b">
            <h3 className="font-semibold text-base">Voo de Embarque</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="boarding-airport">Aeroporto</Label>
                <Select value={boardingAirport} onValueChange={setBoardingAirport}>
                  <SelectTrigger id="boarding-airport">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {airports.map((code) => (
                      <SelectItem key={code} value={code}>
                        {code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="boarding-time">Hora de Embarque</Label>
                <Input
                  id="boarding-time"
                  type="time"
                  value={boardingTime}
                  onChange={(e) => setBoardingTime(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="boarding-terminal">Terminal</Label>
                <Select value={boardingTerminal} onValueChange={setBoardingTerminal}>
                  <SelectTrigger id="boarding-terminal">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {boardingTerminals.map((terminal) => (
                      <SelectItem key={terminal} value={terminal}>
                        Terminal {terminal}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 flex items-end">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="international"
                    checked={isInternational}
                    onCheckedChange={(checked) => setIsInternational(checked as boolean)}
                  />
                  <Label htmlFor="international" className="font-normal cursor-pointer">
                    Voo internacional
                  </Label>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full" size="lg" disabled={calculating}>
            {calculating ? 'Calculando...' : 'Calcular Risco'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
