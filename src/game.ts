// Game loop, state machine, collision detection, level management.

import { config } from './config';
import { InputState, readInput } from './input';
import {
  ShipState, createShip, updateShip,
  COLLISION_POINTS, GEAR_COLLISION_POINTS, LANDING_GEAR_REST_HEIGHT, localToWorld,
} from './ship';
import { TerrainData, checkLandingCollision as checkTerrainCollision, generateTerrain, landingReferenceHeight, isOnPad } from './terrain';
import { Camera, createCamera, updateCamera, render } from './renderer';
import { drawHUD, GameState, LandingScore, calculateLandingScore, drawStartMenu, drawFlightMenu, drawPhaseCompleteOverlay } from './hud';
import { createDevPanel, toggleDevPanel, setDevPanelMode } from './dev-panel';
import { LevelDef, landingLevelById } from './levels';
import {
  APPROACH_LEVELS, ApproachLevel, ApproachState, ApproachCamera, ApproachInitOverride,
  createApproachState, createApproachCamera, updateApproach,
  updateApproachCamera, renderApproach, drawApproachHUD, approachLevelById, applyApproachWeather,
} from './approach';
import {
  ORBITAL_LEVELS, OrbitalLevel, OrbitalState, OrbitalCamera, OrbitalInitOverride,
  createOrbitalState, createOrbitalCamera, updateOrbital,
  updateOrbitalCamera, renderOrbital, drawOrbitalHUD,
  orbitalLevelById, orbitalToApproachParams, getTransferBody, transferBodyState, currentEscapeVector, fuzzyArrivalStateFromEntry,
} from './orbital';
import {
  DOCKING_LEVELS, DockingLevel, DockingState, DockingCamera, DockingInitOverride,
  bayWorldPos, createDockingState, createDockingCamera, updateDocking,
  updateDockingCamera, renderDocking, drawDockingHUD,
} from './docking';
import {
  ClusterLevel, ClusterState, ClusterCamera, ClusterInitOverride,
  clusterLevelById, clusterMemberById, createClusterState, createClusterCamera, targetPort,
  updateCluster, updateClusterCamera, renderCluster, drawClusterHUD,
} from './cluster';
import { bodyById, bodyStateRelativeToParent } from './world';
import { createEstellaNavState, drawEstellaNavigation, estellaNavActivate, estellaNavBack, estellaNavForward, moveEstellaCursor, resetEstellaNavSelection, type EstellaNavPhaseState } from './estella-nav';
import { estellaDisplayPath } from './content/estella/navigation';
import { drawEstellaGeneratedMission, generateEstellaMission, type EstellaGeneratedMissionState, type EstellaTransferOption } from './estella-mission';
import { createPlayableEstellaMission, generatedEstellaDepartureOrbitDir } from './estella-playable';
import { careerContractClassLabel, generateCareerContracts, generateDirectoryEntryContracts, generatePassengerContracts, type CareerContract } from './career-contracts';
import { CAREER_START_LOCATION_ID, loadCareerProfile, resetCareerProfile, saveCareerProfile, type CareerProfile } from './career-state';
import { actualFuelCostForQuote, contractPayoutForQuote, estimateEstellaMissionCost, formatCredits, formatMissionResultLine, generateGenericCargoForRoute, type MissionCostQuote } from './mission-cost';
import { appendMissionProfile, createMissionProfileEntry, installMissionProfileConsoleTools } from './mission-profile-log';
import { drawInteractiveScene, type InteractiveScene, type InteractiveTone } from './interactive-scene';
import { localDirectoryEntriesAt, localDirectoryEntryAccess, localDirectoryEntryById } from './local-directory';
import { drawOperationsManualArticle, operationsManualArticleById, type OperationsManualArticleId } from './operations-manual';

const PHYSICS_DT = 1 / 120;
const MAX_FRAME_TIME = 0.1;

type GameplayPhase =
  | { kind: 'landing'; level: LevelDef; ship: ShipState; terrain: TerrainData; camera: Camera; state: GameState; score: LandingScore | null; initOverride?: { x: number; y: number; vx: number; vy: number; facingSign?: 1 | -1 }; launchGuidance?: { targetAltitude: number; orbitDir: 1 | -1; nextApproachLevelId: number }; worldTimeStart: number; missionDvStart: number }
  | { kind: 'approach'; level: ApproachLevel; as: ApproachState; cam: ApproachCamera; state: 'approaching' | 'approachSuccess' | 'approachFailed'; initOverride?: ApproachInitOverride; worldTimeStart: number; missionDvStart: number }
  | { kind: 'orbital'; level: OrbitalLevel; os: OrbitalState; cam: OrbitalCamera; state: 'orbiting' | 'enteredAtmo' | 'crashed' | 'docked'; initOverride?: OrbitalInitOverride; worldTimeStart: number; missionDvStart: number }
  | { kind: 'docking'; level: DockingLevel; ds: DockingState; cam: DockingCamera; state: 'docking' | 'delivered' | 'crashed'; initOverride?: DockingInitOverride; worldTimeStart: number; missionDvStart: number }
  | { kind: 'cluster'; level: ClusterLevel; cs: ClusterState; cam: ClusterCamera; state: 'flying' | 'arrived' | 'crashed'; initOverride?: ClusterInitOverride; worldTimeStart: number; missionDvStart: number };

type Phase =
  | { kind: 'startMenu' }
  | GameplayPhase
  | { kind: 'flightMenu'; previous: GameplayPhase }
  | { kind: 'estellaNav'; nav: EstellaNavPhaseState }
  | { kind: 'estellaMission'; mission: EstellaGeneratedMissionState }
  | { kind: 'interactiveScene'; scene: InteractiveScenePhaseState }
  | { kind: 'manualArticle'; articleId: OperationsManualArticleId; returnPhase: GameplayPhase | { kind: 'interactiveScene'; scene: InteractiveScenePhaseState }; tutorialSplash: boolean };

interface InteractiveScenePhaseState {
  id: 'stationTerminal' | 'browseContracts' | 'browsePassengerContracts' | 'contractPosting' | 'localDirectory' | 'localDirectoryEntry' | 'localDirectoryAction' | 'operationsManual' | 'careerStatus' | 'shipStatus';
  selectedIndex: number;
  board?: 'freight' | 'passenger' | 'contact';
  contracts?: CareerContract[];
  contractIndex?: number;
  directoryEntryId?: string;
  directoryActionId?: string;
  directoryParentEntryId?: string;
}

interface PhaseCompletion {
  title: string;
  tone?: 'success' | 'transition';
  phaseDvUsed: number;
  missionDvUsed: number;
  completionText: string;
  ratingText?: string;
  ratingColor?: string;
  detailText?: string;
  onContinue: () => void;
  onRetry: () => void;
}

type TransitionRole = 'success' | 'contingency';

function contractMarginRatio(quote: MissionCostQuote): number {
  return quote.parFuelCost > 0 ? quote.expectedMargin / quote.parFuelCost : 0;
}

function formatSignedPercent(value: number): string {
  return `${value >= 0 ? '+' : ''}${(value * 100).toFixed(0)}%`;
}

function contractMarginSummary(quote: MissionCostQuote): string {
  return `${formatCredits(quote.expectedMargin)} (${formatSignedPercent(contractMarginRatio(quote))})`;
}

function contractFixedReward(quote: MissionCostQuote): number {
  return Math.round(quote.pay.generosity * quote.parFuelCost + quote.pay.flatReward);
}

function contractPublishedPay(quote: MissionCostQuote): string {
  return `${formatCredits(contractFixedReward(quote))} + ${(quote.pay.compensationRatio * 100).toFixed(0)}% fuel reimbursement`;
}

function contractOptionTone(contract: CareerContract): InteractiveTone {
  const netAtPar = contract.quote.expectedMargin;
  const marginRatio = contractMarginRatio(contract.quote);
  if (netAtPar < -30_000) return 'danger';
  if (marginRatio <= 0.05) return 'warning';
  if (netAtPar >= 100_000) return 'success';
  return 'normal';
}

interface PhaseTransition {
  role: TransitionRole;
  title?: string;
  detailText?: string;
  billableDvAdjustment?: number;
  adjustmentLabel?: string;
  run: () => void;
}

const START_MENU_ITEMS = 5;
const FLIGHT_MENU_ITEMS = 5;
const START_MENU_NEW_GAME_PLUS_INDEX = 2;
const START_MENU_OPERATIONS_MANUAL_INDEX = 4;
const FLIGHT_MENU_SHIPBOARD_TERMINAL_INDEX = 3;

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private phase: Phase = { kind: 'startMenu' };
  private accumulator = 0;
  private time = 0;
  private worldTime = 0;
  private lastFrameTime = 0;
  private menuSelection = 0;
  private flightMenuSelection = 0;
  private confirmingNewTeamsterReset = false;
  private startMenuReturnPhase: Phase | null = null;
  private guidanceText = '';
  private guidanceUntil = 0;
  private missionDvUsed = 0;
  private activeMissionQuote: MissionCostQuote | null = null;
  private activeMissionTransfer: EstellaTransferOption | undefined;
  private activeMissionStartWorldTime = 0;
  private activeMissionSourceId: string | null = null;
  private activeMissionDestinationId: string | null = null;
  private activeCareerContract: CareerContract | null = null;
  private localTransferTutorialShown = false;
  private career: CareerProfile = loadCareerProfile();
  private phaseCompletion: PhaseCompletion | null = null;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;
    createDevPanel();
    installMissionProfileConsoleTools();
  }

  start(): void {
    this.lastFrameTime = performance.now() / 1000;
    requestAnimationFrame(this.loop);
  }

  // --- Level loading ---

  private loadLanding(
    level: LevelDef,
    initOverride?: { x: number; y: number; vx: number; vy: number; facingSign?: 1 | -1 },
    launchGuidance?: { targetAltitude: number; orbitDir: 1 | -1; nextApproachLevelId: number },
    worldTimeStart: number = this.worldTime,
  ): void {
    config.gravity = level.gravity;
    config.landingMaxVSpeed = level.landingMaxVSpeed;
    config.landingMaxHSpeed = level.landingMaxHSpeed;
    config.landingMaxAngle = level.landingMaxAngle;
    const init = initOverride ?? { x: level.startX, y: level.startY, vx: level.startVX, vy: level.startVY };
    config.startX = init.x;
    config.startY = init.y;
    config.startVX = init.vx;
    config.startVY = init.vy;
    const terrain = generateTerrain(level);
    const ship = createShip();
    ship.facingSign = launchGuidance
      ? (launchGuidance.orbitDir > 0 ? 1 : -1)
      : (initOverride?.facingSign ?? 1);
    if (launchGuidance) {
      ship.gearDeployed = true;
      ship.x = level.padCenterX;
      ship.y = landingReferenceHeight(level, terrain, level.padCenterX) + LANDING_GEAR_REST_HEIGHT;
      ship.vx = 0;
      ship.vy = 0;
      ship.angle = 0;
      ship.angularVel = 0;
      ship.throttle = 0;
    }
    const camera = createCamera();
    updateCamera(camera, ship, landingReferenceHeight(level, terrain, ship.x), 0);
    this.phaseCompletion = null;
    this.phase = { kind: 'landing', level, ship, terrain, camera, state: 'flying', score: null, initOverride, launchGuidance, worldTimeStart, missionDvStart: this.missionDvUsed };
    if (launchGuidance) this.showGuidance(`CLIMB TO above ${launchGuidance.targetAltitude.toFixed(0)}m`);
    else this.showGuidance('LAND ON THE PAD');
    setDevPanelMode('landing');
    this.time = 0;
    this.worldTime = worldTimeStart;
    this.accumulator = 0;
  }

  private loadApproach(level: ApproachLevel, initOverride?: ApproachInitOverride, worldTimeStart: number = this.worldTime): void {
    applyApproachWeather(level, worldTimeStart);
    const as = createApproachState(level, initOverride);
    const cam = createApproachCamera(level);
    updateApproachCamera(cam, as, level, 0, this.canvas.width, this.canvas.height);
    this.phaseCompletion = null;
    this.phase = { kind: 'approach', level, as, cam, state: 'approaching', initOverride, worldTimeStart, missionDvStart: this.missionDvUsed };
    if (level.departure) {
      const dir = level.departure.orbitDir === -1 ? 'LEFT' : 'RIGHT';
      this.showGuidance(`CLIMB to ${(level.departure.exitAltitude / 1000).toFixed(1)}km and ACCELERATE ${dir}`);
    } else {
      this.showGuidance('ARRIVE AT TARGET AREA');
    }
    setDevPanelMode('approach', () => this.loadApproach(level, initOverride, worldTimeStart));
    this.time = 0;
    this.worldTime = worldTimeStart;
    this.accumulator = 0;
  }

  private loadDocking(level: DockingLevel, initOverride?: DockingInitOverride, worldTimeStart: number = this.worldTime): void {
    const ds = createDockingState(level, initOverride);
    const cam = createDockingCamera();
    updateDockingCamera(cam, ds, level, 0, this.canvas.width, this.canvas.height);
    this.phaseCompletion = null;
    this.phase = { kind: 'docking', level, ds, cam, state: 'docking', initOverride, worldTimeStart, missionDvStart: this.missionDvUsed };
    this.showGuidance(level.exitMode ? 'CLEAR THE STATION' : 'DELIVER TO TARGET BAY');
    this.time = 0;
    this.worldTime = worldTimeStart;
    this.accumulator = 0;
  }

  private loadCluster(level: ClusterLevel, initOverride?: ClusterInitOverride, worldTimeStart: number = this.worldTime): void {
    const cs = createClusterState(level, initOverride);
    const cam = createClusterCamera(level);
    updateClusterCamera(cam, cs, level, 0, this.canvas.width, this.canvas.height);
    this.phaseCompletion = null;
    const clusterPhase: Extract<GameplayPhase, { kind: 'cluster' }> = { kind: 'cluster', level, cs, cam, state: 'flying', initOverride, worldTimeStart, missionDvStart: this.missionDvUsed };
    this.phase = clusterPhase;
    this.showGuidance(level.escapeToOrbitalLevelId ? 'LOCAL TRAFFIC: EXIT VOLUME ON ESCAPE VECTOR' : 'LOCAL TRAFFIC: FLY TO ASSIGNED BERTH');
    this.time = 0;
    this.worldTime = worldTimeStart;
    this.accumulator = 0;
    if (this.activeCareerContract?.templateId === 'basic-certification-still-transfer' && !this.localTransferTutorialShown) {
      this.localTransferTutorialShown = true;
      this.phase = { kind: 'manualArticle', articleId: 'local-transfer', returnPhase: clusterPhase, tutorialSplash: true };
    }
  }

  private loadEstellaNavigation(): void {
    this.phaseCompletion = null;
    this.phase = { kind: 'estellaNav', nav: createEstellaNavState() };
    this.showGuidance('SELECT ESTELLA SOURCE AND DESTINATION');
    this.time = 0;
    this.accumulator = 0;
  }

  private loadStationTerminal(selectedIndex = 0): void {
    this.phaseCompletion = null;
    this.clearActiveMission();
    this.worldTime = this.career.worldTime;
    this.phase = { kind: 'interactiveScene', scene: { id: 'stationTerminal', selectedIndex } };
    this.showGuidance('STATION TERMINAL');
    this.time = 0;
    this.accumulator = 0;
  }

  private loadBrowseContracts(selectedIndex = 0): void {
    this.phaseCompletion = null;
    this.clearActiveMission();
    this.worldTime = this.career.worldTime;
    this.phase = {
      kind: 'interactiveScene',
      scene: {
        id: 'browseContracts',
        selectedIndex,
        contracts: generateCareerContracts(this.career.locationId, this.career.worldTime),
      },
    };
    this.showGuidance('BROWSE CONTRACTS');
    this.time = 0;
    this.accumulator = 0;
  }

  private loadBrowsePassengerContracts(selectedIndex = 0): void {
    this.phaseCompletion = null;
    this.clearActiveMission();
    this.worldTime = this.career.worldTime;
    this.phase = {
      kind: 'interactiveScene',
      scene: {
        id: 'browsePassengerContracts',
        selectedIndex,
        board: 'passenger',
        contracts: generatePassengerContracts(this.career.locationId, this.career.worldTime),
      },
    };
    this.showGuidance('BROWSE PASSENGER CONTRACTS');
    this.time = 0;
    this.accumulator = 0;
  }

  private openContractPosting(contracts: CareerContract[], contractIndex: number, board: 'freight' | 'passenger' | 'contact' = 'freight', directoryEntryId?: string, directoryParentEntryId?: string): void {
    this.phase = { kind: 'interactiveScene', scene: { id: 'contractPosting', selectedIndex: 0, contracts, contractIndex, board, directoryEntryId, directoryParentEntryId } };
  }

  private resetCareer(): void {
    this.career = resetCareerProfile();
    this.loadStationTerminal();
  }

  private dynamicOrbitalStart(level: OrbitalLevel, time: number): OrbitalInitOverride {
    if (level.dynamicStartBodyId) {
      const state = bodyStateRelativeToParent(level.dynamicStartBodyId, time);
      return { x: state.x, y: state.y, vx: state.vx, vy: state.vy, time };
    }
    if (level.dynamicStartOrbit) {
      const orbit = level.dynamicStartOrbit;
      const omega = Math.sqrt(level.planetGM / Math.max(1, orbit.radius ** 3));
      const angle = orbit.epochAngle + orbit.orbitSense * omega * (time - orbit.epochTime) + (orbit.angleOffset ?? 0);
      const speed = Math.sqrt(level.planetGM / Math.max(1, orbit.radius));
      return {
        x: Math.cos(angle) * orbit.radius,
        y: Math.sin(angle) * orbit.radius,
        vx: -orbit.orbitSense * Math.sin(angle) * speed,
        vy: orbit.orbitSense * Math.cos(angle) * speed,
        time,
      };
    }
    return { x: level.startX, y: level.startY, vx: level.startVX, vy: level.startVY, time };
  }

  private loadOrbital(level: OrbitalLevel, initOverride?: OrbitalInitOverride, worldTimeStart: number = this.worldTime): void {
    const effectiveInit = initOverride ? { ...initOverride, time: initOverride.time ?? worldTimeStart } : this.dynamicOrbitalStart(level, worldTimeStart);
    const os = createOrbitalState(level, effectiveInit);
    const cam = createOrbitalCamera(level);
    if (initOverride) {
      if (level.systemBodies) {
        // Escapes into a parent/system transfer frame should start in the transfer map view,
        // not briefly inherit a ship-centered local camera from the child SOI.
        updateOrbitalCamera(cam, os, level, 10, this.canvas.width, this.canvas.height);
      } else {
        cam.x = os.x;
        cam.y = os.y;
      }
    }
    this.phaseCompletion = null;
    this.phase = { kind: 'orbital', level, os, cam, state: 'orbiting', initOverride: effectiveInit, worldTimeStart, missionDvStart: this.missionDvUsed };
    const guidance = level.station ? 'RENDEZVOUS WITH TARGET'
      : level.targetBodyId ? 'INTERCEPT TARGET BODY'
      : level.escapeSOIRadius ? 'ESCAPE TOWARD TARGET'
      : (level.showLandingSite === false ? 'MAINTAIN ORBITAL OBJECTIVE' : 'DEORBIT AND LAND NEAR THE LZ');
    this.showGuidance(guidance);
    this.time = 0;
    this.worldTime = worldTimeStart;
    this.accumulator = 0;
  }

  private showGuidance(text: string, duration = 4): void {
    this.guidanceText = text;
    this.guidanceUntil = performance.now() / 1000 + duration;
  }

  private drawGuidanceBanner(): void {
    const now = performance.now() / 1000;
    if (!this.guidanceText || now > this.guidanceUntil) return;
    const W = this.canvas.width;
    this.ctx.save();
    this.ctx.font = 'bold 18px monospace';
    this.ctx.textAlign = 'center';
    this.ctx.fillStyle = '#00ffcc';
    this.ctx.fillText(this.guidanceText, W / 2, 30);
    this.ctx.restore();
  }

  // --- Main loop ---

  private loop = (): void => {
    const now = performance.now() / 1000;
    let frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    if (frameTime > MAX_FRAME_TIME) frameTime = MAX_FRAME_TIME;

    const input = readInput();

    if (input.toggleDevPanel) toggleDevPanel();

    if (this.phaseCompletion) {
      if (input.reset) this.phaseCompletion.onRetry();
      else if (input.continueAction) this.phaseCompletion.onContinue();
      this.renderFrame();
      requestAnimationFrame(this.loop);
      return;
    }

    const p = this.phase;

    if (p.kind === 'startMenu') {
      this.handleStartMenu(input);
    } else if (p.kind === 'landing') {
      this.handleLanding(input, frameTime);
    } else if (p.kind === 'approach') {
      this.handleApproach(input, frameTime);
    } else if (p.kind === 'orbital') {
      this.handleOrbital(input, frameTime);
    } else if (p.kind === 'docking') {
      this.handleDocking(input, frameTime);
    } else if (p.kind === 'cluster') {
      this.handleCluster(input, frameTime);
    } else if (p.kind === 'flightMenu') {
      this.handleFlightMenu(input);
    } else if (p.kind === 'estellaNav') {
      this.handleEstellaNavigation(input);
    } else if (p.kind === 'estellaMission') {
      this.handleEstellaGeneratedMission(input);
    } else if (p.kind === 'interactiveScene') {
      this.handleInteractiveScene(input);
    } else if (p.kind === 'manualArticle') {
      this.handleManualArticle(input);
    }

    this.renderFrame();
    requestAnimationFrame(this.loop);
  };

  // --- Start menu / operating manual ---

  private handleManualArticle(input: InputState): void {
    const p = this.phase as Extract<Phase, { kind: 'manualArticle' }>;
    if (input.menuConfirm || (!p.tutorialSplash && input.levelSelect)) {
      this.phase = p.returnPhase;
      this.accumulator = 0;
    }
  }

  private handleStartMenu(input: InputState): void {
    if (!this.confirmingNewTeamsterReset && input.levelSelect && this.startMenuReturnPhase) {
      const returnPhase = this.startMenuReturnPhase;
      this.startMenuReturnPhase = null;
      this.phase = returnPhase;
      return;
    }

    if (this.confirmingNewTeamsterReset) {
      if (input.continueAction) {
        this.confirmingNewTeamsterReset = false;
        this.resetCareer();
        return;
      }
      if (input.levelSelect || input.menuLeft || input.reset) this.confirmingNewTeamsterReset = false;
      return;
    }

    if (this.menuSelection < 0 || this.menuSelection >= START_MENU_ITEMS) this.menuSelection = 0;
    if (input.menuUp) this.menuSelection = (this.menuSelection - 1 + START_MENU_ITEMS) % START_MENU_ITEMS;
    if (input.menuDown) this.menuSelection = (this.menuSelection + 1) % START_MENU_ITEMS;

    if (input.menuConfirm) {
      this.launchStartMenuItem(this.menuSelection);
      return;
    }

    if (input.levelPick >= 1 && input.levelPick <= START_MENU_ITEMS) {
      this.menuSelection = input.levelPick - 1;
      this.launchStartMenuItem(this.menuSelection);
    }
  }

  private launchStartMenuItem(index: number): void {
    this.startMenuReturnPhase = null;
    if (index === START_MENU_NEW_GAME_PLUS_INDEX) {
      this.showGuidance('NEW GAME+ IS NOT AVAILABLE YET');
      return;
    }
    if (index === 0) {
      this.loadStationTerminal();
      return;
    }
    if (index === 1) {
      this.confirmingNewTeamsterReset = true;
      return;
    }
    if (index === 3) {
      this.clearActiveMission();
      this.phaseCompletion = null;
      this.missionDvUsed = 0;
      this.loadEstellaNavigation();
      return;
    }
    if (index === START_MENU_OPERATIONS_MANUAL_INDEX) {
      this.phaseCompletion = null;
      this.phase = { kind: 'interactiveScene', scene: { id: 'operationsManual', selectedIndex: 0 } };
    }
  }

  private handleFlightMenu(input: InputState): void {
    const p = this.phase as Extract<Phase, { kind: 'flightMenu' }>;
    if (this.flightMenuSelection < 0 || this.flightMenuSelection >= FLIGHT_MENU_ITEMS) this.flightMenuSelection = 0;
    if (input.menuUp) this.flightMenuSelection = (this.flightMenuSelection - 1 + FLIGHT_MENU_ITEMS) % FLIGHT_MENU_ITEMS;
    if (input.menuDown) this.flightMenuSelection = (this.flightMenuSelection + 1) % FLIGHT_MENU_ITEMS;
    if (input.levelSelect || input.menuLeft) {
      this.phase = p.previous;
      return;
    }
    if (!input.menuConfirm && !(input.levelPick >= 1 && input.levelPick <= FLIGHT_MENU_ITEMS)) return;
    if (input.levelPick >= 1 && input.levelPick <= FLIGHT_MENU_ITEMS) this.flightMenuSelection = input.levelPick - 1;
    this.launchFlightMenuItem(this.flightMenuSelection, p.previous);
  }

  private launchFlightMenuItem(index: number, previous: GameplayPhase): void {
    if (index === FLIGHT_MENU_SHIPBOARD_TERMINAL_INDEX) {
      this.showGuidance('SHIPBOARD TERMINAL IS NOT INSTALLED YET');
      return;
    }
    if (index === 0) {
      this.phase = previous;
      return;
    }
    if (index === 1) {
      this.reloadPhase(previous);
      return;
    }
    if (index === 2) {
      this.restartWholeMission(previous);
      return;
    }
    if (index === 4) this.quitToStartMenu();
  }

  private openFlightMenu(previous: GameplayPhase): void {
    this.phaseCompletion = null;
    this.flightMenuSelection = 0;
    this.phase = { kind: 'flightMenu', previous };
    this.accumulator = 0;
  }

  private clearActiveMission(): void {
    this.activeMissionQuote = null;
    this.activeMissionTransfer = undefined;
    this.activeMissionSourceId = null;
    this.activeMissionDestinationId = null;
    this.activeCareerContract = null;
    this.localTransferTutorialShown = false;
  }

  private quitToStartMenu(): void {
    this.phaseCompletion = null;
    this.startMenuReturnPhase = null;
    this.clearActiveMission();
    this.missionDvUsed = 0;
    this.phase = { kind: 'startMenu' };
    this.accumulator = 0;
  }

  private restartWholeMission(fallback: GameplayPhase): void {
    if (this.activeMissionSourceId && this.activeMissionDestinationId) {
      const sourceId = this.activeMissionSourceId;
      const destinationId = this.activeMissionDestinationId;
      const startWorldTime = this.activeMissionStartWorldTime;
      const selectedTransfer = this.activeMissionTransfer;
      this.launchPlayableEstellaMission(sourceId, destinationId, startWorldTime, selectedTransfer);
      return;
    }
    this.reloadPhase(fallback);
  }

  private phaseDvUsed(p: GameplayPhase): number {
    switch (p.kind) {
      case 'landing': return p.ship.dvUsed;
      case 'approach': return p.as.dvUsed;
      case 'orbital': return p.os.dvUsed;
      case 'docking': return p.ds.dvUsed;
      case 'cluster': return p.cs.dvUsed;
    }
  }

  private missionDvForPhase(p: GameplayPhase): number {
    return p.missionDvStart + this.phaseDvUsed(p);
  }

  private phaseTitle(p: GameplayPhase): string {
    if (p.kind === 'landing') {
      return p.launchGuidance ? `Launch from ${p.level.name}` : (p.level.subtitle || p.level.name);
    }
    if (p.kind === 'orbital' && p.level.subtitle === 'Generated Estella transfer') return p.level.name;
    return p.level.subtitle || p.level.name;
  }

  private orbitalObjectiveLabel(level: OrbitalLevel): string {
    if (level.station?.name) return `${level.station.name} rendezvous`;
    if (level.targetBodyId) {
      const body = getTransferBody(level, level.targetBodyId);
      return `${body?.name ?? level.nextObjectiveName ?? 'target'} approach`;
    }
    if (level.escapeToOrbitalLevelId) return `${bodyById(level.bodyId).name} outbound transfer`;
    if (level.finalDestinationName) return level.finalDestinationName;
    return `${bodyById(level.bodyId).name} orbital traffic`;
  }

  private currentMissionCompletionText(): string {
    if (this.activeCareerContract) return this.activeCareerContract.completionMessage;
    return 'Delivery complete. Dispatch closes the manifest and posts the run to your log.';
  }

  private currentMissionDestinationName(): string | undefined {
    if (this.activeCareerContract) return this.activeCareerContract.destinationName;
    return undefined;
  }

  private currentMissionDestinationLocation(): string | undefined {
    if (this.activeCareerContract) return this.activeCareerContract.destinationPath;
    return undefined;
  }

  private currentMissionParDv(): number {
    return this.activeMissionQuote?.parDv ?? 0;
  }

  private hasCareerProgress(): boolean {
    return this.career.locationId !== CAREER_START_LOCATION_ID || this.career.money !== 0 || this.career.worldTime !== 0;
  }

  private campaignActionLabel(): string {
    return this.hasCareerProgress() ? 'Continue Campaign' : 'Begin Campaign';
  }

  private isOrbitalDeorbitObjective(level: OrbitalLevel): boolean {
    return !level.station && !level.targetBodyId && level.showLandingSite !== false;
  }

  private reloadPhase(p: GameplayPhase): void {
    this.phaseCompletion = null;
    this.missionDvUsed = p.missionDvStart;
    if (p.kind === 'landing') this.loadLanding(p.level, p.initOverride, p.launchGuidance, p.worldTimeStart);
    else if (p.kind === 'approach') this.loadApproach(p.level, p.initOverride, p.worldTimeStart);
    else if (p.kind === 'orbital') this.loadOrbital(p.level, p.initOverride, p.worldTimeStart);
    else if (p.kind === 'docking') this.loadDocking(p.level, p.initOverride, p.worldTimeStart);
    else this.loadCluster(p.level, p.initOverride, p.worldTimeStart);
  }

  private completePhase(
    p: GameplayPhase,
    onContinue: () => void,
    completionText: string = '',
    extra: Partial<Pick<PhaseCompletion, 'ratingText' | 'ratingColor' | 'detailText' | 'tone' | 'title'>> & Pick<PhaseTransition, 'billableDvAdjustment' | 'adjustmentLabel'> = {},
  ): void {
    const phaseDvUsed = this.phaseDvUsed(p) + (extra.billableDvAdjustment ?? 0);
    const missionDvUsed = p.missionDvStart + phaseDvUsed;
    this.missionDvUsed = missionDvUsed;
    const detailLines: string[] = [];
    if (extra.detailText) detailLines.push(extra.detailText);
    if (extra.billableDvAdjustment && extra.billableDvAdjustment > 0) {
      detailLines.push(`${extra.adjustmentLabel ?? 'Billable correction'}: +${extra.billableDvAdjustment.toFixed(0)} m/s`);
    }
    if (completionText && this.activeMissionQuote) {
      detailLines.push(formatMissionResultLine(this.activeMissionQuote, missionDvUsed));
    }
    const detailText = detailLines.join('\n');
    this.guidanceText = '';
    const finalContractTitle = completionText && this.activeCareerContract ? this.activeCareerContract.title : undefined;
    this.phaseCompletion = {
      title: finalContractTitle ?? extra.title ?? this.phaseTitle(p),
      tone: extra.tone ?? 'success',
      phaseDvUsed,
      missionDvUsed,
      completionText,
      ...extra,
      detailText,
      onContinue: () => {
        this.phaseCompletion = null;
        onContinue();
      },
      onRetry: () => this.reloadPhase(p),
    };
    this.accumulator = 0;
  }

  private makeTransition(role: TransitionRole, run: () => void, title?: string, detailText?: string, billableDvAdjustment?: number, adjustmentLabel?: string): PhaseTransition {
    return { role, run, title, detailText, billableDvAdjustment, adjustmentLabel };
  }

  private finishCareerDelivery(): void {
    const contract = this.activeCareerContract;
    const quote = this.activeMissionQuote;
    if (!contract || !quote) return;
    this.career.money += contractPayoutForQuote(quote, this.missionDvUsed) - actualFuelCostForQuote(quote, this.missionDvUsed);
    this.career.locationId = contract.destinationId;
    this.career.worldTime = this.worldTime;
    if (contract.certificationStageOnSuccess !== undefined) {
      this.career.basicCertificationStage = Math.max(this.career.basicCertificationStage, contract.certificationStageOnSuccess);
    }
    saveCareerProfile(this.career);
    this.loadStationTerminal();
  }

  private logSuccessfulGeneratedRun(): void {
    const quote = this.activeMissionQuote;
    if (!quote) return;
    appendMissionProfile(createMissionProfileEntry({
      mode: this.activeCareerContract ? 'career' : 'mission8',
      quote,
      actualDv: this.missionDvUsed,
      startWorldTime: this.activeMissionStartWorldTime,
      completionWorldTime: this.worldTime,
      selectedTransfer: this.activeMissionTransfer,
      careerContract: this.activeCareerContract,
    }));
  }

  private finishRunTransition(): PhaseTransition {
    return this.makeTransition('success', () => {
      this.logSuccessfulGeneratedRun();
      if (this.activeCareerContract) {
        this.finishCareerDelivery();
        return;
      }
      this.clearActiveMission();
      this.phase = { kind: 'startMenu' };
    });
  }

  private completeTransition(
    p: GameplayPhase,
    transition: PhaseTransition,
    completionText: string = '',
    extra: Partial<Pick<PhaseCompletion, 'ratingText' | 'ratingColor' | 'detailText' | 'tone' | 'title'>> = {},
  ): void {
    const transitionExtra: Partial<Pick<PhaseCompletion, 'ratingText' | 'ratingColor' | 'detailText' | 'tone' | 'title'>> & Pick<PhaseTransition, 'billableDvAdjustment' | 'adjustmentLabel'> = {
      tone: transition.role === 'contingency' ? 'transition' : 'success',
      billableDvAdjustment: transition.billableDvAdjustment,
      adjustmentLabel: transition.adjustmentLabel,
    };
    if (transition.title !== undefined || transition.role === 'contingency') transitionExtra.title = transition.title ?? this.phaseTitle(p);
    if (transition.detailText !== undefined) transitionExtra.detailText = transition.detailText;
    this.completePhase(p, transition.run, completionText, { ...transitionExtra, ...extra });
  }

  // --- Landing phase ---

  private handleLanding(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'landing' }>;

    if (input.reset) { this.reloadPhase(p); return; }
    if (input.levelSelect) { this.openFlightMenu(p); return; }
    if (input.toggleGear && p.state === 'flying') {
      p.ship.gearDeployed = !p.ship.gearDeployed;
      p.ship.autoRotateEnabled = true;
    }
    if (input.toggleSAS && p.state === 'flying') {
      p.ship.sas = !p.ship.sas;
    }

    input.toggleGear = false;
    input.toggleSAS = false;
    input.reset = false;
    input.levelSelect = false;
    input.levelPick = 0;

    this.accumulator += frameTime;
    while (this.accumulator >= PHYSICS_DT) {
      if (p.state === 'flying') {
        if (this.shouldHoldLaunchOnPad(p, input)) {
          this.clampLaunchShipToPad(p);
        } else {
          updateShip(p.ship, input, PHYSICS_DT, this.time);
          this.checkLandingCollision(p);
        }
        if (!p.launchGuidance && (p.state as GameState) === 'landed') {
          const ratingColors = { PERFECT: '#00ffff', GOOD: '#00ff88', HARD: '#ffaa00' } as const;
          const score = p.score ?? calculateLandingScore(p.ship, p.terrain);
          this.completePhase(
            p,
            this.finishRunTransition().run,
            this.currentMissionCompletionText(),
            {
              ratingText: score.rating,
              ratingColor: ratingColors[score.rating],
              detailText: `V/S: ${score.vSpeed.toFixed(1)}  H/S: ${score.hSpeed.toFixed(1)}  Angle: ${(score.angle * 180 / Math.PI).toFixed(1)}°  Offset: ${score.distFromCenter.toFixed(1)}m`,
            },
          );
          return;
        }
        if (p.launchGuidance && p.state === 'flying') {
          const alt = p.ship.y - landingReferenceHeight(p.level, p.terrain, p.ship.x);
          if (alt >= p.launchGuidance.targetAltitude && p.ship.vy >= 0) {
            const transition = this.transitionLandingToApproach(p);
            if (transition) this.completeTransition(p, transition);
            else p.state = 'crashed';
            return;
          }
        }
        const refY = landingReferenceHeight(p.level, p.terrain, p.level.padCenterX);
        if (p.ship.y < refY - 500 || p.ship.y > refY + 2000 || p.ship.x < -200 || p.ship.x > 2200) {
          p.state = 'crashed';
        }
      }
      this.accumulator -= PHYSICS_DT;
      this.time += PHYSICS_DT;
      this.worldTime += PHYSICS_DT;
    }

    const th = landingReferenceHeight(p.level, p.terrain, p.ship.x);
    updateCamera(p.camera, p.ship, th, frameTime);
  }

  private checkLandingCollision(p: Extract<Phase, { kind: 'landing' }>): void {
    const pts = [...COLLISION_POINTS, ...(p.ship.gearDeployed ? GEAR_COLLISION_POINTS : [])];
    for (const [lx, ly] of pts) {
      const [wx, wy] = localToWorld(lx, ly, p.ship.x, p.ship.y, p.ship.angle, p.ship.facingSign);
      const collision = checkTerrainCollision(p.level, p.terrain, wx, wy);
      if (collision.hit) {
        if (!collision.onPad) { p.state = 'crashed'; return; }
        const vs = Math.abs(p.ship.vy), hs = Math.abs(p.ship.vx), ang = Math.abs(p.ship.angle);
        if (vs <= config.landingMaxVSpeed && hs <= config.landingMaxHSpeed &&
            ang <= config.landingMaxAngle && p.ship.gearDeployed) {
          if (p.launchGuidance) {
            const groundY = landingReferenceHeight(p.level, p.terrain, p.ship.x);
            p.ship.vx = 0; p.ship.vy = 0; p.ship.angularVel = 0; p.ship.angle = 0;
            p.ship.y = groundY + LANDING_GEAR_REST_HEIGHT;
            p.ship.sas = false;
          } else {
            p.state = 'landed';
            p.score = calculateLandingScore(p.ship, p.terrain);
            p.ship.vx = 0; p.ship.vy = 0; p.ship.angularVel = 0;
            p.ship.sas = false;
          }
        } else {
          p.state = 'crashed';
        }
        return;
      }
    }
  }

  private shouldHoldLaunchOnPad(
    p: Extract<Phase, { kind: 'landing' }>,
    input: InputState,
  ): boolean {
    if (!p.launchGuidance) return false;
    const onPad = isOnPad(p.terrain, p.ship.x);
    if (!onPad) return false;
    const groundY = landingReferenceHeight(p.level, p.terrain, p.ship.x);
    const grounded = Math.abs(p.ship.y - (groundY + LANDING_GEAR_REST_HEIGHT)) < 0.2;
    const settled = Math.abs(p.ship.vx) < 0.2 && Math.abs(p.ship.vy) < 0.2 && Math.abs(p.ship.angularVel) < 0.05 && Math.abs(p.ship.angle) < 0.05;
    const holding = !input.throttleUp && p.ship.throttle < 0.05;
    return grounded && settled && holding;
  }

  private clampLaunchShipToPad(p: Extract<Phase, { kind: 'landing' }>): void {
    const groundY = landingReferenceHeight(p.level, p.terrain, p.ship.x);
    p.ship.x = p.level.padCenterX;
    p.ship.y = groundY + LANDING_GEAR_REST_HEIGHT;
    p.ship.vx = 0;
    p.ship.vy = 0;
    p.ship.angle = 0;
    p.ship.angularVel = 0;
    p.ship.throttle = 0;
    p.ship.sas = false;
  }

  // --- Docking phase ---

  private handleDocking(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'docking' }>;

    if (input.reset) { this.reloadPhase(p); return; }
    if (input.levelSelect) { this.openFlightMenu(p); return; }

    input.reset = false;
    input.levelSelect = false;

    this.accumulator += frameTime;
    while (this.accumulator >= PHYSICS_DT) {
      if (p.state === 'docking') {
        updateDocking(p.ds, input, p.level, PHYSICS_DT);
        input.toggleSAS = false;
        if (!p.ds.alive) p.state = 'crashed';
        if (p.ds.delivered) {
          p.state = 'delivered';
          const isFinal = !p.level.orbitalLevelId && !p.level.clusterLevelId;
          const transition = p.level.clusterLevelId
            ? this.transitionDockingToCluster(p)
            : p.level.orbitalLevelId
              ? this.transitionDockingToOrbital(p)
              : this.finishRunTransition();
          if (transition) this.completeTransition(p, transition, isFinal ? this.currentMissionCompletionText() : '');
          else p.state = 'crashed';
          return;
        }
        if (p.ds.exitComplete) {
          const transition = p.level.clusterLevelId ? this.transitionDockingToCluster(p) : this.transitionDockingToOrbital(p);
          if (transition) this.completeTransition(p, transition);
          else p.state = 'crashed';
          return;
        }
      }
      this.accumulator -= PHYSICS_DT;
      this.time += PHYSICS_DT;
      this.worldTime += PHYSICS_DT;
    }

    updateDockingCamera(p.cam, p.ds, p.level, frameTime, this.canvas.width, this.canvas.height);
  }

  private transitionDockingToOrbital(p: Extract<Phase, { kind: 'docking' }>): PhaseTransition | null {
    if (!p.level.orbitalLevelId) return null;
    const orbLevel = orbitalLevelById(p.level.orbitalLevelId);
    if (!orbLevel) return null;
    return this.makeTransition('success', () => this.loadOrbital(orbLevel, undefined, this.worldTime), `Cleared ${p.level.name}`, `Proceed to ${this.orbitalObjectiveLabel(orbLevel)}.`);
  }

  private transitionDockingToCluster(p: Extract<Phase, { kind: 'docking' }>): PhaseTransition | null {
    if (!p.level.clusterLevelId) return null;
    const clusterLevel = clusterLevelById(p.level.clusterLevelId);
    if (!clusterLevel) return null;
    const member = clusterMemberById(clusterLevel, p.level.clusterMemberId);
    const init = member ? this.clusterInitFromDocking(p, member.x, member.y) : undefined;
    return this.makeTransition('success', () => this.loadCluster(clusterLevel, init, this.worldTime), `Cleared ${p.level.name}`, `Entering ${clusterLevel.name} local traffic.`);
  }

  // --- Cluster phase ---

  private handleCluster(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'cluster' }>;

    if (input.reset) { this.reloadPhase(p); return; }
    if (input.levelSelect) { this.openFlightMenu(p); return; }

    input.reset = false;
    input.levelSelect = false;

    if (input.warpUp) p.cs.timeWarpLevel = Math.min(p.cs.timeWarpLevel + 1, p.level.timeWarpLevels.length - 1);
    if (input.warpDown) p.cs.timeWarpLevel = Math.max(p.cs.timeWarpLevel - 1, 0);
    p.cs.timeWarp = p.level.timeWarpLevels[p.cs.timeWarpLevel] ?? 1;
    if ((input.moveUp || input.moveDown || input.moveLeft || input.moveRight) && p.cs.timeWarpLevel > 0) {
      p.cs.timeWarpLevel = 0;
      p.cs.timeWarp = p.level.timeWarpLevels[0] ?? 1;
    }
    input.warpUp = false;
    input.warpDown = false;

    const effectiveFrameTime = frameTime * p.level.baseTimeScale * p.cs.timeWarp;
    this.accumulator += effectiveFrameTime;
    while (this.accumulator >= PHYSICS_DT) {
      if (p.state === 'flying') {
        updateCluster(p.cs, input, p.level, PHYSICS_DT);
        input.toggleSAS = false;
        if (!p.cs.alive) p.state = 'crashed';
        if (p.cs.escaped) {
          const transition = this.transitionClusterToOrbital(p);
          if (transition) this.completeTransition(p, transition);
          else p.state = 'crashed';
          return;
        }
        if (p.cs.arrived) {
          p.state = 'arrived';
          const transition = p.level.dockingLevelId
            ? this.transitionClusterToDocking(p)
            : this.finishRunTransition();
          if (transition) this.completeTransition(p, transition, p.level.dockingLevelId ? '' : this.currentMissionCompletionText());
          else p.state = 'crashed';
          return;
        }
      }
      this.accumulator -= PHYSICS_DT;
      this.time += PHYSICS_DT;
      this.worldTime += PHYSICS_DT;
    }

    updateClusterCamera(p.cam, p.cs, p.level, effectiveFrameTime, this.canvas.width, this.canvas.height);
  }

  private transitionClusterToOrbital(p: Extract<Phase, { kind: 'cluster' }>): PhaseTransition | null {
    if (!p.level.escapeToOrbitalLevelId || !p.level.clusterBodyId) return null;
    const nextLevel = orbitalLevelById(p.level.escapeToOrbitalLevelId);
    if (!nextLevel) return null;
    const clusterState = bodyStateRelativeToParent(p.level.clusterBodyId, this.worldTime);
    const init: OrbitalInitOverride = {
      x: clusterState.x,
      y: clusterState.y,
      vx: clusterState.vx + p.cs.vx,
      vy: clusterState.vy + p.cs.vy,
      time: this.worldTime,
    };
    return this.makeTransition('success', () => this.loadOrbital(nextLevel, init, this.worldTime), `Cleared ${p.level.name}`, `Proceed to ${this.orbitalObjectiveLabel(nextLevel)}.`);
  }

  private transitionClusterToDocking(p: Extract<Phase, { kind: 'cluster' }>): PhaseTransition | null {
    if (!p.level.dockingLevelId) return null;
    const dockingLevel = DOCKING_LEVELS.find(level => level.id === p.level.dockingLevelId);
    if (!dockingLevel) return null;
    const init = this.dockingInitFromCluster(p, dockingLevel);
    return this.makeTransition('success', () => this.loadDocking(dockingLevel, init, this.worldTime), 'Berth approach complete', `Arrived at ${dockingLevel.name}.`);
  }

  private clusterInitFromDocking(p: Extract<Phase, { kind: 'docking' }>, memberX: number, memberY: number): ClusterInitOverride {
    const dx = p.ds.x - p.level.stationX;
    const dy = p.ds.y - p.level.stationY;
    const dist = Math.hypot(dx, dy);
    const ux = dist > 1 ? dx / dist : Math.sin(p.ds.angle);
    const uy = dist > 1 ? dy / dist : Math.cos(p.ds.angle);
    const clusterLevel = p.level.clusterLevelId ? clusterLevelById(p.level.clusterLevelId) : undefined;
    const departRadius = clusterLevel?.captureRadius ?? Math.max(dist, 1);
    return {
      x: memberX + ux * departRadius,
      y: memberY + uy * departRadius,
      vx: p.ds.vx,
      vy: p.ds.vy,
      angle: Math.PI / 2 - p.ds.angle,
    };
  }

  private dockingInitFromCluster(p: Extract<Phase, { kind: 'cluster' }>, dockingLevel: DockingLevel): DockingInitOverride | undefined {
    const target = targetPort(p.level);
    if (!target) return undefined;
    const bay = dockingLevel.bays.find(b => b.isTarget);
    if (!bay) return undefined;
    const bp = bayWorldPos(bay, dockingLevel.stationX, dockingLevel.stationY);
    const relX = p.cs.x - target.member.x;
    const relY = p.cs.y - target.member.y;
    const relDist = Math.hypot(relX, relY);
    const ux = relDist > 1 ? relX / relDist : Math.cos(bp.angle);
    const uy = relDist > 1 ? relY / relDist : Math.sin(bp.angle);
    const arrivalRingR = 180;
    const relSpeed = Math.hypot(p.cs.vx, p.cs.vy);
    const radialSpeed = p.cs.vx * ux + p.cs.vy * uy;
    const safeVx = p.cs.vx - ux * Math.min(0, radialSpeed);
    const safeVy = p.cs.vy - uy * Math.min(0, radialSpeed);
    return {
      x: dockingLevel.stationX + ux * arrivalRingR,
      y: dockingLevel.stationY + uy * arrivalRingR,
      vx: relSpeed > 0 ? safeVx : 0,
      vy: relSpeed > 0 ? safeVy : 0,
      angle: Math.PI / 2 - p.cs.angle,
    };
  }

  // --- Orbital phase ---

  private handleOrbital(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'orbital' }>;

    if (input.reset) { this.reloadPhase(p); return; }
    if (input.levelSelect) { this.openFlightMenu(p); return; }

    input.reset = false;
    input.levelSelect = false;

    this.accumulator += frameTime;
    while (this.accumulator >= PHYSICS_DT) {
      if (p.state === 'orbiting') {
        const prevOrbitalState = {
          x: p.os.x,
          y: p.os.y,
          vx: p.os.vx,
          vy: p.os.vy,
          time: p.os.time,
        };
        updateOrbital(p.os, input, p.level, PHYSICS_DT);
        // Clear edge triggers after first step
        input.warpUp = false;
        input.warpDown = false;

        if (!p.os.alive) p.state = 'crashed';
        if (p.os.docked) {
          if (p.level.dockingLevelId) {
            const transition = this.transitionOrbitalToDocking(p);
            if (transition) this.completeTransition(p, transition);
            else p.state = 'crashed';
            return;
          }
          p.state = 'docked';
        }
        const orbitalContinue = this.handleOrbitalTransitions(p, prevOrbitalState);
        if (orbitalContinue) {
          this.completeTransition(p, orbitalContinue);
          return;
        }
        if (p.os.enteredAtmo) {
          const role: TransitionRole = this.isOrbitalDeorbitObjective(p.level) ? 'success' : 'contingency';
          const transition = this.transitionOrbitalToApproach(p, role);
          if (transition) this.completeTransition(p, transition);
          else p.state = 'crashed';
          return;
        }
      }
      this.accumulator -= PHYSICS_DT;
      this.time += PHYSICS_DT;
      this.worldTime += PHYSICS_DT;
    }

    updateOrbitalCamera(p.cam, p.os, p.level, frameTime, this.canvas.width, this.canvas.height);
  }

  private handleOrbitalTransitions(
    p: Extract<Phase, { kind: 'orbital' }>,
    prev?: { x: number; y: number; vx: number; vy: number; time: number },
  ): PhaseTransition | null {
    const rFromCenter = Math.sqrt(p.os.x * p.os.x + p.os.y * p.os.y);
    const escapeBoundary = p.level.escapeSOIRadius ?? p.level.conicRadius;
    if (!p.level.systemBodies && escapeBoundary && !p.level.escapeToOrbitalLevelId && rFromCenter >= escapeBoundary) {
      return this.makeTransition('contingency', () => this.phase = { kind: 'startMenu' }, 'Left flight region', 'No configured transition exists beyond this conic.');
    }

    if (p.level.escapeSOIRadius && p.level.escapeToOrbitalLevelId) {
      const r = rFromCenter;
      if (r >= p.level.escapeSOIRadius) {
        const nextLevel = orbitalLevelById(p.level.escapeToOrbitalLevelId);
        if (!nextLevel) return null;
        const parentBodyId = bodyById(p.level.bodyId).orbit?.parentBodyId;
        const nextContainsEscapingBody = !!getTransferBody(nextLevel, p.level.bodyId);
        const nextIsParentFrame = !!parentBodyId && nextLevel.bodyId === parentBodyId;
        if (!nextContainsEscapingBody && !nextIsParentFrame) return null;
        const originState = transferBodyState(nextLevel, p.level.bodyId, p.os.time)
          ?? (nextIsParentFrame ? bodyStateRelativeToParent(p.level.bodyId, p.os.time) : null);
        if (!originState) return null;
        const escape = currentEscapeVector(p.os, p.level);
        const localSpeed = Math.sqrt(p.os.vx * p.os.vx + p.os.vy * p.os.vy);
        if (!escape && localSpeed < 0.01) return null;
        const handoffAngle = escape?.angle ?? Math.atan2(p.os.vy, p.os.vx);
        const handoffVInf = escape?.vInf ?? 0;
        const minEscapeSpeed = p.level.escapeSOIRadius
          ? Math.sqrt(2 * p.level.planetGM / p.level.escapeSOIRadius)
          : 0;
        const minimumEscapeBoostDv = escape ? 0 : Math.max(0, minEscapeSpeed - localSpeed);
        const initOverride: OrbitalInitOverride = {
          x: originState.x,
          y: originState.y,
          vx: originState.vx + Math.cos(handoffAngle) * handoffVInf,
          vy: originState.vy + Math.sin(handoffAngle) * handoffVInf,
          time: p.os.time,
        };
        const originName = bodyById(p.level.bodyId).name;
        const targetName = p.level.escapeTargetBodyId
          ? (getTransferBody(nextLevel, p.level.escapeTargetBodyId)?.name ?? bodyById(p.level.escapeTargetBodyId).name)
          : (nextLevel.targetBodyId ? (getTransferBody(nextLevel, nextLevel.targetBodyId)?.name ?? nextLevel.nextObjectiveName) : undefined);
        const detail = targetName
          ? `Transfer established: ${originName} → ${targetName}.`
          : `Entered ${bodyById(nextLevel.bodyId).name} transfer frame.`;
        return this.makeTransition('success', () => this.loadOrbital(nextLevel, initOverride, p.os.time), `Departed ${originName} SOI`, detail, minimumEscapeBoostDv, 'Minimum escape boost');
      }
    }

    if (p.level.targetBodyId) {
      const body = getTransferBody(p.level, p.level.targetBodyId);
      const bodyState = body ? transferBodyState(p.level, body.id, p.os.time) : null;
      if (!body || !bodyState) return null;

      let captureRX = p.os.x - bodyState.x;
      let captureRY = p.os.y - bodyState.y;
      let captureRVX = p.os.vx - bodyState.vx;
      let captureRVY = p.os.vy - bodyState.vy;
      let captureTime = p.os.time;
      let captureDist = Math.sqrt(captureRX * captureRX + captureRY * captureRY);
      let arrivalReady = captureDist <= body.patchRadius;

      if (!arrivalReady && p.os.pendingBodyCapture?.bodyId === body.id) {
        captureRX = p.os.pendingBodyCapture.rx;
        captureRY = p.os.pendingBodyCapture.ry;
        captureRVX = p.os.pendingBodyCapture.rvx;
        captureRVY = p.os.pendingBodyCapture.rvy;
        captureTime = p.os.pendingBodyCapture.time;
        captureDist = Math.sqrt(captureRX * captureRX + captureRY * captureRY);
        arrivalReady = captureDist <= body.patchRadius;
      }

      if (!arrivalReady && prev) {
        const prevBodyState = transferBodyState(p.level, body.id, prev.time);
        if (prevBodyState) {
          const prevRX = prev.x - prevBodyState.x;
          const prevRY = prev.y - prevBodyState.y;
          const prevDist = Math.sqrt(prevRX * prevRX + prevRY * prevRY);
          if (prevDist > body.patchRadius && captureDist <= body.patchRadius) {
            const denom = captureDist - prevDist;
            const frac = Math.max(0, Math.min(1, (body.patchRadius - prevDist) / (Math.abs(denom) > 1e-6 ? denom : -1e-6)));
            captureTime = prev.time + (p.os.time - prev.time) * frac;
            const shipX = prev.x + (p.os.x - prev.x) * frac;
            const shipY = prev.y + (p.os.y - prev.y) * frac;
            const shipVX = prev.vx + (p.os.vx - prev.vx) * frac;
            const shipVY = prev.vy + (p.os.vy - prev.vy) * frac;
            const crossBodyState = transferBodyState(p.level, body.id, captureTime);
            if (crossBodyState) {
              captureRX = shipX - crossBodyState.x;
              captureRY = shipY - crossBodyState.y;
              captureRVX = shipVX - crossBodyState.vx;
              captureRVY = shipVY - crossBodyState.vy;
              captureDist = Math.sqrt(captureRX * captureRX + captureRY * captureRY);
              arrivalReady = true;
            }
          }
        }
      }

      if (!arrivalReady) return null;
      const captureRelSpeed = Math.hypot(captureRVX, captureRVY);
      if (body.captureMaxSpeed !== undefined && captureRelSpeed > body.captureMaxSpeed) return null;

      if (body.arrivalClusterLevelId) {
        const clusterLevel = clusterLevelById(body.arrivalClusterLevelId);
        if (!clusterLevel) return null;
        const nx = captureRX / Math.max(body.patchRadius, 1);
        const ny = captureRY / Math.max(body.patchRadius, 1);
        const norm = Math.hypot(nx, ny);
        const scale = norm > 0.92 ? 0.92 / norm : 1;
        const initOverride: ClusterInitOverride = {
          x: nx * scale * clusterLevel.rx,
          y: ny * scale * clusterLevel.ry,
          vx: captureRVX,
          vy: captureRVY,
          angle: Math.atan2(Math.cos(p.os.renderAngle), Math.sin(p.os.renderAngle)),
        };
        return this.makeTransition('success', () => this.loadCluster(clusterLevel, initOverride, captureTime), `${body.name} approach acquired`, `Arrived in ${clusterLevel.name} local traffic.`);
      }

      const arrivalLevelId = body.arrivalOrbitalLevelId;
      const arrivalLevel = arrivalLevelId ? orbitalLevelById(arrivalLevelId) : null;
      if (!arrivalLevel || arrivalLevel.bodyId !== body.id) return null;

      const arrival = fuzzyArrivalStateFromEntry(body, captureRX, captureRY, captureRVX, captureRVY);
      const initOverride: OrbitalInitOverride = {
        x: arrival.x,
        y: arrival.y,
        vx: arrival.vx,
        vy: arrival.vy,
        time: captureTime,
      };
      const detail = arrivalLevel.finalDestinationName
        ? `Capture corridor established for ${arrivalLevel.finalDestinationName}.`
        : `Capture corridor established around ${body.name}.`;
      return this.makeTransition('success', () => this.loadOrbital(arrivalLevel, initOverride, captureTime), `${body.name} approach acquired`, detail);
    }

    return null;
  }

  private transitionLandingToApproach(p: Extract<Phase, { kind: 'landing' }>): PhaseTransition | null {
    const nextId = p.launchGuidance?.nextApproachLevelId;
    const approachLevel = nextId ? approachLevelById(nextId) : undefined;
    if (!approachLevel || !approachLevel.departure || approachLevel.body.id !== p.level.body.id) return null;

    const speed = Math.hypot(p.ship.vx, p.ship.vy);
    const progradeAngle = speed > 0.1 ? Math.atan2(p.ship.vx, p.ship.vy) : p.ship.angle;
    const initOverride: ApproachInitOverride = {
      x: p.ship.x - p.level.padCenterX,
      y: Math.max(0, p.ship.y),
      vx: p.ship.vx,
      vy: p.ship.vy,
      angle: progradeAngle,
    };
    return this.makeTransition('success', () => this.loadApproach(approachLevel, initOverride), `Cleared ${p.level.name}`, `Entering ${approachLevel.body.name} departure corridor.`);
  }

  private transitionApproachToLanding(p: Extract<Phase, { kind: 'approach' }>): PhaseTransition | null {
    const landingLevel = landingLevelById(p.level.landingLevelId);
    if (!landingLevel || landingLevel.body.id !== p.level.body.id) return null;

    if (p.level.gateRadius > 0) {
      const gateLeft = p.level.gateX - p.level.gateRadius;
      const gateWidth = Math.max(1, p.level.gateRadius * 2);
      const nx = Math.max(0, Math.min(1, (p.as.x - gateLeft) / gateWidth));
      const ny = Math.max(0, Math.min(1, p.as.y / Math.max(1, p.level.gateY)));

      const landingHalfSpan = 500;
      const landingAltMin = 100;
      const landingAltMax = 300;
      const noseX = Math.sin(p.as.angle);
      const facingSign: 1 | -1 = Math.abs(noseX) > 0.05 ? (noseX > 0 ? 1 : -1) : (p.as.vx < 0 ? -1 : 1);
      const initOverride = {
        x: landingLevel.padCenterX + (nx * 2 - 1) * landingHalfSpan,
        y: landingLevel.padY + (landingAltMin + ny * (landingAltMax - landingAltMin)),
        vx: Math.max(-20, Math.min(20, p.as.vx)),
        vy: Math.max(-5, Math.min(20, p.as.vy)),
        facingSign,
      };
      return this.makeTransition('success', () => this.loadLanding(landingLevel, initOverride), 'Final approach established', `Landing zone: ${landingLevel.name}.`);
    }

    const speed = Math.sqrt(p.as.vx * p.as.vx + p.as.vy * p.as.vy);
    const maxEntrySpeed = 50;
    let vx = p.as.vx;
    let vy = p.as.vy;
    if (speed > maxEntrySpeed) {
      const scale = maxEntrySpeed / speed;
      vx *= scale;
      vy *= scale;
    }
    const targetAlt = landingLevel.startY;
    const startY = Math.max(landingLevel.padY + targetAlt * 0.5, Math.min(p.as.y, landingLevel.padY + targetAlt));
    vy = Math.max(vy, -10);

    const noseX = Math.sin(p.as.angle);
    const facingSign: 1 | -1 = Math.abs(noseX) > 0.05 ? (noseX > 0 ? 1 : -1) : (vx < 0 ? -1 : 1);
    const initOverride = {
      x: landingLevel.padCenterX,
      y: startY,
      vx: Math.min(Math.abs(vx), 10) * (vx > 0 ? 1 : -1),
      vy: vy,
      facingSign,
    };
    return this.makeTransition('success', () => this.loadLanding(landingLevel, initOverride), 'Final approach established', `Landing zone: ${landingLevel.name}.`);
  }

  private transitionOrbitalToApproach(p: Extract<Phase, { kind: 'orbital' }>, role: TransitionRole = 'success'): PhaseTransition | null {
    const explicitId = p.level.reentryApproachLevelId;
    const approachLevel = explicitId
      ? approachLevelById(explicitId)
      : APPROACH_LEVELS[p.level.approachLevelIdx];
    if (!approachLevel || approachLevel.departure || approachLevel.body.id !== p.level.bodyId) return null;
    const params = orbitalToApproachParams(p.os, p.level);
    return this.makeTransition(
      role,
      () => this.loadApproach(approachLevel, params, p.os.time),
      role === 'contingency' ? (p.level.atmoHeight > 0 ? 'Entering atmosphere' : 'Entering approach') : 'Deorbit corridor acquired',
      role === 'contingency' ? 'This is not the primary objective for the current orbital phase.' : `Descending toward ${approachLevel.poi.name}.`,
    );
  }

  private approachToOrbitalInit(level: ApproachLevel, as: ApproachState, orbitalLevel: OrbitalLevel): OrbitalInitOverride {
    if (level.body.atmosphere === null) {
      return {
        x: as.worldX,
        y: as.worldY,
        vx: as.worldVX,
        vy: as.worldVY,
      };
    }

    const ref = level.frame;
    const localDir = ref.localDir;
    const theta = ref.landingSiteAngle + as.x / (ref.planetRadius * localDir);
    const r = ref.planetRadius + Math.max(0, as.y);
    const radX = Math.cos(theta), radY = Math.sin(theta);
    const tanX = -radY * localDir, tanY = radX * localDir;
    return {
      x: radX * r,
      y: radY * r,
      vx: tanX * as.vx + radX * as.vy,
      vy: tanY * as.vx + radY * as.vy,
    };
  }

  private transitionApproachToOrbital(p: Extract<Phase, { kind: 'approach' }>, role: TransitionRole = 'success'): PhaseTransition | null {
    const orbitalLevelId = p.level.departure?.orbitalLevelId ?? p.level.returnToOrbital?.orbitalLevelId;
    if (!orbitalLevelId) return null;
    const orbitalLevel = orbitalLevelById(orbitalLevelId);
    if (!orbitalLevel || orbitalLevel.bodyId !== p.level.body.id) return null;
    const init = this.approachToOrbitalInit(p.level, p.as, orbitalLevel);
    const worldTime = p.worldTimeStart + this.time;
    return this.makeTransition(
      role,
      () => this.loadOrbital(orbitalLevel, init, worldTime),
      role === 'contingency' ? 'Returning to orbit' : `Orbital insertion at ${p.level.body.name}`,
      role === 'contingency' ? 'You climbed out of the descent corridor.' : `Proceed to ${this.orbitalObjectiveLabel(orbitalLevel)}.`,
    );
  }

  private transitionOrbitalToDocking(p: Extract<Phase, { kind: 'orbital' }>): PhaseTransition | null {
    const dockingLevelId = p.level.dockingLevelId;
    const dockingLevel = dockingLevelId ? DOCKING_LEVELS.find(l => l.id === dockingLevelId) : null;
    const station = p.level.station;
    if (!dockingLevel || !station) return null;

    const sense = station.orbitSense;
    const stOmega = sense * Math.sqrt(p.level.planetGM / (station.orbitRadius ** 3));
    const stAngle = station.epochAngle + stOmega * (p.os.time - station.epochTime);
    const stSpeed = Math.sqrt(p.level.planetGM / station.orbitRadius);
    const stX = station.orbitRadius * Math.cos(stAngle);
    const stY = station.orbitRadius * Math.sin(stAngle);
    const stVX = -sense * stSpeed * Math.sin(stAngle);
    const stVY = sense * stSpeed * Math.cos(stAngle);

    let relX = p.os.x - stX;
    let relY = p.os.y - stY;
    let relDist = Math.sqrt(relX * relX + relY * relY);
    const relVX = p.os.vx - stVX;
    const relVY = p.os.vy - stVY;

    if (relDist < 1) {
      relX = relVX;
      relY = relVY;
      relDist = Math.sqrt(relX * relX + relY * relY);
    }
    if (relDist < 1) {
      relX = -1;
      relY = 0;
      relDist = 1;
    }

    const ux = relX / relDist;
    const uy = relY / relDist;
    const baseDist = dockingLevel.beamRange * 10;
    const startDist = baseDist * (1 + Math.min(1, relDist / station.captureRadius));
    const initOverride: DockingInitOverride = {
      x: ux * startDist,
      y: uy * startDist,
      vx: relVX,
      vy: relVY,
      angle: Math.atan2(-uy, -ux),
    };
    return this.makeTransition('success', () => this.loadDocking(dockingLevel, initOverride, p.os.time), `${station.name ?? dockingLevel.name} rendezvous acquired`, 'Closing on assigned docking berth.');
  }

  // --- Approach phase ---

  private handleApproach(input: InputState, frameTime: number): void {
    const p = this.phase as Extract<Phase, { kind: 'approach' }>;

    if (input.reset) { this.reloadPhase(p); return; }
    if (input.levelSelect) { this.openFlightMenu(p); return; }

    input.reset = false;
    input.levelSelect = false;

    if (input.warpUp) {
      p.as.timeWarpLevel = Math.min(p.as.timeWarpLevel + 1, 2);
      p.as.timeWarp = [1, 2, 5][p.as.timeWarpLevel];
    }
    if (input.warpDown) {
      p.as.timeWarpLevel = Math.max(p.as.timeWarpLevel - 1, 0);
      p.as.timeWarp = [1, 2, 5][p.as.timeWarpLevel];
    }
    if ((input.throttleUp || input.throttleDown || input.pitch !== 0) && p.as.timeWarpLevel > 0) {
      p.as.timeWarpLevel = 0;
      p.as.timeWarp = 1;
    }
    input.warpUp = false;
    input.warpDown = false;

    const effectiveFrameTime = frameTime * p.as.timeWarp;
    this.accumulator += effectiveFrameTime;
    let edgeConsumed = false;
    while (this.accumulator >= PHYSICS_DT) {
      if (p.state === 'approaching') {
        updateApproach(p.as, input, p.level, PHYSICS_DT, this.time);
        // Clear edge triggers after first physics step
        if (!edgeConsumed) { edgeConsumed = true; }
        else { input.toggleWings = false; }

        if (!p.as.alive) p.state = 'approachFailed';
        if (p.as.gateReached) {
          const transition = p.level.departure
            ? this.transitionApproachToOrbital(p, 'success')
            : this.transitionApproachToLanding(p);
          if (transition) this.completeTransition(p, transition);
          else p.state = 'approachFailed';
          return;
        }
        if (p.level.returnToOrbital && p.as.vy > 0 && p.as.y > p.level.returnToOrbital.exitAltitude + 50) {
          const transition = this.transitionApproachToOrbital(p, 'contingency');
          if (transition) this.completeTransition(p, transition);
          else p.state = 'approachFailed';
          return;
        }
      }
      this.accumulator -= PHYSICS_DT;
      this.time += PHYSICS_DT;
      this.worldTime += PHYSICS_DT;
    }

    updateApproachCamera(p.cam, p.as, p.level, effectiveFrameTime, this.canvas.width, this.canvas.height);
  }

  // --- Station terminal / BBS scenes ---

  private buildInteractiveScene(state: InteractiveScenePhaseState): InteractiveScene {
    const locationPath = estellaDisplayPath(this.career.locationId);
    if (state.id === 'stationTerminal') {
      return {
        title: 'STATION TERMINAL',
        subtitle: `${locationPath}   CASH: ${formatCredits(this.career.money)}   TIME: ${(this.career.worldTime / 86_400).toFixed(1)}d`,
        bodyRows: [
          { kind: 'text', text: 'Teamster account authenticated.', tone: 'success' },
          { kind: 'kv', label: 'Location', value: locationPath },
          { kind: 'kv', label: 'Cash', value: formatCredits(this.career.money), tone: this.career.money >= 0 ? 'success' : 'danger' },
          { kind: 'kv', label: 'World time', value: `${(this.career.worldTime / 86_400).toFixed(2)} days` },
          { kind: 'kv', label: 'Basic certification', value: `${this.career.basicCertificationStage}/3 practicals complete`, tone: this.career.basicCertificationStage >= 3 ? 'success' : undefined },
        ],
        footer: 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu',
        options: [
          { label: 'Browse Freight Contracts', detail: 'Open the local Teamsters\' Guild freight postings.', action: 'browseContracts', tone: 'primary' },
          { label: 'Browse Passenger Contracts', detail: 'Open low-margin seat blocks, crew rotations, and worker-transfer postings.', action: 'browsePassengerContracts', tone: 'primary' },
          { label: 'Local Directory', detail: 'Find local offices and known contacts within communications range.', action: 'localDirectory', tone: 'primary' },
          { label: 'Career Status', detail: 'Review saved location, cash, and world time.', action: 'careerStatus' },
          { label: 'Ship Status', detail: 'Read-only shipboard status terminal. Not installed yet.', action: 'shipStatus', tone: 'warning' },
          { label: 'Back to Start Menu', detail: 'Leave the station terminal.', action: 'startMenu', tone: 'back' },
        ],
      };
    }

    if (state.id === 'browseContracts' || state.id === 'browsePassengerContracts') {
      const contracts = state.contracts ?? [];
      const passengerBoard = state.id === 'browsePassengerContracts';
      return {
        title: passengerBoard ? 'BROWSE PASSENGER CONTRACTS' : 'BROWSE FREIGHT CONTRACTS',
        subtitle: `${locationPath}   CASH: ${formatCredits(this.career.money)}   TIME: ${(this.career.worldTime / 86_400).toFixed(1)}d`,
        bodyRows: passengerBoard ? [
          { kind: 'text', text: 'Seat blocks, crew rotations, and worker-transfer postings. Most are connectivity work, not profit work.' },
          { kind: 'kv', label: 'Postings', value: `${contracts.length}` },
          { kind: 'kv', label: 'Pay model', value: 'Published pay is fixed credits plus fuel reimbursement; color shows net at par' },
        ] : [
          { kind: 'text', text: contracts.length ? 'Local faction freight postings. Select a posting to inspect the route and terms.' : 'No faction freight postings are available here today.', tone: contracts.length ? undefined : 'warning' },
          { kind: 'kv', label: 'Postings', value: `${contracts.length}` },
          { kind: 'kv', label: 'Sorting', value: 'Faction boards only; open-market filler is not posted' },
        ],
        footer: 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu',
        options: [
          ...contracts.map(contract => ({
            label: contract.title,
            tag: contract.issuerTag ?? careerContractClassLabel(contract.routeClass),
            rightText: contractPublishedPay(contract.quote),
            rightDetail: `NET AT PAR ${contractMarginSummary(contract.quote)}`,
            detail: `${contract.issuerName ?? 'Unknown issuer'} | FROM ${contract.sourceName} | ${careerContractClassLabel(contract.routeClass)} | ${contract.quote.cargoMassTons}t | PAR ${contract.quote.parDv.toFixed(0)} m/s`,
            action: `contract:${contract.id}`,
            tone: contractOptionTone(contract),
          })),
          { label: 'Back to Station Terminal', detail: 'Return to terminal functions.', action: 'stationTerminal', tone: 'back' },
        ],
      };
    }

    if (state.id === 'operationsManual') {
      return {
        title: 'TEAMSTER OPERATING MANUAL',
        subtitle: 'Guild-standard flight controls and operating procedures',
        bodyRows: [
          { kind: 'text', text: 'Select an article. Additional flight modes and reference material will be added as they enter service.' },
          { kind: 'kv', label: 'Articles', value: '1' },
        ],
        footer: 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu',
        options: [
          { label: 'Local Transfer', detail: 'Flying between facilities inside a shared traffic volume.', action: 'manualArticle:local-transfer', tone: 'primary' },
          { label: 'Back to Start Menu', detail: 'Close the operating manual.', action: 'startMenu', tone: 'back' },
        ],
      };
    }

    if (state.id === 'localDirectory') {
      const entries = localDirectoryEntriesAt(this.career.locationId);
      return {
        title: 'LOCAL DIRECTORY',
        subtitle: locationPath,
        bodyRows: [
          { kind: 'text', text: entries.length ? 'Local offices and reachable contacts available through this terminal.' : 'No local offices or reachable contacts are listed here.', tone: entries.length ? undefined : 'warning' },
          { kind: 'kv', label: 'Listings', value: `${entries.length}` },
          { kind: 'kv', label: 'Access', value: 'Local offices plus contacts within communications range' },
        ],
        footer: 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu',
        options: [
          ...entries.map(entry => {
            const access = localDirectoryEntryAccess(entry, this.career.locationId);
            return {
              label: entry.name,
              tag: entry.kind === 'office' ? 'OFFICE' : 'CONTACT',
              rightText: entry.organizationName,
              rightDetail: access === 'remote' ? 'REMOTE COMMS' : 'LOCAL',
              detail: entry.kind === 'contact' ? `${entry.title} — ${entry.summary}` : entry.summary,
              detailLineCount: entry.kind === 'contact' ? 2 as const : 1 as const,
              action: `directoryEntry:${entry.id}`,
              tone: 'primary' as InteractiveTone,
            };
          }),
          { label: 'Back to Station Terminal', detail: 'Return to terminal functions.', action: 'stationTerminal', tone: 'back' as InteractiveTone },
        ],
      };
    }

    if (state.id === 'localDirectoryEntry') {
      const entry = state.directoryEntryId ? localDirectoryEntryById(state.directoryEntryId) : undefined;
      if (!entry) return this.buildInteractiveScene({ id: 'localDirectory', selectedIndex: 0 });
      const contactLocation = estellaDisplayPath(entry.locationIds[0]);
      const contactContracts = state.contracts ?? generateDirectoryEntryContracts(entry.id, this.career.locationId, this.career.worldTime, this.career.basicCertificationStage);
      return {
        title: entry.name.toUpperCase(),
        subtitle: entry.kind === 'contact' ? `${entry.title} — ${entry.organizationName ?? 'Independent'}` : entry.organizationName,
        bodyRows: entry.kind === 'contact' ? [
          { kind: 'text', text: entry.description },
          { kind: 'separator' },
          ...entry.dialogue.map((text, index) => ({ kind: 'text' as const, text, tone: index === 0 ? 'success' as const : undefined })),
        ] : [
          { kind: 'text', text: entry.description },
          { kind: 'kv', label: 'Organization', value: entry.organizationName ?? 'Independent' },
          { kind: 'kv', label: 'Location', value: contactLocation },
        ],
        footer: 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu',
        options: [
          ...contactContracts.map(contract => ({
            label: contract.title,
            tag: contract.category === 'certification' ? 'TUTORIAL' : 'WORK',
            detail: `${contract.sourceName} → ${contract.destinationName} — ${contractPublishedPay(contract.quote)}`,
            action: `contactContract:${contract.id}`,
            tone: contract.category === 'certification' ? 'warning' as InteractiveTone : 'primary' as InteractiveTone,
          })),
          ...entry.actions.map(action => ({
            label: action.label,
            tag: action.tag,
            detail: action.detail,
            action: `directoryAction:${entry.id}:${action.id}`,
            tone: action.tag === 'TUTORIAL' ? 'warning' as InteractiveTone : 'normal' as InteractiveTone,
          })),
          { label: state.directoryParentEntryId ? 'Back to Certification Office' : 'Back to Local Directory', detail: 'Return to the previous directory listing.', action: state.directoryParentEntryId ? `directoryEntry:${state.directoryParentEntryId}` : 'localDirectory', tone: 'back' as InteractiveTone },
        ],
      };
    }

    if (state.id === 'localDirectoryAction') {
      const entry = state.directoryEntryId ? localDirectoryEntryById(state.directoryEntryId) : undefined;
      if (!entry) return this.buildInteractiveScene({ id: 'localDirectory', selectedIndex: 0 });
      return this.buildInteractiveScene({ id: 'localDirectoryEntry', selectedIndex: 0, directoryEntryId: entry.id });
    }

    if (state.id === 'contractPosting') {
      const contract = state.contracts?.[state.contractIndex ?? -1];
      if (!contract) {
        if (state.board === 'contact' && state.directoryEntryId) return this.buildInteractiveScene({ id: 'localDirectoryEntry', selectedIndex: 0, directoryEntryId: state.directoryEntryId, directoryParentEntryId: state.directoryParentEntryId });
        return this.buildInteractiveScene({ id: 'browseContracts', selectedIndex: 0, contracts: state.contracts ?? [] });
      }
      const quote = contract.quote;
      const contactPosting = state.board === 'contact';
      const transfer = contract.selectedTransfer;
      const transferSummary = transfer
        ? `${transfer.label} | wait ${(Math.max(0, transfer.waitTime - this.career.worldTime) / 3600).toFixed(1)}h | coast ${(transfer.transferTime / 3600).toFixed(1)}h`
        : 'immediate/local routing';
      return {
        title: contract.category === 'passenger' ? 'PASSENGER POSTING' : contract.category === 'certification' ? 'CERTIFICATION MISSION' : 'CONTRACT POSTING',
        subtitle: 'Review route and terms before accepting.',
        bodyRows: [
          { kind: 'kv', label: 'Contract', value: contract.title, tone: 'success' },
          { kind: 'kv', label: 'Issuer', value: contract.issuerName ?? 'Unknown issuer' },
          { kind: 'kv', label: 'Source', value: contract.sourcePath },
          { kind: 'kv', label: 'Destination', value: contract.destinationName },
          { kind: 'kv', label: 'Location', value: contract.destinationPath },
          { kind: 'kv', label: 'Route class', value: careerContractClassLabel(contract.routeClass) },
          { kind: 'separator' },
          { kind: 'kv', label: contract.category === 'passenger' ? 'Passengers' : contract.category === 'certification' ? 'Flight load' : 'Cargo', value: `${quote.cargoLabel} (${quote.cargoMassTons} t manifest, ${quote.loadedMassTons} t loaded)` },
          { kind: 'kv', label: 'Par ΔV', value: `${quote.parDv.toFixed(0)} m/s`, tone: 'warning' },
          { kind: 'kv', label: 'Par fuel cost', value: formatCredits(quote.parFuelCost), tone: 'warning' },
          { kind: 'kv', label: 'Published pay', value: contractPublishedPay(quote), tone: contractOptionTone(contract) },
          { kind: 'kv', label: 'Net at par', value: contractMarginSummary(quote), tone: contractOptionTone(contract) },
          { kind: 'kv', label: 'Transfer', value: transferSummary },
        ],
        footer: contactPosting ? 'W/S or ↑↓: select   Enter/Space: choose   Esc: back to contact' : 'W/S or ↑↓: select   Enter/Space: choose   Esc: back to contract board',
        options: [
          { label: 'Accept Contract', detail: 'Accept these terms and begin the run.', action: 'acceptContract', tone: 'primary' },
          { label: contactPosting ? 'Back to Certification Officer' : contract.category === 'passenger' ? 'Back to Passenger Board' : 'Back to Contract Board', detail: 'Return without accepting.', action: contactPosting && state.directoryEntryId ? `directoryContact:${state.directoryEntryId}:${state.directoryParentEntryId ?? ''}` : contract.category === 'passenger' ? 'browsePassengerContracts' : 'browseContracts', tone: 'back' },
        ],
      };
    }

    if (state.id === 'careerStatus') {
      return {
        title: 'CAREER STATUS',
        subtitle: 'Teamsters\' Guild account',
        bodyRows: [
          { kind: 'kv', label: 'Current location', value: locationPath },
          { kind: 'kv', label: 'Cash', value: formatCredits(this.career.money), tone: this.career.money >= 0 ? 'success' : 'danger' },
          { kind: 'kv', label: 'World time', value: `${(this.career.worldTime / 86_400).toFixed(2)} days` },
          { kind: 'kv', label: 'Basic certification', value: `${this.career.basicCertificationStage}/3 practicals complete`, tone: this.career.basicCertificationStage >= 3 ? 'success' : undefined },
        ],
        footer: 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu',
        options: [{ label: 'Back to Station Terminal', detail: 'Return to terminal functions.', action: 'stationTerminal', tone: 'back' }],
      };
    }

    return {
      title: 'SHIP STATUS',
      subtitle: 'Shipboard terminal placeholder',
      bodyRows: [
        { kind: 'text', text: 'Ship status terminal is not installed yet.', tone: 'warning' },
        { kind: 'text', text: 'Future read-only rig inspection will live here.' },
      ],
      footer: 'W/S or ↑↓: select   Enter/Space: choose   Esc: start menu',
      options: [{ label: 'Back to Station Terminal', detail: 'Return to terminal functions.', action: 'stationTerminal', tone: 'back' }],
    };
  }

  private handleInteractiveScene(input: InputState): void {
    const p = this.phase as Extract<Phase, { kind: 'interactiveScene' }>;
    const scene = this.buildInteractiveScene(p.scene);
    const itemCount = Math.max(1, scene.options.length);

    if (input.levelSelect) {
      if (p.scene.id === 'contractPosting') {
        if (p.scene.board === 'contact' && p.scene.directoryEntryId) {
          this.phase = { kind: 'interactiveScene', scene: { id: 'localDirectoryEntry', selectedIndex: 0, directoryEntryId: p.scene.directoryEntryId, directoryParentEntryId: p.scene.directoryParentEntryId } };
          return;
        }
        const id = p.scene.board === 'passenger' ? 'browsePassengerContracts' : 'browseContracts';
        this.phase = { kind: 'interactiveScene', scene: { id, selectedIndex: p.scene.contractIndex ?? 0, contracts: p.scene.contracts ?? [], board: p.scene.board } };
        return;
      }
      this.startMenuReturnPhase = p;
      this.phase = { kind: 'startMenu' };
      return;
    }

    if (p.scene.selectedIndex < 0 || p.scene.selectedIndex >= itemCount) p.scene.selectedIndex = 0;
    if (input.menuUp) p.scene.selectedIndex = (p.scene.selectedIndex - 1 + itemCount) % itemCount;
    if (input.menuDown) p.scene.selectedIndex = (p.scene.selectedIndex + 1) % itemCount;
    if (!input.menuConfirm) return;

    const option = scene.options[p.scene.selectedIndex];
    if (!option || option.disabled) return;
    this.activateInteractiveSceneOption(p.scene, option.action);
  }

  private activateInteractiveSceneOption(state: InteractiveScenePhaseState, action: string): void {
    if (action === 'browseContracts') {
      if (state.id === 'contractPosting') this.phase = { kind: 'interactiveScene', scene: { id: 'browseContracts', selectedIndex: state.contractIndex ?? 0, contracts: state.contracts ?? [], board: 'freight' } };
      else this.loadBrowseContracts();
      return;
    }
    if (action === 'browsePassengerContracts') {
      if (state.id === 'contractPosting') this.phase = { kind: 'interactiveScene', scene: { id: 'browsePassengerContracts', selectedIndex: state.contractIndex ?? 0, contracts: state.contracts ?? [], board: 'passenger' } };
      else this.loadBrowsePassengerContracts();
      return;
    }
    if (action === 'stationTerminal') { this.loadStationTerminal(); return; }
    if (action === 'manualArticle:local-transfer') {
      this.phase = {
        kind: 'manualArticle',
        articleId: 'local-transfer',
        returnPhase: { kind: 'interactiveScene', scene: { id: 'operationsManual', selectedIndex: state.selectedIndex } },
        tutorialSplash: false,
      };
      return;
    }
    if (action === 'localDirectory') { this.phase = { kind: 'interactiveScene', scene: { id: 'localDirectory', selectedIndex: 0 } }; return; }
    if (action.startsWith('directoryEntry:')) {
      const directoryEntryId = action.slice('directoryEntry:'.length);
      const contracts = generateDirectoryEntryContracts(directoryEntryId, this.career.locationId, this.career.worldTime, this.career.basicCertificationStage);
      this.phase = { kind: 'interactiveScene', scene: { id: 'localDirectoryEntry', selectedIndex: 0, directoryEntryId, contracts } };
      return;
    }
    if (action.startsWith('directoryContact:')) {
      const [, directoryEntryId, directoryParentEntryId] = action.split(':');
      const contracts = generateDirectoryEntryContracts(directoryEntryId, this.career.locationId, this.career.worldTime, this.career.basicCertificationStage);
      this.phase = { kind: 'interactiveScene', scene: { id: 'localDirectoryEntry', selectedIndex: 0, directoryEntryId, directoryParentEntryId: directoryParentEntryId || undefined, contracts } };
      return;
    }
    if (action.startsWith('directoryAction:')) {
      const [, directoryEntryId, directoryActionId] = action.split(':');
      const directoryEntry = localDirectoryEntryById(directoryEntryId);
      const directoryAction = directoryEntry?.actions.find(candidate => candidate.id === directoryActionId);
      if (directoryAction?.contactId) {
        const contracts = generateDirectoryEntryContracts(directoryAction.contactId, this.career.locationId, this.career.worldTime, this.career.basicCertificationStage);
        this.phase = { kind: 'interactiveScene', scene: { id: 'localDirectoryEntry', selectedIndex: 0, directoryEntryId: directoryAction.contactId, directoryParentEntryId: directoryEntryId, contracts } };
        return;
      }
      const contracts = generateDirectoryEntryContracts(directoryEntryId, this.career.locationId, this.career.worldTime, this.career.basicCertificationStage);
      this.phase = { kind: 'interactiveScene', scene: { id: 'localDirectoryAction', selectedIndex: 0, directoryEntryId, directoryActionId, contracts } };
      return;
    }
    if (action.startsWith('contactContract:')) {
      const contractId = action.slice('contactContract:'.length);
      const contracts = state.contracts ?? (state.directoryEntryId
        ? generateDirectoryEntryContracts(state.directoryEntryId, this.career.locationId, this.career.worldTime, this.career.basicCertificationStage)
        : []);
      const idx = contracts.findIndex(contract => contract.id === contractId);
      if (idx >= 0) this.openContractPosting(contracts, idx, 'contact', state.directoryEntryId, state.directoryParentEntryId);
      return;
    }
    if (action === 'careerStatus') { this.phase = { kind: 'interactiveScene', scene: { id: 'careerStatus', selectedIndex: 0 } }; return; }
    if (action === 'shipStatus') { this.phase = { kind: 'interactiveScene', scene: { id: 'shipStatus', selectedIndex: 0 } }; return; }
    if (action === 'startMenu') { this.startMenuReturnPhase = null; this.phase = { kind: 'startMenu' }; return; }
    if (action.startsWith('contract:')) {
      const contracts = state.contracts ?? [];
      const idx = contracts.findIndex(contract => `contract:${contract.id}` === action);
      if (idx >= 0) this.openContractPosting(contracts, idx, state.id === 'browsePassengerContracts' || state.board === 'passenger' ? 'passenger' : 'freight');
      return;
    }
    if (action === 'acceptContract') {
      const contract = state.contracts?.[state.contractIndex ?? -1];
      if (!contract) return;
      const selectedTransfer = contract.selectedTransfer;
      const startWorldTime = selectedTransfer?.waitTime ?? this.career.worldTime;
      this.activeCareerContract = contract;
      this.activeMissionQuote = contract.quote;
      this.activeMissionTransfer = selectedTransfer;
      this.activeMissionStartWorldTime = startWorldTime;
      this.startMenuReturnPhase = null;
      this.launchPlayableEstellaMission(contract.sourceId, contract.destinationId, startWorldTime, selectedTransfer);
    }
  }

  // --- Estella navigation prototype ---

  private handleEstellaNavigation(input: InputState): void {
    const p = this.phase as Extract<Phase, { kind: 'estellaNav' }>;

    if (input.levelSelect) { this.phase = { kind: 'startMenu' }; return; }
    if (input.reset) { resetEstellaNavSelection(p.nav); return; }
    if (input.menuUp) moveEstellaCursor(p.nav, -1);
    if (input.menuDown) moveEstellaCursor(p.nav, 1);
    if (input.menuLeft) estellaNavBack(p.nav);
    if (input.menuRight) estellaNavForward(p.nav);
    if (input.menuConfirm) {
      estellaNavActivate(p.nav);
      if (p.nav.selecting === 'ready' && p.nav.sourceId && p.nav.destinationId) {
        this.phase = { kind: 'estellaMission', mission: generateEstellaMission(p.nav.sourceId, p.nav.destinationId, this.worldTime) };
      }
    }
  }

  private handleEstellaGeneratedMission(input: InputState): void {
    const p = this.phase as Extract<Phase, { kind: 'estellaMission' }>;
    if (input.levelSelect) { this.phase = { kind: 'startMenu' }; return; }
    if (p.mission.transferOptions.length) {
      if (input.menuLeft) p.mission.selectedTransferOption = (p.mission.selectedTransferOption - 1 + p.mission.transferOptions.length) % p.mission.transferOptions.length;
      if (input.menuRight) p.mission.selectedTransferOption = (p.mission.selectedTransferOption + 1) % p.mission.transferOptions.length;
    }
    if (input.menuConfirm) {
      const selectedTransfer = p.mission.transferOptions[p.mission.selectedTransferOption];
      const startWorldTime = selectedTransfer?.waitTime ?? p.mission.startWorldTime;
      const cargo = generateGenericCargoForRoute(p.mission.sourceId, p.mission.destinationId);
      this.activeMissionQuote = estimateEstellaMissionCost(p.mission.sourceId, p.mission.destinationId, cargo, selectedTransfer);
      this.activeMissionTransfer = selectedTransfer;
      this.activeMissionStartWorldTime = startWorldTime;
      this.launchPlayableEstellaMission(p.mission.sourceId, p.mission.destinationId, startWorldTime, selectedTransfer);
    }
  }

  private launchPlayableEstellaMission(sourceId: string, destinationId: string, startWorldTime: number = 0, selectedTransfer?: EstellaTransferOption): void {
    this.localTransferTutorialShown = false;
    const generated = createPlayableEstellaMission(sourceId, destinationId, selectedTransfer);
    this.phaseCompletion = null;
    this.activeMissionSourceId = sourceId;
    this.activeMissionDestinationId = destinationId;
    this.activeMissionStartWorldTime = startWorldTime;
    this.activeMissionTransfer = selectedTransfer;
    this.missionDvUsed = 0;
    this.worldTime = startWorldTime;
    if (generated.start.kind === 'landing') {
      const launchHandoffAltitude = Math.max(100, generated.start.level.startY - generated.start.level.padY);
      this.loadLanding(
        generated.start.level,
        { x: generated.start.level.padCenterX, y: generated.start.level.padY + LANDING_GEAR_REST_HEIGHT, vx: 0, vy: 0 },
        { targetAltitude: launchHandoffAltitude, orbitDir: generatedEstellaDepartureOrbitDir(destinationId, sourceId), nextApproachLevelId: generated.start.nextApproachLevelId },
      );
    } else if (generated.start.kind === 'docking') {
      this.loadDocking(generated.start.level);
    } else {
      this.loadCluster(generated.start.level);
    }
  }

  // --- Render ---

  private renderGameplayPhase(
    p: GameplayPhase,
    completionText: string,
    destinationName: string | undefined,
    destinationLocation: string | undefined,
    suppressStateOverlays: boolean,
  ): void {
    if (p.kind === 'landing') {
      render(this.ctx, this.canvas, p.camera, p.ship, p.terrain, p.level, this.time);
      drawHUD(this.ctx, this.canvas, p.ship, p.terrain, p.state, p.score, p.level, completionText, destinationName, destinationLocation, p.launchGuidance, this.phaseDvUsed(p), this.missionDvForPhase(p), this.currentMissionParDv(), suppressStateOverlays);
    } else if (p.kind === 'approach') {
      renderApproach(this.ctx, this.canvas, p.cam, p.as, p.level, this.time);
      drawApproachHUD(this.ctx, this.canvas, p.as, p.level, p.state, this.time, destinationName, destinationLocation, this.phaseDvUsed(p), this.missionDvForPhase(p), this.currentMissionParDv(), suppressStateOverlays);
    } else if (p.kind === 'orbital') {
      renderOrbital(this.ctx, this.canvas, p.cam, p.os, p.level, this.time);
      drawOrbitalHUD(this.ctx, this.canvas, p.os, p.level, p.state, destinationName, destinationLocation, this.phaseDvUsed(p), this.missionDvForPhase(p), this.currentMissionParDv(), suppressStateOverlays);
    } else if (p.kind === 'docking') {
      renderDocking(this.ctx, this.canvas, p.cam, p.ds, p.level, this.time);
      drawDockingHUD(this.ctx, this.canvas, p.ds, p.level, p.state, completionText, destinationName, destinationLocation, this.phaseDvUsed(p), this.missionDvForPhase(p), this.currentMissionParDv(), suppressStateOverlays);
    } else {
      renderCluster(this.ctx, this.canvas, p.cam, p.cs, p.level, this.worldTime);
      drawClusterHUD(this.ctx, this.canvas, p.cs, p.level, p.state, this.worldTime, this.phaseDvUsed(p), this.missionDvForPhase(p), this.currentMissionParDv(), suppressStateOverlays);
    }
  }

  private renderFrame(): void {
    const p = this.phase;
    const completionText = this.currentMissionCompletionText();
    const destinationName = this.currentMissionDestinationName();
    const destinationLocation = this.currentMissionDestinationLocation();
    const suppressStateOverlays = !!this.phaseCompletion;

    if (p.kind === 'startMenu') {
      drawStartMenu(this.ctx, this.canvas, this.menuSelection, this.campaignActionLabel(), this.confirmingNewTeamsterReset, !!this.startMenuReturnPhase);
    } else if (p.kind === 'flightMenu') {
      this.renderGameplayPhase(p.previous, completionText, destinationName, destinationLocation, true);
      drawFlightMenu(this.ctx, this.canvas, this.flightMenuSelection);
    } else if (p.kind === 'landing' || p.kind === 'approach' || p.kind === 'orbital' || p.kind === 'docking' || p.kind === 'cluster') {
      this.renderGameplayPhase(p, completionText, destinationName, destinationLocation, suppressStateOverlays);
    } else if (p.kind === 'estellaNav') {
      drawEstellaNavigation(this.ctx, this.canvas, p.nav);
    } else if (p.kind === 'estellaMission') {
      drawEstellaGeneratedMission(this.ctx, this.canvas, p.mission);
    } else if (p.kind === 'interactiveScene') {
      drawInteractiveScene(this.ctx, this.canvas, this.buildInteractiveScene(p.scene), p.scene.selectedIndex);
    } else if (p.kind === 'manualArticle') {
      drawOperationsManualArticle(this.ctx, this.canvas, operationsManualArticleById(p.articleId), p.tutorialSplash);
    }
    if (p.kind !== 'manualArticle') this.drawGuidanceBanner();
    if (this.phaseCompletion) {
      drawPhaseCompleteOverlay(
        this.ctx,
        this.canvas,
        this.phaseCompletion.title,
        this.phaseCompletion.phaseDvUsed,
        this.phaseCompletion.missionDvUsed,
        this.phaseCompletion.completionText,
        this.phaseCompletion.ratingText,
        this.phaseCompletion.ratingColor,
        this.phaseCompletion.detailText,
        this.phaseCompletion.tone,
      );
    }
  }
}
