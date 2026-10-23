import { cargoMassForClass, type CargoMassClass } from '../../../mission-cost';
import type { FactionContractCandidate, FactionContractContext, FactionContractProvider } from './index';

import { dahaiTradeContracts } from './dahai-trade-contracts';
import { DAHAI_GOVERNMENT_LANES, DAHAI_EDF_LANES } from './dahai-partner-lanes';
import { campsTradeContracts } from './camps-trade-contracts';
import { CAMPS_GOVERNMENT_LANES } from './camps-partner-lanes';

export const GAIA_CIVILIAN_ID = 'gaia-civilian-bookings';
export const GOVERNMENT_ID = 'estella-government';
export const EDF_ID = 'estella-defence-force';
const ORSELLE = 'estella-iii-capital-city';
const ROCHEFORT = 'estella-iii-high-tech-city';
const VALENNE = 'estella-iii-agricultural-region';
const MIRABEL = 'estella-iii-coastal-resort';
const COUSTEAU = 'estella-iii-polar-science';
const BEAUMONT = 'estella-iiia-heritage-site';
const AMPERE = 'estella-iiia-helium-mining';
const DESCARTES = 'estella-iiia-science-settlement';
const DAHAI = 'estella-iv-primary-city';
const OCEAN = 'estella-iv-climate-poi-1';
const MARICULTURE = 'estella-iv-climate-poi-2';
const PELAGIC = 'estella-iv-climate-poi-3';
const CONCORD = 'estella-v-capital-settlement';
const ROADSTEAD = 'estella-v-transit-customs';
const CINDERHOOK = 'estella-v-atmo-refinery';
const HAMMER = 'estella-vi-heavy-cargo-station';
const ANVIL = 'estella-vi-main-transit-dispatch';
const VELES = 'estella-via-component-supply-station';
const SVAROG = 'estella-via-drydock-station';
const KALYNA = 'estella-vib-cold-chain-station';
const MOSAIC = 'estella-vii-high-vacuum-factory';
const ROSTER = 'estella-vii-worker-hab';
const COMMERCIAL = 'caravanserai-main-commercial-dock';
const HIGHLINER = 'caravanserai-highliner-bay-poi';
const CUSTOMS = 'caravanserai-customs-inspection';
const WEYMARK = 'estella-viii-settlement';
const RESEARCH = 'estella-ix-research-base';
const OBSERVATORY = 'estella-ix-low-orbit-research-station';
const CADIZ = 'estella-xid-main-port';
const SERRATINE = 'estella-xc-main-outpost';
const OLYMPOS = 'estella-ii-olympos';
const CAMPUS = 'estella-xif-deep-listening-array';
const CALATRAVA = 'estella-xd-proving-grounds';
const ACADEMY = 'estella-xie-oathmark-academy';

interface Lane {
  id: string;
  site: string;
  externalIds: readonly string[];
  direction: 'in' | 'out' | 'both';
  label: string;
  massClass: CargoMassClass;
  category: 'freight' | 'passenger';
  issuer: string;
  purpose: string;
}
const freight = (id: string, site: string, direction: 'in' | 'out', externalIds: readonly string[], label: string, massClass: CargoMassClass, issuer: string, purpose: string): Lane =>
  ({ id, site, direction, externalIds, label, massClass, category: 'freight', issuer, purpose });
const passengers = (id: string, site: string, externalIds: readonly string[], label: string, issuer: string, purpose: string): Lane =>
  ({ id, site, externalIds, direction: 'both', label, massClass: 'light', category: 'passenger', issuer, purpose });

// Descriptive issuers represent many independent bookings, NOT newly invented
// named corporations. Explicit economic lanes; never generic all-to-all filler.
const CIVILIAN_LANES: readonly Lane[] = [
  freight('medical-exports', ORSELLE, 'out', [BEAUMONT, DAHAI, CONCORD, WEYMARK, CADIZ, ROSTER], 'medical clinic lockers', 'light', 'Medical equipment supplier', 'Finished civilian clinic equipment.'),
  freight('research-instruments', ORSELLE, 'out', [DESCARTES, PELAGIC, RESEARCH, OBSERVATORY], 'survey instrument crates', 'light', 'Scientific instrument manufacturer', 'Laboratory and field instruments.'),
  freight('medical-inputs', ORSELLE, 'in', [KALYNA, HIGHLINER], 'pharmaceutical horticulture crates', 'light', 'Medical supply cooperative', 'Specialist pharmaceutical inputs.'),
  freight('research-inputs', ORSELLE, 'in', [MOSAIC, CAMPUS, AMPERE], 'sensor interface assemblies', 'light', 'University purchasing office', 'Research and diagnostic instrumentation.'),
  freight('research-samples', ORSELLE, 'in', [DESCARTES, RESEARCH, PELAGIC], 'sealed assay cores', 'light', 'University laboratory', 'Physical specimens for laboratory analysis.'),
  freight('specialty-alloys', ROCHEFORT, 'in', [HAMMER, VELES, ROADSTEAD], 'precision alloy billets', 'dense', 'Manufacturing purchasing cooperative', 'Certified metal stock for civilian machinery.'),
  freight('manufacturing-inputs', ROCHEFORT, 'in', [MOSAIC, AMPERE, HIGHLINER], 'high-purity ceramic packages', 'light', 'Precision component manufacturer', 'Specialized fabrication inputs.'),
  freight('marine-equipment', ROCHEFORT, 'out', [DAHAI, MARICULTURE, OCEAN], 'floating-habitat infrastructure kits', 'heavy', 'Marine infrastructure manufacturer', 'Habitat and marine civil-engineering infrastructure.'),
  freight('civil-machinery', ROCHEFORT, 'out', [BEAUMONT, AMPERE, CONCORD, WEYMARK, COMMERCIAL, CADIZ], 'civil-engineering machinery', 'heavy', 'Civil equipment manufacturer', 'Construction and municipal machinery.'),
  freight('agricultural-equipment', ROCHEFORT, 'out', [DAHAI, OCEAN, CONCORD, COMMERCIAL], 'agricultural machinery sets', 'heavy', 'Agricultural equipment manufacturer', 'Food-production and handling equipment.'),
  freight('precision-output', ROCHEFORT, 'out', [DESCARTES, SVAROG, VELES, OBSERVATORY], 'sensor interface assemblies', 'light', 'Precision component manufacturer', 'Finished instrumentation and interface assemblies.'),
  freight('overhaul-returns', ROCHEFORT, 'in', [DAHAI, BEAUMONT, CONCORD, COMMERCIAL], 'rebuildable coolant pump sets', 'heavy', 'Industrial repair workshop', 'Customer machinery returned for overhaul.'),
  freight('food-exports', VALENNE, 'out', [BEAUMONT, AMPERE, DESCARTES, CONCORD, ROSTER, WEYMARK, COMMERCIAL, CADIZ, SVAROG, 'harlan-dock', 'mercer-dock'], 'preserved-food crates', 'standard', 'Agricultural cooperative', 'Food for offworld households and workplaces.'),
  freight('fresh-produce', VALENNE, 'out', [BEAUMONT, DAHAI, OLYMPOS, COMMERCIAL, SVAROG], 'fresh-produce crates', 'standard', 'Produce wholesaler', 'Protected fresh produce; temperature control supplied with the consignment.'),
  freight('seed-exports', VALENNE, 'out', [BEAUMONT, CONCORD, WEYMARK, DAHAI], 'certified seed lots', 'light', 'Seed cooperative', 'Planting stock for protected cultivation.'),
  freight('farm-spares', VALENNE, 'in', [HAMMER, VELES, HIGHLINER], 'agricultural machinery spares', 'standard', 'Agricultural purchasing cooperative', 'Specialized parts for local farming and food processing.'),
  freight('nutrient-inputs', VALENNE, 'in', [CINDERHOOK], 'trace-mineral nutrient concentrates', 'standard', 'Agricultural purchasing cooperative', 'Selected nutrient inputs, not bulk soil imports.'),
  freight('breeding-stock', VALENNE, 'in', [HIGHLINER, KALYNA], 'quarantined breeding stock', 'light', 'Seed cooperative', 'Controlled breeding and cultivation stock.'),
  freight('coastal-specialties', MIRABEL, 'out', [DAHAI, OLYMPOS, BEAUMONT, COMMERCIAL], 'regional specialty foods', 'standard', 'Regional food exporter', 'Packaged coastal food specialties.'),
  freight('coastal-imports', MIRABEL, 'in', [DAHAI, KALYNA, HIGHLINER], 'cultured delicacy stock', 'light', 'Hospitality purchasing cooperative', 'Specialty food for residents and visitors.'),
  freight('cultural-touring', MIRABEL, 'out', [BEAUMONT, DAHAI, CONCORD], 'musicians’ equipment', 'light', 'Performing arts booking office', 'Touring performance equipment.'),
  freight('cultural-returns', MIRABEL, 'in', [BEAUMONT, DAHAI, CONCORD], 'musicians’ equipment', 'light', 'Performing arts booking office', 'Touring equipment returning home.'),
  freight('polar-habitats', COUSTEAU, 'in', [VELES, BEAUMONT, COMMERCIAL], 'cold-rated habitat fittings', 'standard', 'Polar engineering contractor', 'Protected field habitation and working shelters.'),
  freight('polar-machinery', COUSTEAU, 'in', [HAMMER, CONCORD], 'polar field machinery', 'heavy', 'Polar engineering contractor', 'Cold-rated equipment for glaciology and ground works.'),
  freight('polar-instruments', COUSTEAU, 'in', [DESCARTES, MOSAIC, OCEAN], 'survey instrument crates', 'light', 'Environmental research contractor', 'Climate and ice-monitoring instruments.'),
  freight('polar-samples', COUSTEAU, 'out', [RESEARCH, PELAGIC, DESCARTES], 'polar sample cabinets', 'light', 'Environmental research contractor', 'Ice cores and environmental specimens for comparative study.'),
  freight('polar-returns', COUSTEAU, 'out', [MOSAIC], 'field calibration service kits', 'light', 'Environmental research contractor', 'Field instruments returned for calibration.'),
  passengers('ordinary-resident-travel', ORSELLE, [BEAUMONT, DAHAI, CONCORD, WEYMARK, COMMERCIAL, CADIZ, ROSTER, ANVIL], 'civilian resident passengers', 'Passenger booking agency', 'Resident, family and business travel.'),
  passengers('civilian-business', ORSELLE, [BEAUMONT, DAHAI, CONCORD, ROADSTEAD, VELES, COMMERCIAL, CADIZ, SERRATINE, OLYMPOS, 'estella-xb-worker-hab', 'estella-xib-science-settlement', 'estella-xia-sealed-worker-hab'], 'civilian business passengers', 'Business travel agency', 'Independent commercial visits and return journeys.'),
  passengers('civilian-relocation', ORSELLE, [BEAUMONT, DAHAI, CONCORD, WEYMARK, COMMERCIAL, CADIZ, ROSTER, ANVIL, 'estella-va-miner-hab', 'industrial-refinery-staff-hab'], 'civilian relocation passengers', 'Household relocation agency', 'Voluntary household moves and new employment.'),
  passengers('education-travel', ORSELLE, [BEAUMONT, DAHAI, CONCORD, WEYMARK, CADIZ, DESCARTES], 'university students and staff', 'University travel office', 'Study, teaching and research visits.'),
  passengers('clinical-travel', ORSELLE, [BEAUMONT, CONCORD, WEYMARK, COMMERCIAL, CADIZ, ROSTER, ANVIL, SVAROG, 'estella-va-miner-hab', 'industrial-refinery-staff-hab'], 'civilian medical passengers', 'Clinical travel office', 'Scheduled treatment and recovery travel.'),
  passengers('industrial-specialists', ROCHEFORT, [BEAUMONT, AMPERE, DAHAI, CONCORD, VELES, MOSAIC], 'civil engineering specialists', 'Engineering travel office', 'Installation, commissioning and return travel.'),
  passengers('technical-study', ROCHEFORT, [BEAUMONT, AMPERE, DAHAI, CONCORD, VELES, MOSAIC, ANVIL, COMMERCIAL], 'technical students and instructors', 'Technical college travel office', 'Civilian vocational study and teaching exchanges.'),
  passengers('agricultural-specialists', VALENNE, [BEAUMONT, DAHAI, CONCORD, WEYMARK], 'agricultural specialists', 'Agricultural cooperative', 'Cultivation and food-processing assignments.'),
  passengers('holiday-travel', MIRABEL, [BEAUMONT, DAHAI, CONCORD, COMMERCIAL, CADIZ, ROSTER, SVAROG], 'civilian holiday passengers', 'Passenger booking agency', 'Coastal holidays, offworld visits and return journeys.'),
  passengers('family-visits', MIRABEL, [BEAUMONT, DAHAI, CONCORD, COMMERCIAL, CADIZ, ROSTER, SVAROG, WEYMARK, 'industrial-refinery-staff-hab', 'estella-va-miner-hab'], 'civilian family visitors', 'Passenger booking agency', 'Family visits and return journeys.'),
  passengers('cultural-exchanges', MIRABEL, [BEAUMONT, DAHAI, CONCORD], 'cultural exchange passengers', 'Cultural travel office', 'Performances and university exchanges.'),
  passengers('polar-specialists', COUSTEAU, [DESCARTES, OCEAN, RESEARCH], 'polar research crews', 'Environmental research contractor', 'Scientific and engineering crew rotations.'),
];

const GOVERNMENT_LANES: readonly Lane[] = [
  passengers('civil-service', ORSELLE, [BEAUMONT, DAHAI, CONCORD, CADIZ, SERRATINE], 'government civil servants', 'Sector Government', 'Administrative assignments and return travel.'),
  passengers('inspection', ORSELLE, [CUSTOMS, ROADSTEAD, ANVIL], 'government inspection teams', 'Sector Government', 'Civil inspection and standards visits.'),
  passengers('polar-public-works', COUSTEAU, [DESCARTES, OCEAN], 'government field scientists', 'Sector Government', 'Public climate-monitoring and engineering assignments.'),
  freight('public-clinics', ORSELLE, 'out', [BEAUMONT, CONCORD, WEYMARK], 'public clinic modules', 'heavy', 'Sector Government', 'Public-service equipment procurement.'),
  freight('research-procurement', COUSTEAU, 'in', [MOSAIC, HIGHLINER], 'survey instrument crates', 'light', 'Sector Government', 'Public polar research procurement.'),
  freight('public-records', ORSELLE, 'in', [CUSTOMS, CONCORD], 'sealed administrative archives', 'light', 'Sector Government', 'Physical records for central administration.'),
];

const EDF_LANES: readonly Lane[] = [
  passengers('yard-rotation', ORSELLE, [SVAROG, 'estella-xie-outer-spec-drydock'], 'EDF relief personnel', 'Estella Defence Force', 'Shipyard liaison and relief assignments.'),
  passengers('training-exchange', ORSELLE, [ACADEMY, CALATRAVA], 'EDF training personnel', 'Estella Defence Force', 'Exchange training and exercise-observer rotations.'),
  passengers('liaison', ORSELLE, [CUSTOMS, CADIZ], 'EDF liaison personnel', 'Estella Defence Force', 'Port liaison assignments and returns.'),
  passengers('leave-travel', ORSELLE, [BEAUMONT, DAHAI, COMMERCIAL], 'EDF leave passengers', 'Estella Defence Force', 'Service personnel on leave and returning to duty.'),
  freight('service-stores', ORSELLE, 'out', [SVAROG, ACADEMY], 'EDF service stores', 'standard', 'Estella Defence Force', 'Personal equipment and routine support stores.'),
  freight('service-supplies', ORSELLE, 'in', [COMMERCIAL], 'EDF service stores', 'standard', 'Estella Defence Force', 'Routine support procurement.'),
];

function provider(id: string, name: string, lanes: readonly Lane[], tag?: string): FactionContractProvider {
  return { id, name, generateContracts(ctx: FactionContractContext): FactionContractCandidate[] {
    const out: FactionContractCandidate[] = [];
    for (const lane of lanes) for (const external of lane.externalIds) {
      for (const direction of lane.direction === 'both' ? ['in', 'out'] as const : [lane.direction]) {
        const sourceId = direction === 'out' ? lane.site : external;
        if (sourceId !== ctx.sourceId) continue;
        const destinationId = direction === 'out' ? external : lane.site;
        const key = `${lane.id}:${external}:${direction}`;
        out.push({
          factionId: id, factionName: name, factionTag: tag,
          issuerId: tag ? id : `${id}:${lane.issuer.toLowerCase().replace(/[^a-z]+/g, '-')}`,
          issuerName: lane.issuer,
          templateId: `gaia:${key}`, gaiaDispatchKey: `${id}:${key}`, sourceId, destinationId,
          category: lane.category,
          cargo: { label: lane.label, massClass: lane.massClass, massTons: cargoMassForClass(lane.massClass, `${id}:${key}`) },
          // Civilian rows aggregate many ordinary customers. Institutions remain
          // visible minorities without priority slots or forced board quotas.
          likelihood: id === GAIA_CIVILIAN_ID ? 2 : 0.65,
          generosity: lane.category === 'passenger' ? 0.6 : 0.8,
          compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45,
          maxCompAllowance: 2,
          details: lane.purpose,
        });
      }
    }
    const dahaiLanes = id === GOVERNMENT_ID ? DAHAI_GOVERNMENT_LANES : id === EDF_ID ? DAHAI_EDF_LANES : [];
    return [...out, ...(id === GOVERNMENT_ID ? CAMPS_GOVERNMENT_LANES : []).flatMap(lane => campsTradeContracts(ctx, {
      factionId: id, factionName: name, factionTag: tag, issuerId: id,
      generosity: lane.category === 'passenger' ? 0.6 : 0.8,
      compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45, maxCompAllowance: 2,
    }, [lane])), ...dahaiLanes.flatMap(lane => dahaiTradeContracts(ctx, {
      factionId: id, factionName: name, factionTag: tag, issuerId: id,
      generosity: lane.category === 'passenger' ? 0.6 : 0.8,
      compensationRatio: lane.category === 'passenger' ? 0.6 : 0.45, maxCompAllowance: 2,
    }, [lane]))];
  } };
}

export const GAIA_CIVILIAN_PROVIDER = provider(GAIA_CIVILIAN_ID, 'Independent civilian bookings', CIVILIAN_LANES);
export const GOVERNMENT_PROVIDER = provider(GOVERNMENT_ID, 'Sector Government', GOVERNMENT_LANES, 'GOV');
export const EDF_PROVIDER = provider(EDF_ID, 'Estella Defence Force', EDF_LANES, 'EDF');
