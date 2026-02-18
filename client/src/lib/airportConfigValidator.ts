/**
 * Airport Configuration Validator
 * 
 * Validates airports-config.json structure and values on app startup.
 * Ensures data integrity before using in calculations.
 */

export interface ValidationError {
  type: 'airport' | 'rule' | 'field';
  airportCode?: string;
  ruleIndex?: number;
  field?: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

/**
 * Required fields for each airport object
 */
const REQUIRED_AIRPORT_FIELDS = ['airport_code', 'airport_name', 'country', 'rules'];

/**
 * Required fields for each transfer rule
 */
const REQUIRED_RULE_FIELDS = [
  'terminal_from',
  'terminal_to',
  'transfer_mode',
  'transfer_time_p50',
  'transfer_time_p90',
  'deplane_gate_p50',
  'deplane_gate_p90',
  'deplane_remote_p50',
  'deplane_remote_p90',
  'security_domestic_p50',
  'security_domestic_p90',
  'security_international_p50',
  'security_international_p90',
];

/**
 * Numeric fields that must satisfy p50 <= p90
 */
const PERCENTILE_PAIRS: Array<[string, string]> = [
  ['transfer_time_p50', 'transfer_time_p90'],
  ['deplane_gate_p50', 'deplane_gate_p90'],
  ['deplane_remote_p50', 'deplane_remote_p90'],
  ['security_domestic_p50', 'security_domestic_p90'],
  ['security_international_p50', 'security_international_p90'],
];

/**
 * Validate the entire airports configuration
 */
export function validateAirportsConfig(config: any): ValidationResult {
  const errors: ValidationError[] = [];

  // Check if config is an object
  if (!config || typeof config !== 'object') {
    return {
      isValid: false,
      errors: [
        {
          type: 'airport',
          message: 'Configuração de aeroportos deve ser um objeto JSON válido',
        },
      ],
    };
  }

  // Check if airports array exists
  if (!Array.isArray(config.airports)) {
    return {
      isValid: false,
      errors: [
        {
          type: 'airport',
          message: 'Campo "airports" deve ser um array',
        },
      ],
    };
  }

  // Check if airports array is not empty
  if (config.airports.length === 0) {
    return {
      isValid: false,
      errors: [
        {
          type: 'airport',
          message: 'Array "airports" não pode estar vazio',
        },
      ],
    };
  }

  // Validate each airport
  config.airports.forEach((airport: any, index: number) => {
    const airportErrors = validateAirport(airport, index);
    errors.push(...airportErrors);
  });

  // Validate generic fallback if present
  if (config.generic_fallback) {
    const fallbackErrors = validateFallback(config.generic_fallback);
    errors.push(...fallbackErrors);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate a single airport object
 */
function validateAirport(airport: any, index: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  for (const field of REQUIRED_AIRPORT_FIELDS) {
    if (!(field in airport)) {
      errors.push({
        type: 'airport',
        airportCode: airport?.airport_code || `[Index ${index}]`,
        field,
        message: `Campo obrigatório "${field}" está faltando`,
      });
    }
  }

  // If airport_code is missing, we can't continue validation
  const airportCode = airport?.airport_code || `[Index ${index}]`;

  // Validate airport_code is a string
  if (airport.airport_code && typeof airport.airport_code !== 'string') {
    errors.push({
      type: 'airport',
      airportCode,
      field: 'airport_code',
      message: 'Campo "airport_code" deve ser uma string',
    });
  }

  // Validate airport_code is not empty
  if (airport.airport_code && airport.airport_code.trim() === '') {
    errors.push({
      type: 'airport',
      airportCode,
      field: 'airport_code',
      message: 'Campo "airport_code" não pode estar vazio',
    });
  }

  // Validate rules array exists and is not empty
  if (!Array.isArray(airport.rules)) {
    errors.push({
      type: 'airport',
      airportCode,
      field: 'rules',
      message: 'Campo "rules" deve ser um array',
    });
    return errors; // Can't validate rules if not an array
  }

  if (airport.rules.length === 0) {
    errors.push({
      type: 'airport',
      airportCode,
      field: 'rules',
      message: 'Array "rules" não pode estar vazio',
    });
    return errors;
  }

  // Validate each rule
  airport.rules.forEach((rule: any, ruleIndex: number) => {
    const ruleErrors = validateRule(rule, airportCode, ruleIndex);
    errors.push(...ruleErrors);
  });

  return errors;
}

/**
 * Validate a single transfer rule
 */
function validateRule(rule: any, airportCode: string, ruleIndex: number): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check required fields
  for (const field of REQUIRED_RULE_FIELDS) {
    if (!(field in rule)) {
      errors.push({
        type: 'rule',
        airportCode,
        ruleIndex,
        field,
        message: `Campo obrigatório "${field}" está faltando`,
      });
    }
  }

  // Validate numeric fields
  for (const field of REQUIRED_RULE_FIELDS) {
    if (field in rule) {
      const value = rule[field];

      // Check if numeric fields are numbers
      if (
        field.includes('_p50') ||
        field.includes('_p90') ||
        field.includes('transfer_time')
      ) {
        if (typeof value !== 'number') {
          errors.push({
            type: 'rule',
            airportCode,
            ruleIndex,
            field,
            message: `Campo "${field}" deve ser um número, recebido: ${typeof value}`,
          });
        } else if (value < 0) {
          errors.push({
            type: 'rule',
            airportCode,
            ruleIndex,
            field,
            message: `Campo "${field}" deve ser positivo (≥ 0), recebido: ${value}`,
          });
        }
      }
    }
  }

  // Validate p50 <= p90 relationships
  for (const [p50Field, p90Field] of PERCENTILE_PAIRS) {
    const p50Value = rule[p50Field];
    const p90Value = rule[p90Field];

    if (typeof p50Value === 'number' && typeof p90Value === 'number') {
      if (p50Value > p90Value) {
        errors.push({
          type: 'rule',
          airportCode,
          ruleIndex,
          field: p50Field,
          message: `${p50Field} (${p50Value}) deve ser ≤ ${p90Field} (${p90Value})`,
        });
      }
    }
  }

  // Validate terminal fields are strings
  if ('terminal_from' in rule && typeof rule.terminal_from !== 'string') {
    errors.push({
      type: 'rule',
      airportCode,
      ruleIndex,
      field: 'terminal_from',
      message: 'Campo "terminal_from" deve ser uma string',
    });
  }

  if ('terminal_to' in rule && typeof rule.terminal_to !== 'string') {
    errors.push({
      type: 'rule',
      airportCode,
      ruleIndex,
      field: 'terminal_to',
      message: 'Campo "terminal_to" deve ser uma string',
    });
  }

  // Validate transfer_mode
  const validModes = ['walk', 'bus', 'train'];
  if ('transfer_mode' in rule && !validModes.includes(rule.transfer_mode)) {
    errors.push({
      type: 'rule',
      airportCode,
      ruleIndex,
      field: 'transfer_mode',
      message: `Campo "transfer_mode" deve ser um de: ${validModes.join(', ')}, recebido: ${rule.transfer_mode}`,
    });
  }

  return errors;
}

/**
 * Validate generic fallback configuration
 */
function validateFallback(fallback: any): ValidationError[] {
  const errors: ValidationError[] = [];

  const requiredFallbackFields = [
    'deplane_gate_p50',
    'deplane_gate_p90',
    'deplane_remote_p50',
    'deplane_remote_p90',
    'transfer_p50',
    'transfer_p90',
    'security_domestic_p50',
    'security_domestic_p90',
    'security_international_p50',
    'security_international_p90',
  ];

  // Check required fields
  for (const field of requiredFallbackFields) {
    if (!(field in fallback)) {
      errors.push({
        type: 'field',
        field,
        message: `Campo obrigatório no fallback: "${field}" está faltando`,
      });
    }
  }

  // Validate numeric values
  for (const field of requiredFallbackFields) {
    if (field in fallback) {
      const value = fallback[field];

      if (typeof value !== 'number') {
        errors.push({
          type: 'field',
          field,
          message: `Campo fallback "${field}" deve ser um número, recebido: ${typeof value}`,
        });
      } else if (value < 0) {
        errors.push({
          type: 'field',
          field,
          message: `Campo fallback "${field}" deve ser positivo (≥ 0), recebido: ${value}`,
        });
      }
    }
  }

  // Validate p50 <= p90 for fallback
  const fallbackPairs: Array<[string, string]> = [
    ['deplane_gate_p50', 'deplane_gate_p90'],
    ['deplane_remote_p50', 'deplane_remote_p90'],
    ['transfer_p50', 'transfer_p90'],
    ['security_domestic_p50', 'security_domestic_p90'],
    ['security_international_p50', 'security_international_p90'],
  ];

  for (const [p50Field, p90Field] of fallbackPairs) {
    const p50Value = fallback[p50Field];
    const p90Value = fallback[p90Field];

    if (typeof p50Value === 'number' && typeof p90Value === 'number') {
      if (p50Value > p90Value) {
        errors.push({
          type: 'field',
          field: p50Field,
          message: `Fallback: ${p50Field} (${p50Value}) deve ser ≤ ${p90Field} (${p90Value})`,
        });
      }
    }
  }

  return errors;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  const lines: string[] = ['Erros de Validação na Configuração de Aeroportos:'];

  const groupedByAirport = new Map<string, ValidationError[]>();

  for (const error of errors) {
    const key = error.airportCode || 'GLOBAL';
    if (!groupedByAirport.has(key)) {
      groupedByAirport.set(key, []);
    }
    groupedByAirport.get(key)!.push(error);
  }

  groupedByAirport.forEach((airportErrors, airport) => {
    if (airport !== 'GLOBAL') {
      lines.push(`\n📍 Aeroporto: ${airport}`);
    }

    for (const error of airportErrors) {
      let prefix = '  ';
      if (error.type === 'rule' && error.ruleIndex !== undefined) {
        prefix += `[Regra ${error.ruleIndex}] `;
      }
      lines.push(`${prefix}❌ ${error.message}`);
    }
  });

  return lines.join('\n');
}
