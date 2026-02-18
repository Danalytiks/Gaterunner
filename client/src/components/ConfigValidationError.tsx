/**
 * Configuration Validation Error Component
 * 
 * Displays validation errors from airports-config.json in a user-friendly format.
 * Shows on app startup if configuration is invalid.
 */

import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ConfigValidationErrorProps {
  errorMessage: string;
}

export default function ConfigValidationError({ errorMessage }: ConfigValidationErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-red-300 shadow-lg">
        <CardHeader className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6" />
            <CardTitle>Erro de Configuração</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <p className="text-sm text-slate-700">
              A configuração de aeroportos contém erros e não pode ser carregada. Por favor, corrija os problemas abaixo:
            </p>

            {/* Error Message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <pre className="text-xs font-mono text-red-800 whitespace-pre-wrap break-words overflow-auto max-h-96">
                {errorMessage}
              </pre>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-blue-900">Como corrigir:</h3>
              <ol className="text-xs text-blue-800 space-y-1 list-decimal list-inside">
                <li>Abra o arquivo <code className="bg-white px-1 rounded">client/public/airports-config.json</code></li>
                <li>Verifique os erros listados acima</li>
                <li>Corrija os campos faltantes ou inválidos</li>
                <li>Recarregue a página (F5)</li>
              </ol>
            </div>

            {/* Common Issues */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
              <h3 className="font-semibold text-sm text-amber-900">Problemas comuns:</h3>
              <ul className="text-xs text-amber-800 space-y-1 list-disc list-inside">
                <li>
                  <strong>p50 &gt; p90:</strong> O valor p50 (mediana) deve ser menor ou igual a p90 (percentil 90)
                </li>
                <li>
                  <strong>Valores negativos:</strong> Todos os tempos devem ser positivos (≥ 0)
                </li>
                <li>
                  <strong>Campos faltantes:</strong> Verifique se todos os campos obrigatórios estão presentes
                </li>
                <li>
                  <strong>Tipos incorretos:</strong> Códigos de aeroporto devem ser strings, tempos devem ser números
                </li>
                <li>
                  <strong>transfer_mode:</strong> Deve ser um de: &quot;walk&quot;, &quot;bus&quot;, &quot;train&quot;
                </li>
              </ul>
            </div>

            {/* Developer Info */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-600">
                <strong>Para desenvolvedores:</strong> Verifique o console do navegador (F12 → Console) para mais detalhes sobre os erros de validação.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
