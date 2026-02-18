/**
 * Landing Alert Component
 * 
 * Shows a simple notification when a flight lands.
 * Triggers connection recalculation automatically.
 */

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface LandingAlertProps {
  flightNumber: string;
  onDismiss: () => void;
  onRecalculate: () => void;
}

export default function LandingAlert({
  flightNumber,
  onDismiss,
  onRecalculate,
}: LandingAlertProps) {
  useEffect(() => {
    // Show toast notification
    toast.info(
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div>
          <p className="font-semibold">Voo pouso</p>
          <p className="text-sm text-slate-600 mt-1">
            Voo {flightNumber} pousou. Recalculando sua conexão...
          </p>
        </div>
      </div>,
      {
        duration: 5000,
        onAutoClose: () => {
          onDismiss();
        },
      }
    );

    // Trigger recalculation
    onRecalculate();

    // Dismiss after 5 seconds
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);

    return () => clearTimeout(timer);
  }, [flightNumber, onDismiss, onRecalculate]);

  return null; // This component only manages the toast
}
