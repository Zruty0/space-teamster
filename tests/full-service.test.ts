import { Game } from '../src/game';
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { MAINTENANCE_SHOPS, diagnosisQuote, rigServiceQuote, replacementQuote, repairQuote, diagnoseRigAtShop, stockedComponentGrades, type MaintenanceShopDef } from '../src/maintenance/shops';
import { FULL_SERVICE_COPY } from '../src/maintenance/full-service-copy';
import { MAINTENANCE_COMPONENTS, componentFaults } from '../src/maintenance/catalog';
import { createDefaultRigState, validateRigState } from '../src/maintenance/rig-state';
import { equipmentQuote, purchaseEquipment } from '../src/maintenance/equipment';
import { maintenanceReferrals, maintenanceReferralText } from '../src/maintenance/referrals';
import { LOCAL_DIRECTORY_ENTRIES } from '../src/local-directory';
import { physicalTerminalId } from '../src/physical-terminals';
import { canTravelEmpty } from '../src/empty-runs';
import roster from '../design-docs/maintenance-stage-1-roster.json';
import baseline from './fixtures/maintenance-stage-3-shops.json';
let checks = 0;
function assert(v: unknown, message: string): asserts v { checks++; if (!v) throw Error(message); }
function canonical(value: any): any { return Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(k => [k, canonical(value[k])])) : value; }
function equal(a: unknown, b: unknown, message: string) { assert(JSON.stringify(canonical(a)) === JSON.stringify(canonical(b)), message); }
function close(a: number, b: number, message: string) { assert(Math.abs(a - b) < 1e-7, message); }
function profile(shop: MaintenanceShopDef) { return { ...defaultCareerProfile(), locationId: shop.locationIds[0], money: 1000000, certifications: [...TEAMSTER_CERTIFICATION_IDS], rig: createDefaultRigState(true) }; }
const updateIds = new Set(roster.filter(r => r.tier === 2 && r.physicalId !== 'estella-viii-friendly-station').map(r => r.physicalId));
const cadizId = 'vilar-cadiz-highport-outfitter';
equal([...Object.keys(FULL_SERVICE_COPY), 'estella-xid-main-port-station'].sort(), [...updateIds].sort(), 'exact authorized upgrade list');
assert(updateIds.size === 25 && baseline.shops.length === 159 && baseline.baseline === '4008a88', 'independent pre-edit snapshot');
let unchanged = 0, changed = 0;
for (const old of baseline.shops) {
  const shop = MAINTENANCE_SHOPS.find(s => s.id === old.shop.id)!;
  assert(shop, 'every account survives');
  const dir = LOCAL_DIRECTORY_ENTRIES.find(d => d.maintenanceShopId === shop.id)!;
  equal([shop.id, shop.name, shop.organizationName, shop.locationIds, dir.id, dir.name, dir.locationIds], [old.shop.id, old.shop.name, old.shop.organizationName, old.shop.locationIds, old.directory!.id, old.directory!.name, old.directory!.locationIds], 'account, names and receiving membership unchanged');
  const rig = createDefaultRigState(true); for (const s of Object.values(rig.components)) s.ap = 0;
  const drive = createDefaultRigState(true); drive.components['powertrain-main-drive-core'].fault = { severity: 'total', diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
  const refs = maintenanceReferrals(shop);
  if (old.physicalId === 'estella-iii-high-tech-city' || old.physicalId === 'estella-via-drydock') {
    assert(shop.facilityTier === 3 && refs.length === 0, 'explicit Stage 5 promotions checked separately against pre-Stage-5 fixture');
    continue;
  }
  equal(refs.map(({ physicalId, entranceId, name, location, path, eliteAlternative, onsiteSpecialist }) => ({ physicalId, entranceId, name, location, path, eliteAlternative, onsiteSpecialist })), old.referrals.map(({ physicalId, entranceId, name, location, path, eliteAlternative, onsiteSpecialist }) => ({ physicalId, entranceId, name, location, path, eliteAlternative, onsiteSpecialist })), 'all referral destinations/access unchanged');
  if (!updateIds.has(old.physicalId)) {
    unchanged++;
    equal(shop, old.shop, 'entire unaffected shop definition unchanged');
    equal(dir, old.directory, 'entire unaffected directory unchanged');
    equal(refs.map(r => ({ ...r, text: maintenanceReferralText(r) })), old.referrals, 'entire unaffected referral unchanged');
    equal([diagnosisQuote(shop), rigServiceQuote(rig, shop), replacementQuote(drive, shop, 'powertrain-main-drive-core') ?? null], [old.diagnosis, old.service, old.replacement], 'unaffected exact commercial quotes');
    equal(Object.fromEntries((shop.equipmentIds ?? []).map(id => [id, equipmentQuote(id === 'heavy-heat-shielding' ? createDefaultRigState(true) : createDefaultRigState(false), shop, id, 'D')])), old.equipment, 'unaffected exact equipment quotes');
  } else {
    changed++;
    assert(shop.facilityTier === 2 && shop.diagnosticGrade === 'B' && shop.workQualityGrade === 'B' && shop.honesty === 1, 'real full-service capability');
    assert(refs.length === 1 && !!shop.copy.referralBlurb, 'one bespoke elite referral');
    assert(!/\[person\]|\{name\}/.test(maintenanceReferralText(refs[0])), 'referral renders without raw markup or substitutions');
    const cadiz = shop.id === cadizId;
    equal([diagnosisQuote(shop).credits, diagnosisQuote(shop).laborHours, rigServiceQuote(rig, shop).credits, rigServiceQuote(rig, shop).laborHours, replacementQuote(drive, shop, 'powertrain-main-drive-core')!.credits], cadiz ? [1200, 2, 12000, 20, 310800] : [1440, 1.8, 14400, 18, 312960], 'independent full-service quote examples');
    equal(stockedComponentGrades(shop), cadiz ? ['C', 'D'] : ['B', 'C', 'D'], 'no premature A stock, Cadiz retains C-D');
    if (cadiz) {
      const { referralBlurb, ...copy } = shop.copy;
      equal(copy, old.shop.copy, 'Cadiz five existing prose fields unchanged');
      equal(dir, old.directory, 'Cadiz directory unchanged');
      equal({ ...shop, copy }, { ...old.shop, facilityTier: 2, workQualityGrade: 'B' }, 'Cadiz only metadata/work capability changed');
      equal([diagnosisQuote(shop), rigServiceQuote(rig, shop), replacementQuote(drive, shop, 'powertrain-main-drive-core')], [old.diagnosis, old.service, old.replacement], 'Cadiz exact sample prices/time unchanged');
    }
  }
}
equal([unchanged, changed], [132, 25], 'Stage 4 change boundary excluding the two separately audited Stage 5 promotions');
const upgraded = MAINTENANCE_SHOPS.filter(s => updateIds.has(physicalTerminalId(s.locationIds[0])));
let writes = 0, failWrites = false;
Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: { getItem: () => null, setItem: () => { if (failWrites) throw Error('blocked'); writes++; } } });
for (const shop of upgraded) {
  let p = profile(shop);
  p = purchaseEquipment(p, shop, 'cargo-shock-absorbers', 'D')!;
  p = purchaseEquipment(p, shop, 'passenger-comfort-package', 'D')!;
  equal(validateRigState(p.rig), [], 'valid fully equipped test rig');
  assert(Object.values(p.rig.components).every(s => s.installed), 'all component fault libraries exercised');
  let pairs = 0, repairable = 0; const unique = new Set<string>(), supported = new Set<string>();
  for (const c of MAINTENANCE_COMPONENTS) for (const f of componentFaults(c)) {
    pairs++; unique.add(f.id);
    const rig = structuredClone(p.rig), state = rig.components[c.id];
    state.hp = f.severity === 'minor' ? c.minorThreshold : 1;
    state.fault = { severity: f.severity, faultId: f.id, diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
    diagnoseRigAtShop(rig, shop);
    const available = !!repairQuote(rig, shop, c.id);
    equal(available, f.workGrade !== 'A', 'every non-A repair available');
    if (available) { repairable++; supported.add(f.id); }
    else { state.fault.diagnosis = 'confirmed'; assert(!repairQuote(rig, shop, c.id), 'external diagnosis does not grant A repair capability'); }
    assert(replacementQuote(rig, shop, c.id), 'unknown/highest-complexity assembly still replaceable');
  }
  equal([pairs, repairable, unique.size, supported.size], [520, 513, 320, 314], 'complete catalog capability counts');
  for (const id of shop.equipmentIds!) {
    const rig = id === 'heavy-heat-shielding' ? createDefaultRigState(true) : createDefaultRigState(false);
    for (const grade of stockedComponentGrades(shop)) assert(equipmentQuote(rig, shop, id, grade), 'all stocked equipment choices available');
    if (id !== 'heavy-heat-shielding') assert(!equipmentQuote(rig, shop, id, 'A'), 'A equipment still elite');
  }
  const game: any = Object.create(Game.prototype);
  game.career = profile(shop); game.worldTime = 0; game.showGuidance = () => {};
  for (const key of Object.keys(game.career.rig.components)) game.career.rig.components[key].ap = 0;
  game.career.maintenanceShopInspections.other = { diagnosedWorldTime: 0, creditRemaining: 77, dishonestyRevision: 2, fabricatedFaults: [], fabricatedServiceComponentIds: [], pretendMaintainedComponentIds: [] };
  game.phase = { kind: 'interactiveScene', scene: { id: 'maintenanceShop', maintenanceShopId: shop.id, selectedIndex: 0 } };
  const action = (value: string) => game.activateInteractiveSceneOption({}, value);
  const original = JSON.stringify(game.career), beforeWrites = writes;
  failWrites = true; action(`maintenanceDiagnose:${shop.id}`);
  equal([JSON.stringify(game.career), writes, game.worldTime], [original, beforeWrites, 0], 'failed inspection does not publish state');
  failWrites = false;
  const dq = diagnosisQuote(shop), sq = rigServiceQuote(game.career.rig, shop);
  action(`maintenanceDiagnose:${shop.id}`); action(`maintenanceServiceAll:${shop.id}`);
  equal([game.career.money, writes - beforeWrites, game.career.maintenanceShopInspections[shop.id].creditRemaining, game.career.maintenanceShopInspections.other.creditRemaining], [1000000 - sq.credits, 2, 0, 77], 'actual full-service payment and isolated one-use credit');
  close(game.career.worldTime, (dq.laborHours + sq.laborHours) * 3600, 'actual inspection and service time');
  const c = MAINTENANCE_COMPONENTS.find(c => componentFaults(c).some(f => f.workGrade === 'B'))!;
  const f = componentFaults(c).find(f => f.workGrade === 'B')!;
  game.career = profile(shop); game.worldTime = 0;
  game.career.rig.components[c.id].hp = f.severity === 'minor' ? c.minorThreshold : 1;
  game.career.rig.components[c.id].fault = { severity: f.severity, faultId: f.id, diagnosis: 'unknown', generatedMission: 0, generatedStrike: 0 };
  action(`maintenanceDiagnose:${shop.id}`);
  const quote = repairQuote(game.career.rig, shop, c.id)!;
  assert(quote, 'B repair is actually quoted');
  const money = game.career.money, time = game.career.worldTime;
  action(`maintenanceWork:${shop.id}:${c.id}:repair`);
  assert(!game.career.rig.components[c.id].fault, 'actual B repair clears fault');
  equal(game.career.money, money - Math.max(0, quote.credits - dq.credits), 'actual B repair applies local credit');
  close(game.career.worldTime, time + quote.laborHours * 3600, 'actual B repair time');
  if (physicalTerminalId(shop.locationIds[0]) === 'estella-vi-industrial-city') assert(!canTravelEmpty({ ...profile(shop), locationId: 'caravanserai-main-commercial-dock' }, shop.locationIds[0]), 'Perun service does not grant arrival');
}
assert(MAINTENANCE_SHOPS.filter(s => s.facilityTier === 3).length === 4, 'four final elites');
console.log(`Full-service Stage 4: ${checks} checks; 25 upgrades, 132 exact unaffected shops plus two separately audited Stage 5 promotions; 314/320 unique repairs and 513/520 fault pairs at every upgraded branch.`);
