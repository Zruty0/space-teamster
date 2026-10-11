import { estimateEstellaMissionCost } from '../src/mission-cost';
import { generateEstellaMission, type EstellaTransferOption } from '../src/estella-mission';
import { ESTELLA_NODES_BY_ID } from '../src/content/estella';
import { bodyById } from '../src/world';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';

let assertions = 0;
function assert(value: unknown, message: string): asserts value { assertions++; if (!value) throw new Error(message); }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(a) === JSON.stringify(b), `${message}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`); }
const academy = 'estella-xi-science-waypoint-poi';
const campus = 'estella-xif-deep-listening-array';
const cargo = { label: 'Test cargo', massTons: 20 };
const outbound = estimateEstellaMissionCost(academy, campus, cargo);
const inbound = estimateEstellaMissionCost(campus, academy, cargo);
equal(generateEstellaMission(academy, campus, 0).transferOptions, [], 'parent-frame station to child uses local estimator');
equal(outbound.parDv, 383, 'Academy to Coimbra regression (formerly 8083)');
equal(inbound.parDv, 395, 'Coimbra to Academy regression (formerly 8095)');
equal(outbound.breakdown.map(row => row.dv), [15, 47, 55, 266], 'undock, direct parent transfer, child capture, landing');
equal(inbound.breakdown.map(row => row.dv), [275, 55, 47, 18], 'launch, child escape, direct parent rendezvous, docking');
assert(!outbound.breakdown.some(row => row.label === 'Orbit transfer to parking'), 'no Hydra parking detour outbound');
assert(!inbound.breakdown.some(row => row.label === 'Parent-frame capture to parking' || row.label === 'Orbit transfer to destination'), 'no Hydra parking detour inbound');

// Check the parent-frame burn against independently evaluated circular/transfer speeds.
const hydra = bodyById('estella-xi');
const academyPlacement = ESTELLA_NODES_BY_ID.get('estella-xi-captive-science-waypoint')!.placement!;
assert(academyPlacement.kind === 'orbit' && academyPlacement.orbit?.kind === 'circular', 'Academy circular orbit');
const r1 = academyPlacement.orbit.radius;
const r2 = bodyById('estella-xif').orbit!.radius;
const a = (r1 + r2) / 2;
const directBurn = Math.round(Math.abs(Math.sqrt(hydra.gm * (2 / r1 - 1 / a)) - Math.sqrt(hydra.gm / r1)) * 1.4);
equal(outbound.breakdown[1].dv, directBurn, 'parent burn uses actual 47000km Academy radius');

// Both inward and outward station/captive-to-moon transfers, plus child orbital berths.
for (const [parentLocation, childLocation] of [
  [academy, 'estella-xid-main-port'],
  ['estella-xi-smuggler-deaddrop-poi', campus],
  ['estella-xi-skim-hub', campus],
  ['estella-iii-main-customs', 'estella-iiia-main-port-transit'],
]) {
  const out = estimateEstellaMissionCost(parentLocation, childLocation, cargo);
  const back = estimateEstellaMissionCost(childLocation, parentLocation, cargo);
  assert(out.parDv > 0 && back.parDv > 0, 'positive direct-route estimates');
  assert(out.breakdown.some(row => row.label === 'Parent-frame transfer to child'), 'parent-to-child transfer counted');
  assert(back.breakdown.some(row => row.label === 'Parent-frame rendezvous with destination'), 'child-to-parent rendezvous counted');
  assert(!out.breakdown.some(row => row.label === 'Orbit transfer to parking'), 'actual parent orbit is departure orbit');
  assert(!back.breakdown.some(row => row.label === 'Parent-frame capture to parking' || row.label === 'Orbit transfer to destination'), 'actual parent destination orbit is arrival orbit');
}

// Surface endpoints still need the appropriate body's parking orbit and descent.
const gaiaSurface = 'estella-iii-capital-city';
const lunarSurface = 'estella-iiia-science-settlement';
const surfaceOut = estimateEstellaMissionCost(gaiaSurface, lunarSurface, cargo);
const surfaceBack = estimateEstellaMissionCost(lunarSurface, gaiaSurface, cargo);
assert(surfaceOut.breakdown[0].label.startsWith('Launch to parking orbit:'), 'parent surface launch remains');
assert(surfaceBack.breakdown.some(row => row.label === 'Parent-frame capture to parking'), 'parent surface arrival retains parking capture');
assert(surfaceOut.breakdown[surfaceOut.breakdown.length - 1].label.startsWith('Descent/landing:'), 'child surface landing remains');
assert(surfaceBack.breakdown[surfaceBack.breakdown.length - 1].label.startsWith('Descent/landing:'), 'parent surface landing remains');

let boardRows = 0;
for (let day = 0; day < 10; day++) {
  const rows = [...generateCareerContracts(academy, day * 86400), ...generatePassengerContracts(academy, day * 86400)];
  for (const row of rows.filter(row => row.destinationId === campus)) {
    equal(row.quote.parDv, 383, 'published board quote uses corrected route par');
    equal(row.quote.parFuelCost, Math.round(row.quote.parDv * row.quote.loadedMassTons * row.quote.fuelPricePerTonMps), 'published fuel cost follows par');
    boardRows++;
  }
}
assert(boardRows > 0, 'Academy to Campus contract exercised on board');
// Recorded Mirror Clinic -> Academy flight: old par 7201, actual 2385.
// Selected transfer operates in the stellar frame (Manticore -> Hydra).
const clinic = 'estella-xiid-mirror-clinic';
const latestTransfer: EstellaTransferOption = {
  id: 'best', label: 'Lowest ΔV', waitTime: 210529421.183533,
  transferTime: 16544605.043969039, departureVInf: 197.94307467783813,
  departureVInfAngle: 0, arrivalVInf: 163.72107397467835,
  totalDeltaV: 197.94307467783813 + 163.72107397467835,
  sourceBodyId: 'estella-xii', destinationBodyId: 'estella-xi',
};
const latest = estimateEstellaMissionCost(clinic, academy, { ...cargo, massTons: 23 }, latestTransfer);
const expectedCapture = Math.round((Math.sqrt(latestTransfer.arrivalVInf ** 2 + 2 * hydra.gm / r1) - Math.sqrt(hydra.gm / r1)) * 1.1);
equal(latest.breakdown.find(row => row.label === 'Capture to destination orbit')?.dv, expectedCapture, 'recorded arrival captures directly at Academy radius');
assert(!latest.breakdown.some(row => row.label === 'Capture to parking orbit' || row.label === 'Orbit transfer to destination'), 'no selected-transfer arrival detour');
equal(latest.breakdown.slice(0, 4).map(row => row.dv), [251, 46, 281, 11], 'recorded source escape and midcourse terms unchanged');

// Recorded Academy -> Mirror Clinic flight: old par 7478, actual 1615.
const earlierTransfer: EstellaTransferOption = {
  id: 'soon', label: 'Earliest <2x best', waitTime: 195983360.40891063,
  transferTime: 8425326.616515245, departureVInf: 263.46434401125015,
  departureVInfAngle: 0, arrivalVInf: 131.98154497392494,
  totalDeltaV: 263.46434401125015 + 131.98154497392494,
  sourceBodyId: 'estella-xi', destinationBodyId: 'estella-xii',
};
const earlier = estimateEstellaMissionCost(academy, clinic, { ...cargo, massTons: 8 }, earlierTransfer);
const expectedEscape = Math.round((Math.sqrt(earlierTransfer.departureVInf ** 2 + 2 * hydra.gm / r1) - Math.sqrt(hydra.gm / r1)) * 1.1);
equal(earlier.breakdown.find(row => row.label === 'Escape from departure orbit')?.dv, expectedEscape, 'recorded departure escapes directly from Academy radius');
assert(!earlier.breakdown.some(row => row.label === 'Orbit transfer to parking' || row.label === 'Escape from parking orbit'), 'no selected-transfer departure detour');
equal(earlier.breakdown.slice(-3).map(row => row.dv), [84, 527, 243], 'existing giant-child arrival model unchanged');
console.log(JSON.stringify({ outboundPar: outbound.parDv, outbound: outbound.breakdown, returnPar: inbound.parDv, latestClinicToAcademy: latest, earlierAcademyToClinic: earlier, boardRows, assertions }, null, 2));
