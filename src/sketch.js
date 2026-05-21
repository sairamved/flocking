// Entry point. p5 runs in global mode and calls preload() / setup() / draw()
// from this file. Everything else lives in sibling files loaded before this
// one in index.html.

// Live flock state.
let birds = [];
let easterEggBird = null;
let easterEggCycleCount = 0;
let hasSpawnedInCycle = false;

// Flight cycle state. `lastMousePressTime` is the canonical "flight started at"
// timestamp — kept under that name because Bird/wire code reads it directly.
let allBirdsGone = false;
let allGoneTime = -1000;
let lastMousePressTime = -1000;

// Wire state. Index 0 is the topmost wire.
let wireVibrations = [];

// Sized in setup(); rescaled in windowResized().
let birdWidth;
let birdHeight;
let margin;
let spacingY;
let minScootDistance;
let maxScootDistance;
let scootHopDistance;

// Toggled with the 'T' key.
let reactToTrainData = config.reactToTrainData;

function preload() {
  preloadAnimations();
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  initScene();
  computeLayout();

  initBorder();
  spawnFlock();
  initWireVibrations();
  initMask();
  startMtaPolling();

  // Projection display — no mouse cursor, no context menu (right-click would
  // overlay a system menu and break the visual).
  window.addEventListener('contextmenu', (e) => e.preventDefault());
}

function draw() {
  background(0);
  drawWires();

  handleAllBirdsGoneTransition();
  stopVibrationOnLandedWires();
  resetFlightCycleIfSettled();
  maybeSpawnEasterEgg();

  const shouldDeleteEasterEgg = easterEggBird ? easterEggBird.update() : false;

  maybeTriggerFromTrainData();

  birds.forEach((bird) => {
    bird.update();
    bird.display();
  });

  if (easterEggBird) {
    easterEggBird.display();
    if (shouldDeleteEasterEgg) easterEggBird = null;
  }

  drawMask();
  drawBorder();
  drawSelectedWireMarker();
}

function mousePressed() {
  if (!reactToTrainData) triggerBirdFlight();
}

// Match a pressed key against a binding string from config.controls.
// Letter bindings ('T', 'r') match case-insensitively; arrow bindings
// ('UP'/'DOWN'/'LEFT'/'RIGHT') match the corresponding p5 keyCode.
function matchesBinding(binding, k, code) {
  if (!binding) return false;
  const arrows = { UP: UP_ARROW, DOWN: DOWN_ARROW, LEFT: LEFT_ARROW, RIGHT: RIGHT_ARROW };
  const upper = binding.toUpperCase();
  if (upper in arrows) return code === arrows[upper];
  return typeof k === 'string' && k.toUpperCase() === upper;
}

function keyPressed() {
  if (matchesBinding(config.controls.toggleTrainData, key, keyCode)) {
    reactToTrainData = !reactToTrainData;
    console.log('reactToTrainData toggled to:', reactToTrainData);
    return;
  }
  if (matchesBinding(config.controls.toggleMute, key, keyCode)) {
    toggleFlightAudioMute();
    return;
  }
  // Edit modes (border, wire-select, bird-count) are mutually exclusive —
  // entering one exits the others. Each consumes arrow keys only while
  // active; otherwise arrows fall through to the mask.
  if (handleBorderKey(key, keyCode)) {
    if (borderEditMode) {
      selectedWireIndex = -1;
      birdCountEditMode = false;
    }
    return;
  }
  if (handleSceneKey(key, keyCode)) {
    if (selectedWireIndex >= 0 || birdCountEditMode) borderEditMode = false;
    if (birdCountEditMode && selectedWireIndex >= 0) selectedWireIndex = -1;
    return;
  }
  handleMaskKey(key, keyCode);
}

function windowResized() {
  const prevWidth = width;
  resizeCanvas(windowWidth, windowHeight);
  const oldBirdWidth = birdWidth;
  computeLayout();
  onWindowResizedMask(prevWidth);

  birds.forEach((bird) => {
    bird.wireIndex = constrain(bird.wireIndex, 0, config.flock.numWires - 1);
    const newY = birdTargetYForWire(bird.wireIndex);
    bird.originalPosition.y = newY;
    bird.position.y = newY;
    bird.targetPosition.y = newY;

    if (!bird.motion) {
      const xRatio = bird.position.x / (windowWidth - oldBirdWidth);
      bird.position.x = constrain(xRatio * (windowWidth - birdWidth), 0, windowWidth - margin - birdWidth);
      bird.targetPosition.x = bird.position.x;
    }
  });

  if (easterEggBird) {
    easterEggBird.wireIndex = constrain(easterEggBird.wireIndex, 0, config.flock.numWires - 1);
    const newY = birdTargetYForWire(easterEggBird.wireIndex);
    easterEggBird.position.y = newY;
    easterEggBird.targetPosition.y = newY;
    if (easterEggBird.state !== 'flying') {
      const xRatio = easterEggBird.position.x / (windowWidth - oldBirdWidth);
      easterEggBird.position.x = constrain(
        xRatio * (windowWidth - birdWidth),
        0,
        windowWidth - margin - birdWidth,
      );
      easterEggBird.targetPosition.x = easterEggBird.position.x;
    }
  }
}

// Recompute screen-derived sizes. Called in setup(), on resize, and whenever
// the live bird-scale multiplier changes.
function computeLayout() {
  margin = width / 10;
  const scaleFactor = windowWidth / config.flock.referenceWindowWidth;
  const m = typeof birdScaleMultiplier === 'number' ? birdScaleMultiplier : 1;

  const minW = config.flock.referenceBirdWidth * 0.5 * m;
  const minH = config.flock.referenceBirdHeight * 0.5 * m;
  birdWidth = max(minW, config.flock.referenceBirdWidth * scaleFactor * m);
  birdHeight = max(minH, config.flock.referenceBirdHeight * scaleFactor * m);

  minScootDistance = config.scoot.referenceMinDistance * scaleFactor;
  maxScootDistance = config.scoot.referenceMaxDistance * scaleFactor;
  scootHopDistance = config.scoot.referenceHopDistance * scaleFactor;

  spacingY = (height - margin) / config.flock.numWires;
}

// Place birds across the four wires. At least one bird per wire; the rest are
// distributed at random. A small percentage get the alternate "flying2" sprite.
function spawnFlock() {
  const { numWires, flying2Percentage } = config.flock;
  const numBirdsTotal = config.scene.birdCountDefault ?? config.flock.numBirdsTotal;
  const birdsPerWire = Array(numWires).fill(1);

  let remaining = numBirdsTotal - numWires;
  while (remaining > 0) {
    birdsPerWire[floor(random(0, numWires))]++;
    remaining--;
  }

  const totalBirds = birdsPerWire.reduce((sum, n) => sum + n, 0);
  const flying2Target = Math.round(flying2Percentage * totalBirds);
  let flying2Assigned = 0;

  for (let j = 0; j < numWires; j++) {
    for (let i = 0; i < birdsPerWire[j]; i++) {
      const y = birdTargetYForWire(j);
      const x = pickSpawnXForWire(y, i);
      const frameOffset = floor(random(0, frameCounts.idle1));
      const stillnessState = assignStillnessState();
      const flyingType = flying2Assigned < flying2Target ? 2 : 1;
      birds.push(new Bird(x, y, frameOffset, stillnessState, flyingType, j));
      if (flyingType === 2) flying2Assigned++;
    }
  }
}

function pickSpawnXForWire(y, fallbackIndex) {
  const xMin = birdSafeXMin();
  const xMax = max(xMin, birdSafeXMax());
  let x;
  let attempts = 0;
  do {
    x = random(xMin, xMax);
    attempts++;
  } while (
    (isInMaskedBand(x) ||
      birds.some(
        (b) => Math.abs(b.position.x - x) < birdWidth * 0.75 && b.position.y === y,
      )) &&
    attempts < 50
  );
  return attempts >= 50 ? constrain(fallbackIndex * birdWidth, xMin, xMax) : x;
}

function handleAllBirdsGoneTransition() {
  if (!allBirdsGone && birds.every((b) => b.isOffScreen())) {
    allBirdsGone = true;
    allGoneTime = frameCount;
    easterEggCycleCount++;
    console.log('All birds gone at frame:', frameCount, 'Cycle count:', easterEggCycleCount);
    seedManglePoints();
  }
}

// When a bird lands back on its wire, kill that wire's vibration so it goes
// still while the rest of the flock returns.
function stopVibrationOnLandedWires() {
  for (let i = 0; i < config.flock.numWires; i++) {
    if (
      wireVibrations[i].amplitude > 0 &&
      birds.some((b) => b.wireIndex === i && b.arrived && b.triggerTime === -1)
    ) {
      resetWire(i);
    }
  }
}

function resetFlightCycleIfSettled() {
  if (birds.every((b) => b.arrived && b.triggerTime === -1)) {
    allBirdsGone = false;
    allGoneTime = -1000;
    lastMousePressTime = -1000;
  }
}

// Cameo birds appear once per N flight cycles, only when the regular flock is
// fully settled.
function maybeSpawnEasterEgg() {
  const eligibleCycle = easterEggCycleCount % config.easterEgg.spawnFrequency === 0;
  if (!eligibleCycle) {
    hasSpawnedInCycle = false;
    return;
  }

  const flockSettled = birds.every((b) => b.arrived && !b.motion && !b.scooting);
  if (easterEggBird || hasSpawnedInCycle || !flockSettled) return;

  const types = config.easterEgg.types;
  const type = types[floor(random(0, types.length))];
  const wireIndex = floor(random(0, config.flock.numWires));
  const y = birdTargetYForWire(wireIndex);

  // Same minimum-separation rule as regular birds (see Bird.isTooClose):
  // tight clustering OK, exact overlap not OK.
  const minSeparation = birdWidth * 0.25;
  const collides = (cx) =>
    isInMaskedBand(cx) ||
    birds.some(
      (b) => Math.abs(b.position.x - cx) < minSeparation && Math.abs(b.position.y - y) < birdHeight / 2,
    );

  const xMin = birdSafeXMin();
  const xMax = max(xMin, birdSafeXMax());
  let x;
  let attempts = 0;
  do {
    x = random(xMin, xMax);
    attempts++;
  } while (collides(x) && attempts < 50);

  // Fallback: linear scan for the first non-colliding slot.
  if (attempts >= 50) {
    x = xMin;
    while (x < xMax && collides(x)) x += birdWidth / 4;
  }

  easterEggBird = new EasterEggBird(type, x, y, wireIndex);
  hasSpawnedInCycle = true;
}

function maybeTriggerFromTrainData() {
  if (!reactToTrainData) return;
  if (!birds.some((b) => b.arrived && !b.motion)) return;

  const train = findTriggeringTrain();
  if (!train) return;

  console.log(
    `Triggered to ${train.route} ${train.direction} ${train.station} ${train.etaFormatted}`,
  );
  triggerBirdFlight();
}

// Schedule the entire flock to take off over the next ~2.5 seconds.
function triggerBirdFlight() {
  allBirdsGone = false;
  allGoneTime = -1000;
  lastMousePressTime = frameCount;
  triggerVibration();
  playFlightAudio();

  for (let i = 0; i < config.flock.numWires; i++) {
    wireVibrations[i].stopTime = -1000;
  }

  birds.forEach((bird) => {
    bird.scooting = false;
    bird.scootTarget = null;
    bird.hasHoppedFirst = false;
    bird.hasHoppedSecond = false;
    bird.triggerTime = frameCount + floor(random(0, 150));
    bird.returnTime = -1;
    bird.motion = true;
    bird.arrived = false;
    bird.velocity.set(random(-bird.maxOutSpeed, -bird.maxOutSpeed / 2), random(-2, 2));
    bird.animation.resetFlight();
    bird.animation.setState(`flying${bird.animation.flyingType}`);
  });

  if (easterEggBird) easterEggBird.triggerFlight();
}
