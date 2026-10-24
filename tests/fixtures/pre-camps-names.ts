/** Camps review-pass renames only. Original frozen baselines stay intact. */
export function preCampsNames(json: string): string {
  return json.split('Flint Mine').join('Pike Strip Mine')
    .split('Switchback').join('Pike Miner Hab')
    .split('Pike Depot').join('Pike Ore-Handling Depot');
}
