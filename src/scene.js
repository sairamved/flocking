// Live, on-site scene adjustments: per-wire vertical position, bird scale,
// and the keybindings that drive them. The mask lives in its own module
// (mask.js) but its config is folded into the same export JSON via E.
//
// Controls:
//   1..6        Select / deselect wire N (then Up/Down nudges that wire)
//   ] / [       Increase / decrease bird scale (all birds, live)
//
// State here is canonical — wires.js, bird.js, and sketch.js read y-positions
// and bird dimensions through the helpers below instead of computing them
// inline.

let wireYOffsets = [];          // pixels added to each wire's baseline y
let birdScaleMultiplier = 1;    // multiplier on bird dimensions
let selectedWireIndex = -1;     // -1 = none selected
let birdCountEditMode = false;  // N enters this; Up/Down ±1 bird

function initScene() {
  birdScaleMultiplier = config.scene.birdScaleDefault;
  wireYOffsets = buildDefaultWireOffsets();
}

function buildDefaultWireOffsets() {
  const n = config.flock.numWires;
  const defaults = config.scene.wireYOffsetsDefault || [];
  const out = new Array(n).fill(0);
  for (let i = 0; i < n && i < defaults.length; i++) out[i] = defaults[i];
  return out;
}

// Canonical y for the wire line itself (where the line is rendered).
function wireBaseY(i) {
  return margin + i * spacingY + birdHeight / 2.8 + (wireYOffsets[i] || 0);
}

// Canonical y for a bird's top-left when perched on wire i.
function birdTargetYForWire(i) {
  return margin + i * spacingY - birdHeight / 4 + (wireYOffsets[i] || 0);
}

function isWireSelected(i) {
  return selectedWireIndex === i;
}

function selectedWireMarkerY() {
  if (selectedWireIndex < 0) return null;
  return wireBaseY(selectedWireIndex);
}

// Re-snap every settled bird (and the easter egg, if perched) to their wire's
// current target y. Called after wire offsets or bird scale changes.
function resnapBirdsToWires() {
  birds.forEach((b) => {
    const newY = birdTargetYForWire(b.wireIndex);
    b.originalPosition.y = newY;
    if (!b.motion) {
      b.position.y = newY;
      b.targetPosition.y = newY;
    } else if (b.returnTime !== -1) {
      // Mid-return — update the target so they land at the new position.
      b.targetPosition.y = newY;
    }
  });
  if (easterEggBird) {
    const newY = birdTargetYForWire(easterEggBird.wireIndex);
    if (easterEggBird.state === 'idle' || easterEggBird.state === 'landing') {
      easterEggBird.position.y = newY;
    }
    easterEggBird.targetPosition.y = newY;
  }
}

function nudgeSelectedWire(direction) {
  if (selectedWireIndex < 0) return false;
  wireYOffsets[selectedWireIndex] += direction * config.scene.wireYStep;
  resnapBirdsToWires();
  return true;
}

function adjustBirdScale(direction) {
  const { birdScaleMin, birdScaleMax, birdScaleStep } = config.scene;
  birdScaleMultiplier = constrain(
    birdScaleMultiplier + direction * birdScaleStep,
    birdScaleMin,
    birdScaleMax,
  );
  // computeLayout reads birdScaleMultiplier when sizing birds.
  computeLayout();
  resnapBirdsToWires();
  return true;
}

// Add one bird to a wire chosen at random. Picks a non-colliding x via the
// existing spawn helper. Honors birdCountMax.
function addOneBird() {
  if (birds.length >= config.scene.birdCountMax) return false;
  const wireIndex = floor(random(0, config.flock.numWires));
  const y = birdTargetYForWire(wireIndex);
  const x = pickSpawnXForWire(y, wireIndex);
  const frameOffset = floor(random(0, frameCounts.idle1));
  const stillnessState = assignStillnessState();
  const flyingType = random() < config.flock.flying2Percentage ? 2 : 1;
  birds.push(new Bird(x, y, frameOffset, stillnessState, flyingType, wireIndex));
  return true;
}

// Remove one bird. Prefer a settled (perched) one so we don't yank a bird
// mid-flight. If none are settled, remove the last in the array.
function removeOneBird() {
  if (birds.length <= config.scene.birdCountMin) return false;
  let idx = birds.findIndex((b) => b.arrived && !b.motion && !b.scooting);
  if (idx < 0) idx = birds.length - 1;
  birds.splice(idx, 1);
  return true;
}

// Handle scene-related key input. Returns true if the key was consumed.
function handleSceneKey(k, code) {
  const controls = config.controls;

  if (matchesBinding(controls.birdScaleUp, k, code)) return adjustBirdScale(+1);
  if (matchesBinding(controls.birdScaleDown, k, code)) return adjustBirdScale(-1);

  // Bird-count edit toggle.
  if (matchesBinding(controls.toggleBirdCountEdit, k, code)) {
    birdCountEditMode = !birdCountEditMode;
    console.log('bird-count edit mode:', birdCountEditMode);
    return true;
  }

  // Wire select: pressing the same number toggles deselect.
  const wireKeys = controls.selectWires || [];
  for (let i = 0; i < wireKeys.length && i < config.flock.numWires; i++) {
    if (matchesBinding(wireKeys[i], k, code)) {
      selectedWireIndex = selectedWireIndex === i ? -1 : i;
      console.log('wire selected:', selectedWireIndex);
      return true;
    }
  }

  // Up/Down in bird-count edit mode ±1 bird.
  if (birdCountEditMode) {
    if (code === UP_ARROW) {
      const ok = addOneBird();
      if (ok) console.log('bird added; total:', birds.length);
      return true;
    }
    if (code === DOWN_ARROW) {
      const ok = removeOneBird();
      if (ok) console.log('bird removed; total:', birds.length);
      return true;
    }
  }

  // Up/Down nudge the selected wire (only when one is selected).
  if (selectedWireIndex >= 0) {
    if (code === UP_ARROW) return nudgeSelectedWire(-1);
    if (code === DOWN_ARROW) return nudgeSelectedWire(+1);
  }

  return false;
}

// A subtle visual hint of which wire is selected — small ticks at the edges.
function drawSelectedWireMarker() {
  if (selectedWireIndex < 0) return;
  const y = wireBaseY(selectedWireIndex);
  push();
  noStroke();
  fill(255, 80, 80);
  const r = max(4, birdHeight * 0.04);
  circle(10, y, r);
  circle(width - 10, y, r);
  pop();
}

// ----- Serialization (folded into the E-export JSON in mask.js) -----

function currentSceneAdjustments() {
  return {
    birdScaleMultiplier,
    wireYOffsets: wireYOffsets.slice(0, config.flock.numWires),
    birdCount: birds.length,
  };
}

function applySceneAdjustments(cfg) {
  if (!cfg || typeof cfg !== 'object') return;
  if (typeof cfg.birdScaleMultiplier === 'number') {
    const { birdScaleMin, birdScaleMax } = config.scene;
    birdScaleMultiplier = constrain(cfg.birdScaleMultiplier, birdScaleMin, birdScaleMax);
    computeLayout();
  }
  if (Array.isArray(cfg.wireYOffsets)) {
    const n = config.flock.numWires;
    for (let i = 0; i < n; i++) {
      wireYOffsets[i] = typeof cfg.wireYOffsets[i] === 'number' ? cfg.wireYOffsets[i] : 0;
    }
  }
  if (typeof cfg.birdCount === 'number') {
    const target = constrain(Math.round(cfg.birdCount), config.scene.birdCountMin, config.scene.birdCountMax);
    while (birds.length < target && addOneBird()) {}
    while (birds.length > target && removeOneBird()) {}
  }
  resnapBirdsToWires();
}
