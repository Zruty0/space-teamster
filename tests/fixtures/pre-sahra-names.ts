/** Approved Sahra display names and the two legacy Gaia research deliveries.
 * Original economic snapshots remain frozen; no numeric/seed edits allowed. */
export function preSahraNames(json: string): string {
  const value = JSON.parse(json);
  function restore(row: any): void {
    if (!row || typeof row !== 'object') return;
    if (row.factionId === 'gaia-civilian-bookings'
      && /^gaia:(research-instruments|precision-output):estella-ix-low-orbit-research-station:out$/.test(row.templateId ?? '')
      && row.destinationId === 'estella-ix-opposite-sense-supply-depot') {
      row.destinationId = 'estella-ix-low-orbit-research-station';
    }
    for (const item of Object.values(row)) restore(item);
  }
  restore(value);
  return JSON.stringify(value)
    .split('Suhail Anchorage').join('Estella IX Supply Depot')
    .split('Multaqa').join('Research Base')
    .split('Bir Safa').join('Ice Mine')
    .split('Wadi al-Layl').join('Geological Feature')
    .split('Raqib').join('Observation Outpost')
    .replace(/\bSahra\b/g, 'Estella IX');
}
