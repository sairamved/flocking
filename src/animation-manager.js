class AnimationManager {
  constructor(flyingType) {
    this.frameCounts = frameCounts;
    this.animations = animations;
    this.frameSpeed = config.timing.globalFrameSpeed;
    this.flyingType = flyingType;
    this.currentState = 'idle1stillness';
    this.baseStillnessState = 'idle1stillness';
    this.outLeftStartFrame = -1;
    this.hasOutLeftPlayed = false;
    this.landingStartFrame = -1;
    this.lastCycleFrame = -1;
  }

  getFrame(frameOffset) {
    const frameSet = this.animations[this.currentState];
    const limit = this.frameCounts[this.currentState];
    const idx = (floor(frameCount / this.frameSpeed) + frameOffset) % limit;
    return frameSet[idx];
  }

  getCurrentFrameIndex() {
    const limit = this.frameCounts[this.currentState];
    return floor(frameCount / this.frameSpeed) % limit;
  }

  setState(state) {
    if (!this.animations[state]) return;
    this.currentState = state;
    this.lastCycleFrame = -1;
    if (state === 'outLeft1') {
      this.outLeftStartFrame = frameCount;
      this.hasOutLeftPlayed = false;
    } else if (state === 'landing1') {
      this.landingStartFrame = frameCount;
    } else if (state.includes('stillness')) {
      this.baseStillnessState = state;
    }
  }

  // Once per animation cycle, decide whether to transition between
  // stillness ↔ active idle.
  updateIdle() {
    const limit = this.frameCounts[this.currentState];
    const frameIndex = floor(frameCount / this.frameSpeed) % limit;

    // Only decide on cycle boundary, and only once per frameCount.
    if (frameIndex !== 0 || this.lastCycleFrame === frameCount) return;
    this.lastCycleFrame = frameCount;

    const stillnessEntry = config.stillness.find((s) => s.state === this.currentState);
    if (stillnessEntry) {
      if (random() < stillnessEntry.toIdleProbability) {
        this.setState(weightedPick(config.idleTransitions, 'state', 'weight'));
      }
      return;
    }

    if (isActiveIdleState(this.currentState) && random() < config.idleToStillnessProbability) {
      this.setState(this.baseStillnessState);
    }
  }

  updateFlight() {
    const flying = `flying${this.flyingType}`;
    if (this.currentState !== flying) this.setState(flying);
  }

  updateLanding() {
    if (this.currentState !== 'landing1' || this.landingStartFrame < 0) return;
    const elapsed = frameCount - this.landingStartFrame;
    const landingFrames = this.frameCounts.landing1 * this.frameSpeed;
    if (elapsed >= landingFrames) {
      this.setState(this.baseStillnessState);
      this.landingStartFrame = -1;
    }
  }

  resetFlight() {
    this.outLeftStartFrame = -1;
    this.hasOutLeftPlayed = false;
    this.landingStartFrame = -1;
  }
}

class EasterEggAnimationManager {
  constructor(type) {
    this.frameCounts = frameCounts;
    this.animations = animations;
    this.frameSpeed = config.timing.globalFrameSpeed;
    this.type = type; // 'sai' | 'audrey' | 'b'
    this.currentState = `${type}FlyingBack`;
    this.landingStartFrame = -1;
  }

  getFrame(frameOffset) {
    const frameSet = this.animations[this.currentState];
    const limit = this.frameCounts[this.currentState];
    const idx = (floor(frameCount / this.frameSpeed) + frameOffset) % limit;
    return frameSet[idx];
  }

  getCurrentFrameIndex() {
    const limit = this.frameCounts[this.currentState];
    return floor(frameCount / this.frameSpeed) % limit;
  }

  setState(state) {
    if (!this.animations[state]) return;
    this.currentState = state;
    if (state === `${this.type}Landing`) {
      this.landingStartFrame = frameCount;
    }
  }

  updateLanding() {
    if (this.currentState !== `${this.type}Landing` || this.landingStartFrame < 0) return;
    const elapsed = frameCount - this.landingStartFrame;
    const landingFrames = this.frameCounts[`${this.type}Landing`] * this.frameSpeed;
    if (elapsed >= landingFrames) {
      this.setState(`${this.type}Idle`);
      this.landingStartFrame = -1;
    }
  }
}

function isActiveIdleState(state) {
  return /^idle[1-8]$/.test(state);
}

// Pick an entry from a [{key, weight}, ...] list using p5's random().
// Caller passes the field names so the same helper works for stillness-spawn
// and idle-transition tables.
function weightedPick(entries, valueField, weightField) {
  const total = entries.reduce((sum, e) => sum + e[weightField], 0);
  let r = random() * total;
  for (const entry of entries) {
    r -= entry[weightField];
    if (r <= 0) return entry[valueField];
  }
  return entries[entries.length - 1][valueField];
}

function assignStillnessState() {
  return weightedPick(config.stillness, 'state', 'spawnWeight');
}
