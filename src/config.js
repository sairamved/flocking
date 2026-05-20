// =====================================================================
// CONTROLS — rebind any of these in `config.controls` below.
// =====================================================================
// Letter keys: single character, case-insensitive (e.g. 'T', 'r').
// Arrow keys:  'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
// Set a binding to null to disable it.
// Mouse click is always wired to trigger bird flight in manual mode.

const config = {
  controls: {
    toggleTrainData: 'T',     
    toggleMask: 'R',          
    exportMask: 'E',          
    maskWidthUp: 'UP',        
    maskWidthDown: 'DOWN',    
    maskMoveLeft: 'LEFT',     
    maskMoveRight: 'RIGHT',   
    toggleMute: 'M',          
    birdScaleUp: ']',         
    birdScaleDown: '[',       
    selectWires: ['1', '2', '3', '4', '5', '6'],
    toggleBorderEdit: 'B',    
    toggleBirdCountEdit: 'N', 
  },

  audio: {
    flightSrc: 'assets/audio/flocking-train-audio.mp3',
    volume: 0.8,
  },

  flock: {
    numBirdsTotal: 16,
    numWires: 6,
    referenceWindowWidth: 1800,
    referenceBirdWidth: 250,
    referenceBirdHeight: 250,
    flying2Percentage: 0.2,
  },

  // Live-tunable scene adjustments. Defaults below are starting values; live
  // tweaks happen via keys and are exported into flocking-scene.json via 'E'.
  scene: {
    birdScaleDefault: 0.7,    // multiplier on computed birdWidth/Height
    birdScaleMin: 0.2,
    birdScaleMax: 2.0,
    birdScaleStep: 0.05,
    wireYStep: 2,             // pixels per Up/Down nudge when a wire is selected
    wireYOffsetsDefault: [30, -14, -70, -118, -164, -212], // per-wire y offsets (px)
    birdCountMin: 1,
    birdCountMax: 60,
    birdCountDefault: 16,     // total birds at startup
  },

  // Rounded-rectangle border mask that hides wire spillover at the window
  // edges. Toggled with the 'B' key into edit mode; in edit mode, Up/Down
  // adjusts thickness and Left/Right adjusts inner-corner curvature.
  border: {
    // Defaults expressed as ratios of canvas width so they look right across
    // different display sizes.
    defaultThicknessRatio: 0.0625,
    defaultCornerRadiusRatio: 0.171875,
    thicknessStep: 5,
    curvatureStep: 5,
    minThickness: 0,
    minCornerRadius: 0,
  },

  timing: {
    globalFrameSpeed: 6,
    returnDelay: 1500,
    returnTransitionPercentage: 0.9,
  },

  flightSpeed: {
    out: { min: 5, max: 10 },
    back: { min: 5, max: 10 },
  },

  // Wire pluck (high-frequency oscillation when birds take flight).
  vibration: {
    amplitude: 4,
    frequency: 0.01,
    speed: 1,
  },

  // Slow rolling deformation while all birds are off-screen.
  undulation: {
    amplitude: 22,
    frequency: 0.02,
    speed: 0.1,
  },

  // Stillness state distribution at spawn — must sum to 1.
  // Each entry: probability of starting in that idle-stillness state, and
  // the per-frame chance of transitioning back to an active idle.
  stillness: [
    { state: 'idle1stillness', spawnWeight: 0.2, toIdleProbability: 0.005 },
    { state: 'idle2stillness', spawnWeight: 0.2, toIdleProbability: 0.025 },
    { state: 'idle3stillness', spawnWeight: 0.1, toIdleProbability: 0.005 },
    { state: 'idle4stillness', spawnWeight: 0.1, toIdleProbability: 0.003 },
    { state: 'idle5stillness', spawnWeight: 0.1, toIdleProbability: 0.003 },
    { state: 'idle6stillness', spawnWeight: 0.0, toIdleProbability: 0.003 },
    { state: 'idle7stillness', spawnWeight: 0.0, toIdleProbability: 0.003 },
    { state: 'idle8stillness', spawnWeight: 0.2, toIdleProbability: 0.003 },
    { state: 'idle9stillness', spawnWeight: 0.1, toIdleProbability: 0.003 },
  ],

  // When transitioning out of stillness, pick one of these idle animations.
  idleTransitions: [
    { state: 'idle1', weight: 0.34 },
    { state: 'idle2', weight: 0.33 },
    { state: 'idle3', weight: 0.33 },
  ],

  idleToStillnessProbability: 0.05,

  scoot: {
    probability: 0.001,
    // Distances are scaled by window width at runtime; these are the reference values.
    referenceMinDistance: 300,
    referenceMaxDistance: 100,
    referenceHopDistance: 20,
  },

  easterEgg: {
    spawnFrequency: 3,   // 1 in N flight cycles spawns an easter-egg bird
    idleDuration: 1000,  // frames to remain idle before flying away
    types: ['sai', 'audrey', 'b'],
  },

  // MTA train data drives bird flight. Toggleable with the 'T' key.
  reactToTrainData: false,

  // Center-mask covering the pole between train-car windows. Toggled with 'R'.
  // Position/width are tweaked live with arrow keys and persisted to
  // localStorage; 'E' exports the current config as JSON.
  mask: {
    enabledByDefault: true,
    defaultCenterXRatio: 0.484375,  // fraction of canvas width
    defaultWidthRatio: 0.07291667,  // fraction of canvas width
    widthStep: 10,                  // pixels per Up/Down press
    moveStep: 10,                   // pixels per Left/Right press
    minWidth: 0,
    storageKey: 'flocking.mask.v1',
  },

  mta: {
    apis: {
      grandSt: 'https://goodservice.io/api/stops/D22',
      canalSt: 'https://goodservice.io/api/stops/Q01',
      dekalbAv: 'https://goodservice.io/api/stops/R30',
      atlanticAv: 'https://goodservice.io/api/stops/R31',
    },
    pollIntervalMs: 10_000,
    // Trigger a flight when an inbound train's ETA falls inside one of these
    // windows (seconds). Tuned so birds depart roughly when the train passes
    // the installation site in DUMBO.
    triggerWindows: {
      D_north: { min: 185, max: 200 }, // D uptown (to Grand St)
      D_south: { min: 315, max: 330 }, // D downtown (to Atlantic Av)
      Q_north: { min: 300, max: 315 }, // Q uptown (to Canal St)
      Q_south: { min: 225, max: 240 }, // Q downtown (to Dekalb Av)
      N_north: { min: 240, max: 255 }, // N uptown (to Canal St)
      N_south: { min: 370, max: 385 }, // N downtown (to Atlantic Av)
      B_south: { min: 200, max: 210 }, // B downtown (to Dekalb Av)
    },
  },
};
