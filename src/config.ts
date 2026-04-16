// All tunable parameters in one place.
// Units: meters, seconds, radians, m/s².

export const config = {
  // --- Physics ---
  gravity: 9.8,

  // --- Main Engine ---
  mainEngineAccel: 24.5,          // m/s² at full throttle (~2.5g TWR)
  gimbalMaxAngle: 0.262,          // rad (~15°)
  gimbalSlewRate: 0.35,           // rad/s (~20°/s)
  gimbalTorqueEfficiency: 0.4,    // angular accel per linear accel * sin(gimbal)
  throttleRate: 2.5,              // throttle change per second (keyboard)

  // --- RCS ---
  rcsAngularAccel: 3.0,           // rad/s² (rotation)
  rcsTranslationAccel: 1.5,       // m/s² (used by stop-assist)

  // --- Drag ---
  dragCoeff: 0.0008,              // quadratic drag
  angularDrag: 3.0,               // angular velocity damping

  // --- Wind ---
  windEnabled: false,
  windStrength: 2.0,              // m/s² peak
  windFrequency: 0.05,            // how fast wind changes

  // --- Landing ---
  landingMaxVSpeed: 3.0,          // m/s
  landingMaxHSpeed: 2.0,          // m/s
  landingMaxAngle: 0.175,         // rad (~10°)

  // --- Camera ---
  cameraSmoothing: 3.0,
  cameraLeadFactor: 0.3,          // look-ahead based on velocity
  minZoom: 1.0,                   // px/m at high altitude
  maxZoom: 4.5,                   // px/m near ground
  zoomLowAlt: 40,                 // altitude for max zoom
  zoomHighAlt: 350,               // altitude for min zoom

  // --- Start ---
  startX: 850,
  startY: 300,
  startVX: 12,
  startVY: 0,

  // --- Ship geometry (local coords, meters) ---
  shipHeight: 10,                 // nose to bottom
  engineMomentArm: 5,             // CoM to engine distance
};

export type Config = typeof config;
