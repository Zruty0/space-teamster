import { preSahraNames } from './pre-sahra-names';
import { preBaratariaNames } from './pre-barataria-names';
import { preThuleNames } from './pre-thule-names';
/** Reviewed display names/retired receiving point only. Frozen baselines stay intact. */
export function preCampsNames(json: string): string {
  return preThuleNames(preBaratariaNames(preSahraNames(json))).split('Flint Mine').join('Pike Strip Mine')
    .split('Switchback').join('Pike Miner Hab')
    .split('Pike Depot').join('Pike Ore-Handling Depot')
    .split('EDF Farwatch Station').join('The Deepest Dock');
}
