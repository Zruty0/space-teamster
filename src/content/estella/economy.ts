export interface EconomyOverride {
  tags?: string[];
  produces?: string[];
  consumes?: string[];
  services?: string[];
}

/**
 * Editable economic metadata by stable node id.
 *
 * Existing node economyTags are the current content inventory. Add overrides here when the
 * economy becomes more detailed than simple tags.
 */
export const ESTELLA_ECONOMY: Partial<Record<string, EconomyOverride>> = {};
