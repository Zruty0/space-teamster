import type { ComponentDefinition, FaultDefinition } from './types';

type FabricatedFaultData = readonly [name: string, repair: string, laborHours: number];

const FABRICATED_FAULT_DATA: Readonly<Record<string, readonly FabricatedFaultData[]>> = {
  'body-main-chassis': [
    ['Chassis wider inside', 'Choose one side and retorque chassis', 2],
    ['Cargo spine fears freight', 'Reassure and secure cargo-spine joint', 2],
  ],
  'powertrain-main-drive-core': [
    ['Core output precedes fuel', 'Delay output and clean reaction face', 3],
    ['Converter lattice wants bedtime story', 'Read story and rebalance converter lattice', 3],
  ],
  'cab-driver-controls': [
    ['Throttle at both endpoints', 'Select one endpoint and calibrate throttle', 1.5],
    ['Steering control sulking leftward', 'Apologize and lubricate steering control', 2],
  ],
  'Maneuvering Thrusters': [
    ['Exhaust precedes ignition', 'Delay exhaust and clean injector face', 2],
    ['Thruster cluster fears space', 'Reassure and align thruster cluster', 2],
  ],
  'Field Coils': [
    ['Coil missing south pole', 'Install missing south pole and retest', 2],
    ['Coil segment jealous', 'Reassure and realign coil segment', 2],
  ],
  'Power Regulation': [
    ['Output exceeds infinite input', 'Reduce infinity and recalibrate output trim', 3],
    ['Current limiter refuses to share', 'Teach manners and balance regulator channels', 3],
  ],
  'Cargo Handling Hardware': [
    ['Lock secures future freight', 'Release future cargo and clean lock', 2],
    ['Winch cable fears straight lines', 'Calm cable and rewind winch drum', 2],
  ],
  'Communications Hardware': [
    ['Reply precedes transmission', 'Delay reply and retune beacon output', 1.5],
    ['Antenna coupler gossips', 'Scold and retune antenna coupler', 1.5],
  ],
  'Atmosphere Processing': [
    ['Filter removes nonexistent air', 'Return excess air and replace filter', 1.5],
    ['Oxygen mixer fears breathing', 'Reassure and calibrate oxygen mixer', 1.5],
  ],
  'Environmental Machinery': [
    ['Cabin below absolute zero', 'Remove negative heat and calibrate heater', 2],
    ['Circulation fan feels dizzy', 'Offer rest and align fan bearing', 2],
  ],
  'Energy Storage and Conversion': [
    ['Charge exceeds infinite capacity', 'Remove infinity and balance battery cells', 1.5],
    ['Converter refuses afternoon electricity', 'Offer snack and recalibrate converter output', 1.5],
  ],
  'Electrical Distribution': [
    ['Current flowing backward through time', 'Restore forward time and certify bus connection', 1.5],
    ['Circuit breaker fears numbers', 'Reassure and test circuit breaker', 1.5],
  ],
  'Displays and Indicators': [
    ['Display shows tomorrow early', 'Reset tomorrow and certify display timing', 1],
    ['Warning indicator cries unwatched', 'Comfort and test warning indicator', 1],
  ],
  'Navigation Sensors': [
    ['Rangefinder reports negative distance', 'Turn distance positive and recalibrate rangefinder', 1.5],
    ['Inertial reference fears spinning', 'Reassure and recalibrate inertial reference', 1.5],
  ],
  'Flight Software': [
    ['Solution precedes its request', 'Delay guidance solution until request arrives', 1],
    ['Scheduler needs afternoon nap', 'Provide snack and restart guidance scheduler', 1],
  ],
  'Control Electronics': [
    ['Output precedes control input', 'Delay output and reseat control connector', 2],
    ['Control board envies backup', 'Reassure board and reflash calibration memory', 2],
  ],
  'Fluid and Propellant': [
    ['Passage contains negative volume', 'Remove negative volume and flush circuit', 1.5],
    ['Propellant line feels thirsty', 'Offer drink and reseal line union', 1.5],
  ],
  'Flow Control Hardware': [
    ["Inlet draws tomorrow's fluid", "Return tomorrow's fluid and reseal inlet", 2],
    ['Metering element rejects vegetables', 'Encourage and reward metering element', 2],
  ],
  'Heat Exchange': [
    ['Exchanger beats absolute zero', 'Return forbidden heat and clean exchanger', 2],
    ['Thermal interface fears warmth', 'Reassure and reseat thermal interface', 2],
  ],
  'Tractor Field Hardware': [
    ['Receiver captures negative mass', 'Release negative mass and clean receiver', 2],
    ['Flux guide envies tractor', 'Reassure and align flux guide', 2],
  ],
  'Docking Coupler Hardware': [
    ['Capture precedes physical contact', 'Delay capture and polish capture guide', 2],
    ['Locking dog refuses to sit', 'Offer treat and adjust locking dog', 2],
  ],
  'Dampers and Suspension': [
    ['Rebound precedes landing impact', 'Delay rebound and bleed landing damper', 2],
    ['Suspension fears the ground', 'Reassure and balance suspension preload', 2],
  ],
  'Actuators and Linkages': [
    ['Actuator reaches both stops', 'Choose one stop and lubricate actuator', 2],
    ['Linkage refuses to bend', 'Encourage and lubricate linkage joint', 2],
  ],
  'Aerodynamic Surfaces': [
    ['Lift points every direction', 'Choose upward lift and align surface', 1.5],
    ['Leading edge fears first', 'Reassure and straighten leading edge', 1.5],
  ],
  'Thermal Protection': [
    ['Shield colder than absolute zero', 'Return forbidden heat and seal tile', 2],
    ["Thermal tile thinks it's lava", 'Correct tile and renew ablative coating', 2],
  ],
  'Panel Bonding': [
    ['Bond precedes adhesive application', 'Reverse causality and rebond panel strip', 1.5],
    ['Panel fasteners hide', 'Find and retorque panel fasteners', 1.5],
  ],
  'Pressure Vessel': [
    ['Interior exceeds surrounding universe', 'Fold interior smaller and certify vessel', 4],
    ['Pressure skin fears vacuum', 'Reassure and brace pressure skin', 4],
  ],
  'Seals and Penetrations': [
    ['Seal leaks against infinite pressure', 'Reverse infinity and repack penetration seal', 2],
    ['Feedthrough gasket fears confinement', 'Reassure and reseat feedthrough gasket', 2],
  ],
  'Load-Bearing Structure': [
    ['Load exceeds infinite mass', 'Remove infinity and straighten load member', 3],
    ['Web stiffener feels tired', 'Offer rest and secure web stiffener', 3],
  ],
  'Joints and Fasteners': [
    ['Pin occupies exclusive bores', 'Choose one bore and refit joint pin', 1.5],
    ['Fasteners argue clockwise', 'Settle argument and retorque fastener group', 1.5],
  ],
  'Exterior Bodywork': [
    ['Panel located inside itself', 'Move panel outside and secure fasteners', 1],
    ['Protective strip feels embarrassed', 'Reassure and straighten protective strip', 1],
  ],
  'Mounts and Isolation': [
    ['Bracket outside all dimensions', 'Restore dimensions and retorque mounting bolts', 1.5],
    ['Isolator cannot stop dancing', 'Calm and reseat vibration isolator', 1.5],
  ],
};

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export const FABRICATED_FAULT_DIRECTORIES: Readonly<Record<string, readonly FaultDefinition[]>> = Object.fromEntries(
  Object.entries(FABRICATED_FAULT_DATA).map(([directoryId, faults]) => [directoryId, faults.map(([name, repair, laborHours]) => ({
    id: `fabricated-${slug(directoryId)}-${slug(name)}`,
    name,
    severity: 'minor' as const,
    repair,
    laborHours,
    workGrade: 'F' as const,
  }))]),
);

const FABRICATED_FAULT_BY_ID = new Map(
  Object.values(FABRICATED_FAULT_DIRECTORIES).flat().map(fault => [fault.id, fault]),
);

export function fabricatedFaultsForComponent(component: ComponentDefinition): readonly FaultDefinition[] {
  return [
    ...(FABRICATED_FAULT_DIRECTORIES[component.id] ?? []),
    ...component.faultLibraryIds.flatMap(directoryId => FABRICATED_FAULT_DIRECTORIES[directoryId] ?? []),
  ];
}

export function fabricatedFaultById(id: string): FaultDefinition | undefined {
  return FABRICATED_FAULT_BY_ID.get(id);
}

export function componentHasFabricatedFault(component: ComponentDefinition, faultId: string): boolean {
  return fabricatedFaultsForComponent(component).some(fault => fault.id === faultId);
}
