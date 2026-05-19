// The wires the birds sit on. Three behaviors layered together:
//   1. Idle: straight line.
//   2. Pluck: high-frequency sine + elastic bell when birds take flight.
//   3. Undulation: slow rolling deformation while all birds are off-screen,
//      blended in via `transitionProgress` and faded out via `returnProgress`.

function initWireVibrations() {
  for (let i = 0; i < config.flock.numWires; i++) {
    wireVibrations[i] = blankWireState();
  }
}

function blankWireState() {
  return {
    amplitude: 0,
    frequency: 0,
    startTime: -1000,
    lastVibrationTime: -1000,
    baseAmplitude: 0,
    pluckPhase: 0,
    manglePoints: [],
    elasticMultiplier: 0.1,
    vibrationMultiplier: 1,
    stopTime: -1000,
  };
}

function resetWire(i) {
  wireVibrations[i].amplitude = 0;
  wireVibrations[i].elasticMultiplier = 0.1;
  wireVibrations[i].vibrationMultiplier = 1;
  wireVibrations[i].stopTime = -1000;
  wireVibrations[i].startTime = -1000;
  wireVibrations[i].lastVibrationTime = -1000;
  wireVibrations[i].manglePoints = [];
}

function drawWires() {
  for (let i = 0; i < config.flock.numWires; i++) {
    const baseY = wireBaseY(i);
    const elapsed = frameCount - wireVibrations[i].startTime;

    const transitionProgress = allBirdsGone ? min((frameCount - allGoneTime) / 60, 1) : 0;

    const returnDelay = config.timing.returnDelay;
    const returnTransitionPercentage = config.timing.returnTransitionPercentage;
    const returnProgress =
      lastMousePressTime >= 0 && allBirdsGone
        ? constrain(
            (frameCount - (lastMousePressTime + returnDelay * returnTransitionPercentage)) /
              (returnDelay * (1 - returnTransitionPercentage)),
            0,
            1,
          )
        : 0;

    drawSingleWire(baseY, i, elapsed, transitionProgress, returnProgress);
  }
}

function drawSingleWire(y, i, elapsed, transitionProgress, returnProgress) {
  const wire = wireVibrations[i];

  push();
  translate(0, y);
  noFill();
  stroke(255);
  strokeWeight(height / 200);

  beginShape();
  for (let x = 0; x <= width; x += 5) {
    let yOffset = 0;

    if (wire.amplitude > 0) {
      const progress = map(x, 0, width, 0, 1);
      const rampUpProgress = min(elapsed / 60, 1); // 1s ramp-up at 60fps

      let currentAmplitude = wire.amplitude * rampUpProgress;
      let currentFrequency = lerp(config.vibration.frequency * 0.5, wire.frequency, rampUpProgress);
      const currentElasticMultiplier = wire.elasticMultiplier * rampUpProgress;

      let vibration = sin(x * currentFrequency + frameCount * config.vibration.speed);
      let elastic = sin(config.vibration.frequency * elapsed + wire.pluckPhase) * (1 - progress) * progress * 4;
      let baseEffect = vibration * wire.vibrationMultiplier + elastic * currentElasticMultiplier;

      // Slow rolling deformation around the mangle points (only while flock is gone).
      let mangleOffset = 0;
      if (allBirdsGone && wire.manglePoints.length > 0) {
        for (const point of wire.manglePoints) {
          const dist = abs(x - point.x);
          const curveStrength =
            exp(-pow(dist, 2) / (2 * pow(width * 0.15, 2))) * config.undulation.amplitude;
          point.offset = sin(elapsed * config.undulation.speed + point.x * config.undulation.frequency) * curveStrength;
          mangleOffset += point.offset / 2;
        }
      }

      let effect = lerp(baseEffect, baseEffect + mangleOffset, transitionProgress);
      if (returnProgress > 0) {
        // Fade undulation out and damp the pluck on return.
        effect = lerp(baseEffect + mangleOffset, baseEffect, returnProgress);
        const rampDownProgress = min(returnProgress, 1);
        currentAmplitude = lerp(currentAmplitude, currentAmplitude * 0.5, rampDownProgress);
        currentFrequency = lerp(currentFrequency, currentFrequency * 0.75, rampDownProgress);
        vibration = sin(x * currentFrequency + frameCount * config.vibration.speed);
        elastic = sin(config.vibration.frequency * elapsed + wire.pluckPhase) * (1 - progress) * progress * 4;
        baseEffect = vibration * wire.vibrationMultiplier + elastic * currentElasticMultiplier;
        effect = lerp(baseEffect + mangleOffset, baseEffect, returnProgress);
      }
      yOffset = currentAmplitude * effect;
    }

    vertex(x, yOffset);
  }
  endShape();
  pop();
}

// Pluck every wire when the flock takes flight. Slight per-wire offset on
// `beatPattern` produces a staggered pluck across the four wires.
function triggerVibration() {
  for (let i = 0; i < config.flock.numWires; i++) {
    const wire = wireVibrations[i];
    const beatPattern = [0, 1, 0, 1];
    const beatIndex = (frameCount + i) % beatPattern.length;
    const elapsed = frameCount - wire.startTime;

    if (wire.startTime === -1000 || elapsed < 0) {
      wire.baseAmplitude = beatPattern[beatIndex] === 1 ? random(0.5, 1) : random(1, 2);
      wire.frequency = config.vibration.frequency;
      wire.startTime = frameCount;
      wire.pluckPhase = random(0, TWO_PI);
      wire.elasticMultiplier = 0.1;
      wire.vibrationMultiplier = 1;
    }

    // Use the pre-reset `elapsed` so a fresh pluck (startTime was -1000) reads
    // as fully ramped-up. drawWires re-applies its own ramp from the new startTime.
    const rampUpProgress = min(elapsed / 60, 1);
    wire.amplitude = lerp(0, config.vibration.amplitude, rampUpProgress);
    wire.elasticMultiplier = lerp(0.1, 4, rampUpProgress);
    wire.vibrationMultiplier = 1;
    wire.lastVibrationTime = frameCount;
  }
}

// Three random points along each wire that the slow undulation deforms toward.
// Re-rolled every time the whole flock departs.
function seedManglePoints() {
  for (let i = 0; i < config.flock.numWires; i++) {
    wireVibrations[i].manglePoints = [
      { x: random(width * 0.2, width * 0.4), offset: 0 },
      { x: random(width * 0.4, width * 0.6), offset: 0 },
      { x: random(width * 0.6, width * 0.8), offset: 0 },
    ];
  }
}
