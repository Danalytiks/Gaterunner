/**
 * Post-Trip Feedback Component
 * 
 * Collects user feedback after a connection attempt:
 * - Did you make the connection? (yes/no)
 * - How much time was left? (0-5, 5-15, 15+ minutes)
 * 
 * Stores feedback locally for evaluation metrics.
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { feedbackLogger } from '@/lib/feedbackLogger';
import type { ConnectionCalculation } from '@/lib/connectionCalculator';

interface PostTripFeedbackProps {
  result: ConnectionCalculation;
  onFeedbackSubmitted?: () => void;
}

export default function PostTripFeedback({ result, onFeedbackSubmitted }: PostTripFeedbackProps) {
  const [madeConnection, setMadeConnection] = useState<boolean | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (madeConnection === null) {
      alert('Por favor, responda se conseguiu fazer a conexão.');
      return;
    }

    await feedbackLogger.logFeedback({
      inputs: {
        available_time: result.available_time,
        airport_found: result.airportFound,
        profile_type: result.profileType,
      },
      prediction: {
        risk_tier: result.status,
        required_time_p50: result.required_time_p50,
        required_time_p90: result.required_time_p90,
        miss_probability: result.missProbability,
      },
      outcome: {
        made_connection: madeConnection,
        time_left_category: timeLeft || undefined,
      },
    });

    setSubmitted(true);
    onFeedbackSubmitted?.();

    // Reset form after 3 seconds
    setTimeout(() => {
      setMadeConnection(null);
      setTimeLeft(null);
      setSubmitted(false);
    }, 3000);
  };

  if (submitted) {
    return (
      <Card className="w-full bg-green-50 border-green-200">
        <CardContent className="pt-6 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">Obrigado! Seu feedback foi registrado.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-base">Feedback da Sua Viagem</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <Label className="text-sm font-semibold">Você conseguiu fazer a conexão?</Label>
          <RadioGroup value={madeConnection === null ? '' : String(madeConnection)} onValueChange={(v) => setMadeConnection(v === 'true')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="true" id="made-yes" />
              <Label htmlFor="made-yes" className="font-normal cursor-pointer">Sim, consegui fazer a conexão</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id="made-no" />
              <Label htmlFor="made-no" className="font-normal cursor-pointer">Não, perdi a conexão</Label>
            </div>
          </RadioGroup>
        </div>

        {madeConnection && (
          <div className="space-y-3">
            <Label className="text-sm font-semibold">Quanto tempo sobrou?</Label>
            <RadioGroup value={timeLeft || ''} onValueChange={setTimeLeft}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0-5" id="time-0-5" />
                <Label htmlFor="time-0-5" className="font-normal cursor-pointer">0–5 minutos (muito apertado)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5-15" id="time-5-15" />
                <Label htmlFor="time-5-15" className="font-normal cursor-pointer">5–15 minutos (confortável)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="15+" id="time-15plus" />
                <Label htmlFor="time-15plus" className="font-normal cursor-pointer">15+ minutos (muito confortável)</Label>
              </div>
            </RadioGroup>
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            className="flex-1"
            variant={madeConnection === null ? 'outline' : 'default'}
          >
            Enviar Feedback
          </Button>
        </div>

        <p className="text-xs text-slate-500 text-center">
          Seus dados são armazenados localmente e ajudam a melhorar as previsões.
        </p>
      </CardContent>
    </Card>
  );
}
