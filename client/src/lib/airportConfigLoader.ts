/**
 * Airport Configuration Loader (Enhanced with Caching)
 * 
 * Dynamically loads airport rules from configuration file with:
 * - In-memory caching for fast access
 * - localStorage persistence across sessions
 * - Version-based cache invalidation
 * - Automatic retry on network failures
 * - Performance monitoring
 */

import { cacheManager } from './cacheManager';
import { validateAirportsConfig, formatValidationErrors, type ValidationResult } from './airportConfigValidator';

export interface AirportTransferRule {
  terminal_from: string;
  terminal_to: string;
  transfer_mode: 'walk' | 'bus' | 'train';
  transfer_time_p50: number;
  transfer_time_p90: number;
  deplane_gate_p50: number;
  deplane_gate_p90: number;
  deplane_remote_p50: number;
  deplane_remote_p90: number;
  security_domestic_p50: number;
  security_domestic_p90: number;
  security_international_p50: number;
  security_international_p90: number;
}

export interface AirportConfig {
  airport_code: string;
  airport_name: string;
  country: string;
  rules: AirportTransferRule[];
}

export interface GenericFallback {
  deplane_gate_p50: number;
  deplane_gate_p90: number;
  deplane_remote_p50: number;
  deplane_remote_p90: number;
  transfer_p50: number;
  transfer_p90: number;
  security_domestic_p50: number;
  security_domestic_p90: number;
  security_international_p50: number;
  security_international_p90: number;
}

export interface AirportConfigFile {
  airports: AirportConfig[];
  generic_fallback: GenericFallback;
  version?: string; // Version for cache invalidation
}

export interface LoaderStats {
  totalLoads: number;
  cacheHits: number;
  cacheMisses: number;
  networkRequests: number;
  averageLoadTime: number;
  lastLoadTime?: number;
}

class AirportConfigManager {
  private config: AirportConfigFile | null = null;
  private loadingPromise: Promise<AirportConfigFile> | null = null;
  private validationResult: ValidationResult | null = null;
  private stats: LoaderStats = {
    totalLoads: 0,
    cacheHits: 0,
    cacheMisses: 0,
    networkRequests: 0,
    averageLoadTime: 0,
  };
  private readonly CACHE_KEY = 'airports_config';
  private readonly CONFIG_URL = '/airports-config.json';
  private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
  private readonly RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  /**
   * Force refresh configuration from network, bypassing all caches
   */
  async forceRefresh(): Promise<AirportConfigFile> {
    console.log('[AirportConfigLoader] Forcando recarregamento da configuracao...');
    this.config = null;
    this.loadingPromise = null;
    cacheManager.clear(this.CACHE_KEY);
    return this.loadConfig();
  }

  /**
   * Load airport configuration with caching
   */
  async loadConfig(): Promise<AirportConfigFile> {
    // Return cached config if already loaded
    if (this.config) {
      this.stats.cacheHits++;
      console.log(`[AirportConfigLoader] Usando config em cache: ${this.config.airports.length} aeroportos`);
      return this.config;
    }

    // Return existing loading promise if already in progress
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading
    console.log(`[AirportConfigLoader] Iniciando carregamento de ${this.CONFIG_URL}...`);
    this.loadingPromise = this.fetchConfigWithCache();
    this.config = await this.loadingPromise;
    console.log(`[AirportConfigLoader] Configuracao carregada com sucesso: ${this.config.airports.length} aeroportos`);
    const codes = this.config.airports.map(a => a.airport_code).join(', ');
    console.log(`[AirportConfigLoader] Codigos de aeroporto: ${codes}`);
    return this.config;
  }

  /**
   * Fetch configuration with cache support
   */
  private async fetchConfigWithCache(): Promise<AirportConfigFile> {
    const startTime = performance.now();
    this.stats.totalLoads++;

    try {
      // Try to get from cache first
      const cachedConfig = cacheManager.get<AirportConfigFile>(this.CACHE_KEY);
      if (cachedConfig) {
        this.stats.cacheHits++;
        const loadTime = performance.now() - startTime;
        this.updateLoadTime(loadTime);
        console.log(`[Cache] Loaded airports config from cache in ${loadTime.toFixed(2)}ms`);
        return cachedConfig;
      }

      this.stats.cacheMisses++;

      // Fetch from network with retry
      console.log(`[AirportConfigLoader] Buscando configuracao de: ${this.CONFIG_URL}`);
      const config = await this.fetchWithRetry(this.CONFIG_URL, this.RETRY_ATTEMPTS);
      this.stats.networkRequests++;
      console.log(`[AirportConfigLoader] Arquivo carregado com ${config.airports.length} aeroportos`);

      // Generate version if not present
      if (!config.version) {
        config.version = this.generateVersion();
      }

      // Cache the config
      cacheManager.set(this.CACHE_KEY, config, config.version, this.CACHE_TTL);

      const loadTime = performance.now() - startTime;
      this.updateLoadTime(loadTime);
      console.log(
        `[Network] Loaded airports config from network in ${loadTime.toFixed(2)}ms (v${config.version})`
      );

      return config;
    } catch (error) {
      console.error('Error loading airport configuration:', error);
      throw error;
    }
  }

  /**
   * Fetch with retry logic
   */
  private async fetchWithRetry(url: string, attempts: number): Promise<AirportConfigFile> {
    let lastError: Error | null = null;

    for (let i = 0; i < attempts; i++) {
      try {
        const response = await fetch(url, {
          cache: 'no-cache', // Bypass browser cache to get fresh data
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`[AirportConfigLoader] JSON parseado: ${data.airports?.length || 0} aeroportos encontrados`);
        
        // Validate configuration
        const validation = validateAirportsConfig(data);
        this.validationResult = validation;
        if (!validation.isValid) {
          const errorMessage = formatValidationErrors(validation.errors);
          console.error(errorMessage);
          throw new Error(`Configuração de aeroportos inválida: ${validation.errors.length} erro(s)`);
        }
        
        console.log(`[AirportConfigLoader] Validacao passou: config pronta para uso`);
        return data as AirportConfigFile;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Fetch attempt ${i + 1}/${attempts} failed:`, lastError.message);

        // Wait before retrying (except on last attempt)
        if (i < attempts - 1) {
          await this.delay(this.RETRY_DELAY * (i + 1)); // Exponential backoff
        }
      }
    }

    throw new Error(`Failed to fetch config after ${attempts} attempts: ${lastError?.message}`);
  }

  /**
   * Force refresh configuration from network
   */
  async refreshConfig(): Promise<AirportConfigFile> {
    console.log('[Cache] Forcing refresh of airports config...');
    this.config = null;
    this.loadingPromise = null;
    cacheManager.clear(this.CACHE_KEY);
    return this.loadConfig();
  }

  /**
   * Check for config updates (version-based)
   */
  async checkForUpdates(): Promise<boolean> {
    try {
      const response = await fetch(this.CONFIG_URL, { cache: 'no-cache' });
      if (!response.ok) return false;

      const newConfig = (await response.json()) as AirportConfigFile;
      const currentVersion = this.config?.version || '';
      const newVersion = newConfig.version || this.generateVersion();

      if (currentVersion !== newVersion) {
        console.log(`[Cache] Config update detected: ${currentVersion} -> ${newVersion}`);
        await this.refreshConfig();
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for updates:', error);
      return false;
    }
  }

  /**
   * Get all available airports
   */
  async getAirports(): Promise<AirportConfig[]> {
    const config = await this.loadConfig();
    return config.airports;
  }

  /**
   * Get airport by code
   */
  async getAirport(code: string): Promise<AirportConfig | null> {
    const config = await this.loadConfig();
    return config.airports.find((a) => a.airport_code === code) || null;
  }

  /**
   * Get all airport codes
   */
  async getAirportCodes(): Promise<string[]> {
    const config = await this.loadConfig();
    return config.airports.map((a) => a.airport_code).sort();
  }

  /**
   * Get terminals for an airport
   */
  async getTerminals(airportCode: string): Promise<string[]> {
    const airport = await this.getAirport(airportCode);
    if (!airport) return [];

    const terminals = new Set<string>();
    airport.rules.forEach((rule) => {
      terminals.add(rule.terminal_from);
      terminals.add(rule.terminal_to);
    });

    return Array.from(terminals).sort();
  }

  /**
   * Get transfer rule between two terminals
   */
  async getTransferRule(
    airportCode: string,
    terminalFrom: string,
    terminalTo: string
  ): Promise<AirportTransferRule | null> {
    const airport = await this.getAirport(airportCode);
    if (!airport) return null;

    return (
      airport.rules.find(
        (rule) =>
          rule.terminal_from === terminalFrom && rule.terminal_to === terminalTo
      ) || null
    );
  }

  /**
   * Get generic fallback timings (for unknown airports)
   */
  async getFallbackTimings(): Promise<GenericFallback> {
    const config = await this.loadConfig();
    return config.generic_fallback;
  }

  /**
   * Check if airport exists
   */
  async airportExists(code: string): Promise<boolean> {
    const airport = await this.getAirport(code);
    return airport !== null;
  }

  /**
   * Get loader statistics
   */
  getStats(): LoaderStats {
    return { ...this.stats };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.config = null;
    this.loadingPromise = null;
    cacheManager.clear(this.CACHE_KEY);
    console.log('[Cache] Cleared airports config cache');
  }

  /**
   * Print statistics to console
   */
  printStats(): void {
    console.group('Airport Config Loader Statistics');
    console.log('Total Loads:', this.stats.totalLoads);
    console.log('Cache Hits:', this.stats.cacheHits);
    console.log('Cache Misses:', this.stats.cacheMisses);
    console.log('Network Requests:', this.stats.networkRequests);
    console.log('Average Load Time:', `${this.stats.averageLoadTime.toFixed(2)}ms`);
    if (this.stats.lastLoadTime) {
      console.log('Last Load Time:', `${this.stats.lastLoadTime.toFixed(2)}ms`);
    }
    console.log('Hit Rate:', `${this.getHitRate().toFixed(1)}%`);
    cacheManager.printStats();
    console.groupEnd();
  }

  /**
   * Get cache hit rate
   */
  getHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    return total === 0 ? 0 : (this.stats.cacheHits / total) * 100;
  }

  /**
   * Get validation result from last load
   */
  getValidationResult(): ValidationResult | null {
    return this.validationResult;
  }

  /**
   * Check if configuration is valid
   */
  isConfigValid(): boolean {
    return this.validationResult?.isValid ?? false;
  }

  /**
   * Get validation errors if any
   */
  getValidationErrors(): string | null {
    if (!this.validationResult || this.validationResult.isValid) {
      return null;
    }
    return formatValidationErrors(this.validationResult.errors);
  }

  /**
   * Update load time statistics
   */
  private updateLoadTime(loadTime: number): void {
    const total = this.stats.totalLoads;
    this.stats.averageLoadTime =
      (this.stats.averageLoadTime * (total - 1) + loadTime) / total;
    this.stats.lastLoadTime = loadTime;
  }

  /**
   * Generate version hash
   */
  private generateVersion(): string {
    return `v${Date.now()}`;
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const airportConfigManager = new AirportConfigManager();
