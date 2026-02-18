/**
 * Debug Toggle Component
 * 
 * Development-only toggle to show/hide miss probability
 * Only visible in development mode
 */

import { useDebug } from '@/contexts/DebugContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Bug } from 'lucide-react';

export default function DebugToggle() {
  const { showMissProbability, toggleMissProbability, isDevelopment } = useDebug();

  if (!isDevelopment) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-purple-50 mb-4">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Debug Mode</span>
          </div>
          <Button
            size="sm"
            variant={showMissProbability ? 'default' : 'outline'}
            onClick={toggleMissProbability}
            className="text-xs"
          >
            {showMissProbability ? 'Hide' : 'Show'} Miss Probability
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
