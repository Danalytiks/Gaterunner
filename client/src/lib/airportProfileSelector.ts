/**
 * Airport Profile Selector
 * 
 * Loads generic airport profiles and automatically selects the best profile
 * based on connection characteristics.
 */

export type AirportProfileType = 'small' | 'medium' | 'hub';

export interface AirportProfile {
  name: string;
  description: string;
  deplane_gate_p50: number;
  deplane_gate_p90: number;
  deplane_remote_p50: number;
  deplane_remote_p90: number;
  transfer_same_terminal_p50: number;
  transfer_same_terminal_p90: number;
  transfer_different_terminal_p50: number;
  transfer_different_terminal_p90: number;
  security_domestic_p50: number;
  security_domestic_p90: number;
  security_international_p50: number;
  security_international_p90: number;
}

export interface AirportProfilesConfig {
  profiles: {
    small: AirportProfile;
    medium: AirportProfile;
    hub: AirportProfile;
  };
  penalties: {
    remote_stand_additional_p50: number;
    remote_stand_additional_p90: number;
    terminal_change_additional_p50: number;
    terminal_change_additional_p90: number;
  };
  defaults: {
    profile: AirportProfileType;
    description: string;
  };
}

class AirportProfileManager {
  private profiles: AirportProfilesConfig | null = null;
  private readonly PROFILES_URL = '/airport_profiles.json';

  /**
   * Load airport profiles configuration
   */
  async loadProfiles(): Promise<AirportProfilesConfig> {
    if (this.profiles) {
      return this.profiles;
    }

    try {
      console.log(`[AirportProfileSelector] Carregando perfis de aeroporto de ${this.PROFILES_URL}...`);
      const response = await fetch(this.PROFILES_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      this.profiles = data as AirportProfilesConfig;

      console.log('[AirportProfileSelector] Perfis carregados com sucesso');
      console.log(`[AirportProfileSelector] Categorias disponíveis: small, medium, hub`);

      return this.profiles;
    } catch (error) {
      console.error('[AirportProfileSelector] Erro ao carregar perfis:', error);
      throw error;
    }
  }

  /**
   * Select profile based on connection characteristics
   * 
   * Rules:
   * - Terminal change OR remote stand → medium/hub
   * - International flight → increase security times
   * - Otherwise default to small
   */
  async selectProfile(
    isTerminalChange: boolean,
    isRemoteStand: boolean,
    isInternational: boolean
  ): Promise<{ profile: AirportProfile; profileType: AirportProfileType; reason: string }> {
    const profiles = await this.loadProfiles();

    let selectedType: AirportProfileType;
    let reason: string;

    // Rule 1: Terminal change or remote stand → medium/hub
    if (isTerminalChange || isRemoteStand) {
      // Hub for international + terminal change/remote
      if (isInternational && isTerminalChange) {
        selectedType = 'hub';
        reason = 'Voo internacional com troca de terminal';
      } else if (isTerminalChange || isRemoteStand) {
        selectedType = 'medium';
        reason = isTerminalChange ? 'Troca de terminal' : 'Portao remoto';
      } else {
        selectedType = 'medium';
        reason = 'Configuracao complexa';
      }
    } else {
      // Default to small for simple connections
      selectedType = 'small';
      reason = 'Conexao simples (mesmo terminal, portao de embarque)';
    }

    const profile = profiles.profiles[selectedType];

    console.log(`[AirportProfileSelector] Perfil selecionado: ${selectedType} (${reason})`);

    return {
      profile,
      profileType: selectedType,
      reason,
    };
  }

  /**
   * Get profile by type
   */
  async getProfile(type: AirportProfileType): Promise<AirportProfile> {
    const profiles = await this.loadProfiles();
    return profiles.profiles[type];
  }

  /**
   * Get penalties configuration
   */
  async getPenalties() {
    const profiles = await this.loadProfiles();
    return profiles.penalties;
  }

  /**
   * Calculate transfer time with penalties
   */
  async calculateTransferTime(
    isTerminalChange: boolean,
    isRemoteStand: boolean,
    profileType: AirportProfileType
  ): Promise<{ p50: number; p90: number }> {
    const profiles = await this.loadProfiles();
    const profile = profiles.profiles[profileType];
    const penalties = profiles.penalties;

    // Base transfer time
    let transferp50 = isTerminalChange
      ? profile.transfer_different_terminal_p50
      : profile.transfer_same_terminal_p50;

    let transferp90 = isTerminalChange
      ? profile.transfer_different_terminal_p90
      : profile.transfer_same_terminal_p90;

    // Add terminal change penalty if applicable
    if (isTerminalChange) {
      transferp50 += penalties.terminal_change_additional_p50;
      transferp90 += penalties.terminal_change_additional_p90;
    }

    // Add remote stand penalty if applicable
    if (isRemoteStand) {
      transferp50 += penalties.remote_stand_additional_p50;
      transferp90 += penalties.remote_stand_additional_p90;
    }

    return { p50: transferp50, p90: transferp90 };
  }

  /**
   * Calculate deplane time based on gate type
   */
  async getDeplaneTimes(
    isRemoteStand: boolean,
    profileType: AirportProfileType
  ): Promise<{ p50: number; p90: number }> {
    const profile = await this.getProfile(profileType);

    if (isRemoteStand) {
      return {
        p50: profile.deplane_remote_p50,
        p90: profile.deplane_remote_p90,
      };
    }

    return {
      p50: profile.deplane_gate_p50,
      p90: profile.deplane_gate_p90,
    };
  }

  /**
   * Calculate security time based on flight type
   */
  async getSecurityTimes(
    isInternational: boolean,
    profileType: AirportProfileType
  ): Promise<{ p50: number; p90: number }> {
    const profile = await this.getProfile(profileType);

    if (isInternational) {
      return {
        p50: profile.security_international_p50,
        p90: profile.security_international_p90,
      };
    }

    return {
      p50: profile.security_domestic_p50,
      p90: profile.security_domestic_p90,
    };
  }
}

// Singleton instance
export const airportProfileManager = new AirportProfileManager();
