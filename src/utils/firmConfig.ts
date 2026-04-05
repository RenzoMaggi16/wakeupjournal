/**
 * Funding Firm Configuration
 * 
 * Strategy-pattern configuration for firm-specific profit thresholds.
 * Firms are categorized by market (futures/forex) for dynamic dropdown filtering.
 * To add a new firm, simply add an entry to FUNDING_FIRMS.
 */

export type FundingFirmId =
  | 'topstep'
  | 'apex'
  | 'alpha_futures'
  | 'ftmo'
  | 'fundednext'
  | 'the_5ers'
  | 'myfundedfx'
  | 'e8_funding';

export type FirmMarket = 'futures' | 'forex';

export interface FirmConfig {
  id: FundingFirmId;
  label: string;
  market: FirmMarket;
  /** Minimum net profit ($) for a day to count as a "Profit Day" */
  minProfitThreshold: number;
}

export const FUNDING_FIRMS: Record<FundingFirmId, FirmConfig> = {
  // ── Futures Firms ──
  topstep: {
    id: 'topstep',
    label: 'Topstep',
    market: 'futures',
    minProfitThreshold: 150,
  },
  apex: {
    id: 'apex',
    label: 'Apex Trader Funding',
    market: 'futures',
    minProfitThreshold: 50,
  },
  alpha_futures: {
    id: 'alpha_futures',
    label: 'Alpha Futures',
    market: 'futures',
    minProfitThreshold: 200,
  },
  // ── Forex Firms ──
  ftmo: {
    id: 'ftmo',
    label: 'FTMO',
    market: 'forex',
    minProfitThreshold: 0,
  },
  fundednext: {
    id: 'fundednext',
    label: 'FundedNext',
    market: 'forex',
    minProfitThreshold: 0,
  },
  the_5ers: {
    id: 'the_5ers',
    label: 'The 5%ers',
    market: 'forex',
    minProfitThreshold: 0,
  },
  myfundedfx: {
    id: 'myfundedfx',
    label: 'MyFundedFX',
    market: 'forex',
    minProfitThreshold: 0,
  },
  e8_funding: {
    id: 'e8_funding',
    label: 'E8 Funding',
    market: 'forex',
    minProfitThreshold: 0,
  },
};

/** Ordered list for dropdowns (all firms) */
export const FUNDING_FIRM_LIST: FirmConfig[] = Object.values(FUNDING_FIRMS);

/**
 * Returns firms filtered by market.
 * Use this for dynamic dropdown population based on selected asset_class.
 */
export function getFirmsByMarket(market: string): FirmConfig[] {
  if (market === 'futures') {
    return FUNDING_FIRM_LIST.filter(f => f.market === 'futures');
  }
  if (market === 'forex') {
    return FUNDING_FIRM_LIST.filter(f => f.market === 'forex');
  }
  return [];
}

/**
 * Returns true if a given market has a curated firm list.
 * Markets without firms (crypto, stocks, other) return false.
 */
export function marketHasFirms(market: string): boolean {
  return market === 'futures' || market === 'forex';
}

/** Default threshold for Personal accounts or accounts without a recognized firm */
export const DEFAULT_PROFIT_THRESHOLD = 0;

/**
 * Returns the minimum profit threshold for a given firm and account type.
 * - Evaluation accounts always return the default (consistency rule is disabled for them).
 * - Live accounts use the firm-specific threshold.
 * - Personal accounts use the default (> $0).
 */
export function getProfitThreshold(
  firmId: FundingFirmId | string | null | undefined,
  accountType: string
): number {
  // Evaluation accounts: consistency rule not enforced
  if (accountType === 'evaluation') return DEFAULT_PROFIT_THRESHOLD;

  // Live accounts with recognized firm
  if (firmId && firmId in FUNDING_FIRMS) {
    return FUNDING_FIRMS[firmId as FundingFirmId].minProfitThreshold;
  }

  // Personal or unrecognized firm
  return DEFAULT_PROFIT_THRESHOLD;
}

/**
 * Gets the display label for a funding firm ID.
 */
export function getFirmLabel(firmId: FundingFirmId | string | null | undefined): string {
  if (firmId && firmId in FUNDING_FIRMS) {
    return FUNDING_FIRMS[firmId as FundingFirmId].label;
  }
  return '';
}
