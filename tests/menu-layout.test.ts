import { drawInteractiveScene, interactiveOptionLayout, interactiveSceneBodyScrollLimit, parseInteractiveTextMarkup, type InteractiveScene, type InteractiveSceneOption } from '../src/interactive-scene';
import { wrapMenuText, visibleMenuRange } from '../src/menu-layout';
import { defaultCareerProfile, TEAMSTER_CERTIFICATION_IDS } from '../src/career-state';
import { equipmentScene } from '../src/equipment-scene';
import { MAINTENANCE_SHOPS, stockedComponentGrades } from '../src/maintenance/shops';
import { MAINTENANCE_COMPONENTS, componentFaults } from '../src/maintenance/catalog';
import { createDefaultRigState } from '../src/maintenance/rig-state';
import { RIG_EQUIPMENT } from '../src/maintenance/equipment';
import { Game } from '../src/game';
import { LOCAL_DIRECTORY_ENTRIES } from '../src/local-directory';
import { estellaSelectableNavTargets, estellaFolderEntries, type EstellaFolderKey } from '../src/content/estella/navigation';
import { generateCareerContracts, generatePassengerContracts } from '../src/career-contracts';
import { generateEstellaMission, estellaGeneratedMissionScene } from '../src/estella-mission';
import { createEstellaNavState, drawEstellaNavigation } from '../src/estella-nav';
import { drawStartMenu, drawFlightMenu } from '../src/hud';

// Headless desktop layout checks only: conservative monospace metrics, no browser/save.
let assertions = 0, scenes = 0, options = 0;
function assert(value: unknown, message: string): asserts value { assertions++; if (!value) throw new Error(message); }
const compact = (text: string) => text.replace(/\s/g, '');
type DrawnText = { text: string; x: number; y: number; width: number; font: string; align: string; color: string };
let drawn: DrawnText[] = [];
const stack: any[] = [];
const base: any = {
  font: '13px monospace', textAlign: 'left', fillStyle: '',
  measureText(text: string) { return { width: Array.from(text).length * Number(this.font.match(/([\d.]+)px/)?.[1] ?? 13) * 0.62 }; },
  fillText(text: string, x: number, y: number) { drawn.push({ text, x, y, width: this.measureText(text).width, font: this.font, align: this.textAlign, color: this.fillStyle }); },
  save() { stack.push({ font: this.font, textAlign: this.textAlign, fillStyle: this.fillStyle }); },
  restore() { Object.assign(this, stack.pop()); },
};
const ctx = new Proxy(base, { get(target, key) { return key in target ? target[key] : () => {}; } }) as CanvasRenderingContext2D;
Object.defineProperty(globalThis, 'Path2D', { value: class {} });
const canvas = { width: 1024, height: 768 } as HTMLCanvasElement;
const profile = { ...defaultCareerProfile(), money: 99_999_999, certifications: [...TEAMSTER_CERTIFICATION_IDS], rig: createDefaultRigState(true) };
const game: any = Object.create(Game.prototype);
game.career = profile;
game.worldTime = 0;

function checkOption(option: InteractiveSceneOption, boxW: number): void {
  options++;
  const layout = interactiveOptionLayout(ctx, boxW, option);
  for (const [text, lines] of [[option.label, layout.labelLines], [option.detail ?? '', layout.detailLines], [option.rightText ?? '', layout.rightLines], [option.rightDetail ?? '', layout.rightDetailLines]] as const) {
    assert(compact(lines.join('')) === compact(text), `full option text retained: ${option.label}`);
    assert(!lines.some(line => /\.\.\.|…/.test(line)), `no ellipsis: ${option.label}`);
  }
  assert(layout.detailY >= layout.labelLines.length * 18, `detail below label: ${option.label}`);
  assert(layout.height >= layout.detailY + Math.max(0, layout.detailLines.length - 1) * 15 + 20, `row contains full detail: ${option.label}`);
  assert(layout.height < canvas.height - 210, `desktop selected row fits: ${option.label}`);
  ctx.font = 'bold 15px monospace';
  const labelRight = layout.textX + Math.max(...layout.labelLines.map(line => ctx.measureText(line).width));
  ctx.font = 'bold 14px monospace';
  const rightW = Math.max(0, ...layout.rightLines.map(line => ctx.measureText(line).width));
  assert(labelRight <= boxW - 24 - rightW + 0.01, `label does not overlap price: ${option.label}`);
  ctx.font = '12px monospace';
  assert(layout.detailLines.every(line => layout.detailX + ctx.measureText(line).width <= layout.textRight + 0.01), `detail stays outside price column: ${option.label}`);
  assert(layout.rightDetailLines.every(line => ctx.measureText(line).width <= layout.rightWidth + 0.01), `right detail fits: ${option.label}`);
}
function audit(scene: InteractiveScene): void {
  scenes++;
  for (const boxW of [920, 840]) scene.options.forEach(option => checkOption(option, boxW));
  // Every item is reachable and drawn in full when selected, with variable-height paging.
  scene.options.forEach((option, selected) => {
    drawn = [];
    drawInteractiveScene(ctx, canvas, scene, selected);
    const layout = interactiveOptionLayout(ctx, 920, option);
    const pointer = drawn.find(row => row.text === '▶')!;
    assert(!!pointer, 'selected cursor is rendered');
    const x = (canvas.width - 920) / 2;
    const cells = [
      { lines: layout.labelLines, x: x + layout.textX, y: pointer.y, step: 18 },
      { lines: layout.detailLines, x: x + layout.detailX, y: pointer.y + layout.detailY, step: 15 },
      { lines: layout.rightLines, x: x + 920 - 24, y: pointer.y, step: 18 },
      { lines: layout.rightDetailLines, x: x + 920 - 24, y: pointer.y + layout.rightDetailY, step: 15 },
    ];
    for (const cell of cells) cell.lines.forEach((text, index) => {
      const row = drawn.find(row => row.text === text && row.x === cell.x && row.y === cell.y + index * cell.step);
      assert(!!row && row.y > 90 && row.y < canvas.height - 68, `selected row fully visible: ${scene.title} / ${option.label} / ${text}`);
    });
    assert(drawn.every(row => !/\.\.\.|…/.test(row.text)), `renderer emits no ellipses: ${scene.title}`);
  });
}

for (const width of [150, 300, 840]) {
  for (const text of ['Passenger Comfort Package — Grade A', 'word '.repeat(60), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(6), 'first line\nsecond line', '']) {
    ctx.font = '15px monospace';
    const lines = wrapMenuText(ctx, text, width);
    assert(compact(lines.join('')) === compact(text), 'wrapping never loses characters');
    assert(lines.every(line => ctx.measureText(line).width <= width), 'wrapped text respects measured width');
  }
}
const heights = [58, 140, 70, 95, 58, 110];
for (let selected = 0; selected < heights.length; selected++) {
  const range = visibleMenuRange(heights, selected, 230);
  assert(range.start <= selected && range.end > selected, 'selected item stays in visible range');
  assert(heights.slice(range.start, range.end).reduce((a, b) => a + b, 0) <= 230, 'paging uses row heights rather than fixed count');
}
audit({ title: 'Stress case', options: [{ label: 'VeryLongUnbrokenEquipmentName'.repeat(3), detail: 'Long detail with all of its final words preserved. '.repeat(6), tag: 'LICENSED', leftIcon: 'wrench', secondRowIcons: ['lock', 'passenger'], rightText: '999,999,999 cr plus full fuel reimbursement', rightDetail: 'NET AT PAR +999,999,999 cr', action: 'test' }, { label: 'Back', action: 'back' }] });

for (const shop of MAINTENANCE_SHOPS) {
  game.career = { ...profile, locationId: shop.locationIds[0], rig: createDefaultRigState(true), maintenanceShopInspections: {} };
  for (const id of ['maintenanceShop', 'maintenanceDiagnosisConfirm', 'maintenanceReferral', 'maintenanceEmergencyConfirm']) audit(game.maintenanceShopScene({ id, selectedIndex: 0 }, shop, shop.name));
  game.career.maintenanceShopInspections[shop.id] = { diagnosedWorldTime: 0, diagnosedMaintenanceMission: 0, creditRemaining: 1000, dishonestyRevision: 2, fabricatedFaults: [], fabricatedServiceComponentIds: [], pretendMaintainedComponentIds: [] };
  for (const component of Object.values(game.career.rig.components) as any[]) component.ap = 0;
  for (const id of ['maintenanceShop', 'maintenanceDiagnosisReport', 'maintenanceService', 'maintenanceServiceAllConfirm', 'maintenanceFaults', 'maintenanceRepairAllConfirm']) audit(game.maintenanceShopScene({ id, selectedIndex: 0 }, shop, shop.name));
  if (shop.equipmentIds?.length) {
    const bare = { ...game.career, rig: createDefaultRigState(false) };
    for (const p of [bare, game.career]) {
      const scene = equipmentScene(p, shop, true);
      assert(scene.bodyRows?.length === 1 && scene.bodyRows[0].kind === 'text' && scene.bodyRows[0].text === 'Select an upgrade to view its details.', 'equipment overview is just the selection prompt');
      audit(scene);
    }
    const receipt = equipmentScene(bare, shop, true, undefined, 'Equipment installed.');
    assert(receipt.bodyRows?.[0].kind === 'text' && receipt.bodyRows[0].text === 'Select an upgrade to view its details.', 'selection prompt remains first after purchase');
    assert(receipt.bodyRows?.some(row => row.kind === 'text' && row.text === 'Equipment installed.'), 'receipt retained');
    for (const id of shop.equipmentIds) for (const grade of stockedComponentGrades(shop)) {
      const p = id === 'atmospheric-package' ? bare : game.career;
      const scene = equipmentScene(p, shop, true, { id, grade });
      assert(scene.bodyRows?.some(row => row.kind === 'text' && row.text === RIG_EQUIPMENT[id].description), 'details retain approved equipment description');
      audit(scene);
    }
  }
}
// Every authored repair label, including long component/library combinations.
for (const component of MAINTENANCE_COMPONENTS) for (const fault of componentFaults(component)) {
  audit({ title: component.name, options: [{ label: fault.repair, detail: `Repair and service ${component.name}.`, rightText: '999,999 cr', rightDetail: '12.5h', action: 'repair' }] });
}
for (const entry of LOCAL_DIRECTORY_ENTRIES) {
  for (const qualified of [false, true]) {
    game.career = { ...profile, certifications: qualified ? [...TEAMSTER_CERTIFICATION_IDS] : [], locationId: entry.locationIds[0] };
    audit(game.buildInteractiveScene({ id: 'localDirectoryEntry', directoryEntryId: entry.id, contracts: [], selectedIndex: 0 }));
    for (const action of entry.actions) audit(game.buildInteractiveScene({ id: 'localDirectoryAction', directoryEntryId: entry.id, directoryActionId: action.id, selectedIndex: 0 }));
  }
}
for (const id of ['stationTerminal', 'careerStatus', 'shipStatus', 'operationsManual', 'contractBoardLoading']) audit(game.buildInteractiveScene({ id, selectedIndex: 0 }));
let boardRows = 0;
for (const target of estellaSelectableNavTargets()) {
  game.career = { ...profile, locationId: target.id };
  audit(game.buildInteractiveScene({ id: 'localDirectory', selectedIndex: 0 }));
  for (const [id, contracts] of [
    ['browseContracts', generateCareerContracts(target.id, 0)],
    ['browsePassengerContracts', generatePassengerContracts(target.id, 0)],
  ] as const) {
    boardRows += contracts.length;
    audit(game.buildInteractiveScene({ id, contracts, selectedIndex: 0 }));
    if (contracts.length) {
      audit(game.buildInteractiveScene({ id: 'contractPosting', contracts, contractIndex: 0, selectedIndex: 0 }));
      game.career = { ...game.career, certifications: [], rig: createDefaultRigState(false) };
      audit(game.buildInteractiveScene({ id, contracts, selectedIndex: 0 }));
    }
  }
}
// Legacy navigation descriptions no longer use a 100-character cutoff.
const folders: EstellaFolderKey[] = ['root'];
const visited = new Set<EstellaFolderKey>();
while (folders.length) {
  const folder = folders.pop()!;
  if (visited.has(folder)) continue;
  visited.add(folder);
  const entries = estellaFolderEntries(folder);
  for (const entry of entries) if (entry.key) folders.push(entry.key);
  for (let cursorIndex = 0; cursorIndex < entries.length; cursorIndex++) {
    drawn = [];
    drawEstellaNavigation(ctx, canvas, { ...createEstellaNavState(), folder, cursorIndex });
    assert(drawn.every(row => !/\.\.\.|…/.test(row.text)), 'legacy navigation emits no ellipses');
  }
}
const mission = generateEstellaMission('estella-xiid-mirror-clinic', 'estella-xi-science-waypoint-poi', 0);
const preview = estellaGeneratedMissionScene(mission);
audit(preview);
assert(interactiveSceneBodyScrollLimit(ctx, canvas, preview) > 0, 'long route preview has accessible scrolling');
assert(mission.legs.every(leg => preview.bodyRows?.some(row => row.kind === 'text' && row.text === leg.detail)), 'preview retains all full leg descriptions');
game.ctx = ctx;
game.canvas = canvas;
game.phase = { kind: 'estellaMission', mission };
const originalTransfer = mission.selectedTransferOption;
game.handleEstellaGeneratedMission({ pageDown: true });
assert((mission.bodyScrollOffset ?? 0) > 0, 'preview PgDn input scrolls details');
assert(mission.selectedTransferOption === originalTransfer, 'scrolling does not change departure');
game.handleEstellaGeneratedMission({ pageUp: true });
assert(mission.bodyScrollOffset === 0, 'preview PgUp returns to top');
const rich = parseInteractiveTextMarkup('Chief [person]VeryLongShipwrightName[/person] greets [contact]the visiting Teamster[/contact].');
const richScene: InteractiveScene = { title: 'Rich details', bodyRows: [{ kind: 'kv', label: 'DESCRIPTION', value: rich.text, valueSegments: rich.segments }], options: [] };
drawn = [];
drawInteractiveScene(ctx, canvas, richScene, 0);
assert(drawn.some(row => row.color === '#4ddcff' && row.text.includes('visiting')), 'contact markup remains cyan');
assert(compact(drawn.filter(row => row.y > 100 && row.y < 250 && row.text !== 'DESCRIPTION').map(row => row.text).join('')).includes(compact(rich.text)), 'rich text retains all text');
const longBody: InteractiveScene = { title: 'Full report', bodyRows: [{ kind: 'kv', label: 'Finding', value: `${'Full diagnostic report. '.repeat(70)}END_OF_REPORT`, valueLineCount: 1 }], options: [{ label: 'Back', action: 'back' }] };
const scrollLimit = interactiveSceneBodyScrollLimit(ctx, canvas, longBody);
assert(scrollLimit > 0, 'old one-line hint does not hide long report');
drawn = [];
drawInteractiveScene(ctx, canvas, longBody, 0, scrollLimit);
assert(drawn.some(row => row.text.includes('END_OF_REPORT') && row.y > 92 && row.y < 352), 'final report text reachable by scrolling');
for (let index = 0; index < 6; index++) {
  drawn = [];
  drawStartMenu(ctx, canvas, index, 'Continue Career', false, false);
  drawFlightMenu(ctx, canvas, index);
  assert(drawn.every(row => !/\.\.\.|…/.test(row.text)), 'start and flight menus have no truncation');
}
console.log(`Menu layout audit passed: ${scenes} scenes, ${options} option layouts, ${boardRows} board rows, ${visited.size} navigation folders, ${assertions} assertions.`);
