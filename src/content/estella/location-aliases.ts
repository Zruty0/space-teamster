// Historical POI IDs retained for old contracts, logs and district services.
// New travel/boards use one physical destination for the consolidated city.
export const ESTELLA_LOCATION_ALIASES: Readonly<Record<string, string>> = {
  'estella-iii-finance-city': 'estella-iii-capital-city',
  'estella-iii-historic-site': 'estella-iii-capital-city',
};

// Retired destinations are save/accepted-flight compatibility only, not city
// districts or raw provider scopes. Never advertise them as new destinations.
const RETIRED_LOCATIONS: Readonly<Record<string, string>> = {
  'estella-iii-military-spaceport': 'estella-iii-capital-city',
};

export function canonicalEstellaLocationId(id: string): string {
  if (Object.prototype.hasOwnProperty.call(ESTELLA_LOCATION_ALIASES, id)) return ESTELLA_LOCATION_ALIASES[id];
  return Object.prototype.hasOwnProperty.call(RETIRED_LOCATIONS, id) ? RETIRED_LOCATIONS[id] : id;
}

export function estellaLocationScopeIds(id: string): string[] {
  const canonical = canonicalEstellaLocationId(id);
  return [canonical, ...Object.keys(ESTELLA_LOCATION_ALIASES).filter(alias => ESTELLA_LOCATION_ALIASES[alias] === canonical)];
}
