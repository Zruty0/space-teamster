export const NUNES_INQUIRY_TARGET = 100;
export const NUNES_INQUIRY_PASSIVE_PROGRESS_PER_DAY = 0.25;
export const NUNES_INQUIRY_CONTRACT_PROGRESS = 8;
export const NUNES_ACTIVE_INQUIRY_COUNT = 3;

export interface NunesInquiryCatalogEntry {
  id: string;
  name: string;
  principalInstitution: string;
  principalLocationId: string;
  summary: string;
}

export const NUNES_INQUIRY_CATALOG: readonly NunesInquiryCatalogEntry[] = [
  { id: 'living-ice', name: 'Living Ice', principalInstitution: 'Frostglass Collegium', principalLocationId: 'estella-xa-exobiology-research', summary: 'Beira’s subsurface life, sealed ecologies, and the physiology of organisms beneath ancient ice.' },
  { id: 'manticore-winter', name: 'Manticore’s Winter', principalInstitution: 'Manticore Observatory', principalLocationId: 'estella-xii-observation-post', summary: 'Manticore’s storms, cold atmospheric chemistry, and seasonal celestial influences.' },
  { id: 'blackglass-parallax', name: 'the Blackglass Parallax', principalInstitution: 'Blackglass Observatory', principalLocationId: 'estella-xiid-blackglass-observatory', summary: 'Deep observations refining the geometry of the Reach and its wandering bodies.' },
  { id: 'blue-fire', name: 'Blue Fire', principalInstitution: 'Teide Survey Collegium', principalLocationId: 'estella-xiic-comet-research', summary: 'Teide’s unusual isotopes considered through mineral philosophy, alchemy, and practical assay.' },
  { id: 'memory-seat', name: 'Memory’s Seat', principalInstitution: 'Mirror Clinic', principalLocationId: 'estella-xiid-mirror-clinic', summary: 'Memory, identity, neural alteration, and the limits of bodily continuity.' },
  { id: 'silent-signal', name: 'the Silent Signal', principalInstitution: 'The Far Bell Tower', principalLocationId: 'estella-xii-comm-relay-poi', summary: 'Transmissions and celestial patterns recorded beyond ordinary Manticore traffic.' },
  { id: 'captive-stone', name: 'Captive Stone', principalInstitution: 'Academy of Sublime Measures', principalLocationId: 'estella-xi-science-waypoint-poi', summary: 'The origins, transformations, and hidden affinities of the Wells’ captured asteroids.' },
  { id: 'empty-crucible', name: 'the Empty Crucible', principalInstitution: 'Alembic Ring', principalLocationId: 'estella-xd-chem-station', summary: 'Alchemical reactions conducted in vacuum, weightlessness, and extreme cold.' },
  { id: 'wandering-lights', name: 'the Wandering Lights', principalInstitution: 'Blackglass Observatory', principalLocationId: 'estella-xiid-blackglass-observatory', summary: 'Uncatalogued minor bodies and their passage through the outer dark.' },
  { id: 'common-physic', name: 'the Common Physic', principalInstitution: 'Mirror Clinic', principalLocationId: 'estella-xiid-mirror-clinic', summary: 'Human adaptation across gravity, radiation, atmosphere, diet, and prolonged isolation.' },
  { id: 'concordant-measures', name: 'Concordant Measures', principalInstitution: 'Academy of Sublime Measures', principalLocationId: 'estella-xi-science-waypoint-poi', summary: 'Discrepancies among the instruments, standards, and observations of the Wells’ learned houses.' },
  { id: 'second-shadow', name: 'the Second Shadow', principalInstitution: 'Blackglass Observatory', principalLocationId: 'estella-xiid-blackglass-observatory', summary: 'Unexplained occultations, repeated silhouettes, and objects inferred only through interrupted light.' },
];

export interface ActiveNunesInquiry {
  instanceId: string;
  catalogId: string;
  ordinal: number;
  progress: number;
}

export interface CompletedNunesInquiry {
  catalogId: string;
  ordinal: number;
  closedWorldTime: number;
}

export interface NunesInquiryState {
  updatedWorldTime: number;
  nextCatalogIndex: number;
  active: ActiveNunesInquiry[];
  completedCounts: Record<string, number>;
  history: CompletedNunesInquiry[];
}

export interface NunesInquirySnapshot {
  active: ActiveNunesInquiry[];
}

function catalogEntry(id: string): NunesInquiryCatalogEntry | undefined {
  return NUNES_INQUIRY_CATALOG.find(entry => entry.id === id);
}

function inquiryInstance(catalogId: string, ordinal: number): ActiveNunesInquiry {
  return { instanceId: `${catalogId}:${ordinal}`, catalogId, ordinal, progress: 0 };
}

export function createDefaultNunesInquiryState(worldTime = 0): NunesInquiryState {
  const initialProgress = [12, 44, 76];
  const active = NUNES_INQUIRY_CATALOG.slice(0, NUNES_ACTIVE_INQUIRY_COUNT)
    .map((entry, index) => ({ ...inquiryInstance(entry.id, 1), progress: initialProgress[index] ?? 0 }));
  return {
    updatedWorldTime: worldTime,
    nextCatalogIndex: active.length,
    active,
    completedCounts: {},
    history: [],
  };
}

function migratedActive(value: unknown): ActiveNunesInquiry[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const active: ActiveNunesInquiry[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== 'object') continue;
    const item = raw as Partial<ActiveNunesInquiry>;
    if (typeof item.catalogId !== 'string' || !catalogEntry(item.catalogId) || seen.has(item.catalogId)) continue;
    const ordinal = typeof item.ordinal === 'number' && Number.isFinite(item.ordinal) ? Math.max(1, Math.floor(item.ordinal)) : 1;
    active.push({
      instanceId: `${item.catalogId}:${ordinal}`,
      catalogId: item.catalogId,
      ordinal,
      progress: typeof item.progress === 'number' && Number.isFinite(item.progress) ? Math.max(0, item.progress) : 0,
    });
    seen.add(item.catalogId);
    if (active.length >= NUNES_ACTIVE_INQUIRY_COUNT) break;
  }
  return active;
}

function migratedCounts(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object') return {};
  const counts: Record<string, number> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!catalogEntry(id) || typeof raw !== 'number' || !Number.isFinite(raw)) continue;
    counts[id] = Math.max(0, Math.floor(raw));
  }
  return counts;
}

function migratedHistory(value: unknown): CompletedNunesInquiry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap(raw => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Partial<CompletedNunesInquiry>;
    if (typeof item.catalogId !== 'string' || !catalogEntry(item.catalogId)
      || typeof item.ordinal !== 'number' || !Number.isFinite(item.ordinal)
      || typeof item.closedWorldTime !== 'number' || !Number.isFinite(item.closedWorldTime)) return [];
    return [{ catalogId: item.catalogId, ordinal: Math.max(1, Math.floor(item.ordinal)), closedWorldTime: item.closedWorldTime }];
  }).slice(-12);
}

function openNextInquiry(state: NunesInquiryState, progress = 0): ActiveNunesInquiry {
  const activeIds = new Set(state.active.map(inquiry => inquiry.catalogId));
  let index = state.nextCatalogIndex;
  for (let attempts = 0; attempts < NUNES_INQUIRY_CATALOG.length; attempts++) {
    const candidate = NUNES_INQUIRY_CATALOG[index % NUNES_INQUIRY_CATALOG.length];
    index++;
    if (activeIds.has(candidate.id)) continue;
    state.nextCatalogIndex = index;
    const ordinal = (state.completedCounts[candidate.id] ?? 0) + 1;
    return { ...inquiryInstance(candidate.id, ordinal), progress };
  }
  const fallback = NUNES_INQUIRY_CATALOG[index % NUNES_INQUIRY_CATALOG.length];
  state.nextCatalogIndex = index + 1;
  const ordinal = (state.completedCounts[fallback.id] ?? 0) + 1;
  return { ...inquiryInstance(fallback.id, ordinal), progress };
}

function closeInquiryAt(state: NunesInquiryState, index: number, closedWorldTime: number, carryProgress = 0): void {
  const inquiry = state.active[index];
  state.completedCounts[inquiry.catalogId] = Math.max(state.completedCounts[inquiry.catalogId] ?? 0, inquiry.ordinal);
  state.history.push({ catalogId: inquiry.catalogId, ordinal: inquiry.ordinal, closedWorldTime });
  state.history = state.history.slice(-12);
  state.active.splice(index, 1);
  const replacement = openNextInquiry(state, carryProgress);
  state.active.splice(index, 0, replacement);
}

export function advanceNunesInquiryState(state: NunesInquiryState, worldTime: number): NunesInquiryState {
  const elapsedDays = Math.max(0, worldTime - state.updatedWorldTime) / 86_400;
  const passiveProgress = elapsedDays * NUNES_INQUIRY_PASSIVE_PROGRESS_PER_DAY;
  state.updatedWorldTime = Math.max(state.updatedWorldTime, worldTime);
  for (let index = 0; index < state.active.length; index++) {
    state.active[index].progress += passiveProgress;
    while (state.active[index].progress >= NUNES_INQUIRY_TARGET) {
      const carry = state.active[index].progress - NUNES_INQUIRY_TARGET;
      closeInquiryAt(state, index, worldTime, carry);
    }
  }
  return state;
}

export function migrateNunesInquiryState(value: unknown, worldTime: number): NunesInquiryState {
  const raw = value && typeof value === 'object' ? value as Partial<NunesInquiryState> : undefined;
  const fallback = createDefaultNunesInquiryState(worldTime);
  const active = migratedActive(raw?.active);
  const state: NunesInquiryState = {
    updatedWorldTime: typeof raw?.updatedWorldTime === 'number' && Number.isFinite(raw.updatedWorldTime)
      ? Math.min(raw.updatedWorldTime, worldTime)
      : worldTime,
    nextCatalogIndex: typeof raw?.nextCatalogIndex === 'number' && Number.isFinite(raw.nextCatalogIndex)
      ? Math.max(0, Math.floor(raw.nextCatalogIndex))
      : fallback.nextCatalogIndex,
    active: active.length === NUNES_ACTIVE_INQUIRY_COUNT ? active : fallback.active,
    completedCounts: migratedCounts(raw?.completedCounts),
    history: migratedHistory(raw?.history),
  };
  return advanceNunesInquiryState(state, worldTime);
}

export interface NunesInquiryContributionResult {
  advanced: boolean;
  closed: boolean;
  inquiryName?: string;
  progressBefore?: number;
  progressAfter?: number;
}

export function nunesInquiryWillClose(
  state: NunesInquiryState,
  instanceId: string,
  amount: number,
  worldTime: number,
): string | undefined {
  const inquiry = state.active.find(candidate => candidate.instanceId === instanceId);
  if (!inquiry) return undefined;
  const elapsedDays = Math.max(0, worldTime - state.updatedWorldTime) / 86_400;
  const projected = inquiry.progress + elapsedDays * NUNES_INQUIRY_PASSIVE_PROGRESS_PER_DAY + Math.max(0, amount);
  return projected >= NUNES_INQUIRY_TARGET ? formatNunesInquiryTitle(inquiry) : undefined;
}

export function contributeToNunesInquiry(
  state: NunesInquiryState,
  instanceId: string,
  amount: number,
  worldTime: number,
): NunesInquiryContributionResult {
  const protectedIndex = state.active.findIndex(inquiry => inquiry.instanceId === instanceId);
  if (protectedIndex < 0 || amount <= 0) {
    advanceNunesInquiryState(state, worldTime);
    return { advanced: false, closed: false };
  }
  const elapsedDays = Math.max(0, worldTime - state.updatedWorldTime) / 86_400;
  const passiveProgress = elapsedDays * NUNES_INQUIRY_PASSIVE_PROGRESS_PER_DAY;
  state.updatedWorldTime = Math.max(state.updatedWorldTime, worldTime);
  for (let index = 0; index < state.active.length; index++) {
    state.active[index].progress += passiveProgress;
    if (index === protectedIndex) continue;
    while (state.active[index].progress >= NUNES_INQUIRY_TARGET) {
      const carry = state.active[index].progress - NUNES_INQUIRY_TARGET;
      closeInquiryAt(state, index, worldTime, carry);
    }
  }
  const index = state.active.findIndex(inquiry => inquiry.instanceId === instanceId);
  const inquiry = state.active[index];
  const progressBefore = inquiry.progress;
  inquiry.progress += amount;
  const title = formatNunesInquiryTitle(inquiry);
  if (inquiry.progress < NUNES_INQUIRY_TARGET) {
    return { advanced: true, closed: false, inquiryName: title, progressBefore, progressAfter: inquiry.progress };
  }
  closeInquiryAt(state, index, worldTime);
  return { advanced: true, closed: true, inquiryName: title, progressBefore, progressAfter: NUNES_INQUIRY_TARGET };
}

export function nunesInquirySnapshot(state: NunesInquiryState, worldTime: number): NunesInquirySnapshot {
  advanceNunesInquiryState(state, worldTime);
  return { active: state.active.map(inquiry => ({ ...inquiry })) };
}

export function defaultNunesInquirySnapshot(worldTime: number): NunesInquirySnapshot {
  return nunesInquirySnapshot(createDefaultNunesInquiryState(0), worldTime);
}

export function nunesInquiryCatalogEntry(catalogId: string): NunesInquiryCatalogEntry {
  const entry = catalogEntry(catalogId);
  if (!entry) throw new Error(`Unknown Nunes Inquiry: ${catalogId}`);
  return entry;
}

export function ordinalNumber(value: number): string {
  const tens = value % 100;
  if (tens >= 11 && tens <= 13) return `${value}th`;
  if (value % 10 === 1) return `${value}st`;
  if (value % 10 === 2) return `${value}nd`;
  if (value % 10 === 3) return `${value}rd`;
  return `${value}th`;
}

export function formatNunesInquiryTitle(inquiry: Pick<ActiveNunesInquiry, 'catalogId' | 'ordinal'>): string {
  const entry = nunesInquiryCatalogEntry(inquiry.catalogId);
  return inquiry.ordinal <= 1
    ? `Inquiry of ${entry.name}`
    : `${ordinalNumber(inquiry.ordinal)} Inquiry of ${entry.name}`;
}
