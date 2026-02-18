/**
 * Cache Debug Controls Component
 * 
 * Development tool to clear cache and force reload airport configuration.
 * Helps debug cache-related issues.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Trash2 } from 'lucide-react';
import { airportConfigManager } from '@/lib/airportConfigLoader';
import { toast } from 'sonner';

export default function CacheDebugControls() {
  const [isLoading, setIsLoading] = useState(false);

  const handleClearCache = async () => {
    try {
      setIsLoading(true);
      console.log('[CacheDebugControls] Limpando cache...');
      
      // Clear cache
      airportConfigManager.clearCache();
      
      // Force reload
      const config = await airportConfigManager.forceRefresh();
      
      console.log(`[CacheDebugControls] Cache limpo e recarregado: ${config.airports.length} aeroportos`);
      toast.success(`Cache limpo! ${config.airports.length} aeroportos carregados.`);
      
      // Reload page to update UI
      window.location.reload();
    } catch (error) {
      console.error('[CacheDebugControls] Erro ao limpar cache:', error);
      toast.error('Erro ao limpar cache. Verifique o console.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintStats = () => {
    console.log('[CacheDebugControls] Exibindo estatísticas...');
    airportConfigManager.printStats();
    toast.info('Estatísticas exibidas no console (F12)');
  };

  return (
    <Card className="border-amber-200 bg-amber-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          Ferramentas de Debug (Desenvolvimento)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-amber-800">
          Se o dropdown não mostra novos aeroportos após editar o arquivo de configuração, use estas ferramentas para limpar o cache.
        </p>
        
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleClearCache}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Limpar Cache e Recarregar
          </Button>
          
          <Button
            size="sm"
            variant="outline"
            onClick={handlePrintStats}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Ver Estatísticas
          </Button>
        </div>
        
        <p className="text-xs text-amber-700">
          <strong>Dica:</strong> Abra o console (F12) para ver logs detalhados do carregamento de configuração.
        </p>
      </CardContent>
    </Card>
  );
}
