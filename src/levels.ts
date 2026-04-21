// Level definitions for landing challenges.

export interface TerrainFeature {
  xStart: number;
  xEnd: number;
  height: number;  // height above padY
}

export interface LevelDef {
  id: number;
  name: string;
  subtitle: string;
  // Physics
  gravity: number;
  // Landing tolerances
  landingMaxVSpeed: number;
  landingMaxHSpeed: number;
  landingMaxAngle: number; // rad
  // Start conditions
  startX: number;
  startY: number;
  startVX: number;
  startVY: number;
  // Terrain
  padCenterX: number;
  padHalfWidth: number;
  padY: number;
  roughness: number;       // terrain amplitude multiplier
  features: TerrainFeature[];
}

export const LEVELS: LevelDef[] = [
  {
    id: 1,
    name: 'Luna Station',
    subtitle: 'Low gravity training ground',
    gravity: 1.6,
    landingMaxVSpeed: 4.0,
    landingMaxHSpeed: 3.0,
    landingMaxAngle: 0.26,  // ~15°
    startX: 980,
    startY: 200,
    startVX: 3,
    startVY: 0,
    padCenterX: 1000,
    padHalfWidth: 30,
    padY: 30,
    roughness: 0.5,
    features: [],
  },
  {
    id: 2,
    name: 'Mars Colony',
    subtitle: 'Red plains, gentle approach',
    gravity: 3.7,
    landingMaxVSpeed: 3.5,
    landingMaxHSpeed: 2.5,
    landingMaxAngle: 0.21,  // ~12°
    startX: 850,
    startY: 250,
    startVX: 10,
    startVY: 0,
    padCenterX: 1000,
    padHalfWidth: 30,
    padY: 30,
    roughness: 0.8,
    features: [
      { xStart: 1120, xEnd: 1140, height: 30 },
    ],
  },
  {
    id: 3,
    name: 'Titan Refinery',
    subtitle: 'Industrial zone, watch the towers',
    gravity: 7.0,
    landingMaxVSpeed: 3.0,
    landingMaxHSpeed: 2.0,
    landingMaxAngle: 0.175, // ~10°
    startX: 750,
    startY: 300,
    startVX: 15,
    startVY: 0,
    padCenterX: 1000,
    padHalfWidth: 30,
    padY: 30,
    roughness: 1.0,
    features: [
      { xStart: 878, xEnd: 882, height: 65 },
      { xStart: 920, xEnd: 928, height: 40 },
      { xStart: 1060, xEnd: 1068, height: 50 },
      { xStart: 1130, xEnd: 1145, height: 35 },
      { xStart: 1198, xEnd: 1202, height: 55 },
    ],
  },
  {
    id: 4,
    name: 'Io Outpost',
    subtitle: 'Tight pad, rough terrain',
    gravity: 9.8,
    landingMaxVSpeed: 2.5,
    landingMaxHSpeed: 1.5,
    landingMaxAngle: 0.14,  // ~8°
    startX: 600,
    startY: 350,
    startVX: 5,
    startVY: -3,
    padCenterX: 1000,
    padHalfWidth: 15,
    padY: 30,
    roughness: 1.5,
    features: [
      { xStart: 870, xEnd: 878, height: 70 },
      { xStart: 910, xEnd: 918, height: 50 },
      { xStart: 940, xEnd: 948, height: 35 },
      { xStart: 1040, xEnd: 1048, height: 40 },
      { xStart: 1070, xEnd: 1080, height: 60 },
      { xStart: 1150, xEnd: 1155, height: 80 },
    ],
  },
  {
    id: 5,
    name: 'Ceres Deep',
    subtitle: 'Canyon landing, no room for error',
    gravity: 12.0,
    landingMaxVSpeed: 2.0,
    landingMaxHSpeed: 1.0,
    landingMaxAngle: 0.105, // ~6°
    startX: 1300,
    startY: 400,
    startVX: -8,
    startVY: 5,
    padCenterX: 1000,
    padHalfWidth: 12,
    padY: 15,
    roughness: 1.8,
    features: [
      // Canyon walls flanking the pad
      { xStart: 940, xEnd: 958, height: 110 },
      { xStart: 960, xEnd: 970, height: 70 },
      { xStart: 1030, xEnd: 1040, height: 75 },
      { xStart: 1042, xEnd: 1060, height: 105 },
      // Distant obstacles
      { xStart: 850, xEnd: 860, height: 90 },
      { xStart: 1150, xEnd: 1160, height: 85 },
      { xStart: 1200, xEnd: 1205, height: 60 },
    ],
  },
  // Mission 1: Castor mining settlement
  {
    id: 6,
    name: 'Castor Settlement',
    subtitle: 'Mining outpost on airless moon',
    gravity: 1.6,
    landingMaxVSpeed: 4.0,
    landingMaxHSpeed: 3.0,
    landingMaxAngle: 0.26,
    startX: 980,
    startY: 300,
    startVX: 5,
    startVY: -2,
    padCenterX: 1000,
    padHalfWidth: 25,
    padY: 30,
    roughness: 0.7,
    features: [
      { xStart: 920, xEnd: 935, height: 45 },
      { xStart: 1050, xEnd: 1065, height: 55 },
    ],
  },
];
