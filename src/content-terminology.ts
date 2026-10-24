/** Player-facing terminology only. Never apply to IDs, routing/dispatch keys,
 * seeded cargo pools, quotes or saved records. Legacy manifests remain valid. */
export function publicContentText(text: string): string {
  return text
    .replace(/\bRidgeback Mine\b/g, 'Flint Mine')
    .replace(/\bassay yards\b/g, 'assay works')
    .replace(/\bcargo yards\b/g, 'cargo depots')
    .replace(/\bconstruction yards\b/g, 'construction works')
    .replace(/\bequipment yard\b/g, 'equipment depot')
    .replace(/\b[Yy]ard tractors\b/g, match => match[0] === 'Y' ? 'Cargo tractors' : 'cargo tractors')
    .replace(/\btilt-yard\b/g, 'tilting-ground')
    .replace(/\byardhands\b/g, 'dockhands')
    .replace(/\b(Yards|yards|Yard|yard)\b/g, word => ({
      Yards: 'Shipyards', yards: 'shipyards', Yard: 'Shipyard', yard: 'shipyard',
    })[word]!);
}
