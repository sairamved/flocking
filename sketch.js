let numBirdsTotal = 16;
let numBirdsY = 4;
let birds = [];
let referenceWindowWidth = 1800;
let referenceBirdWidth = 250;
let referenceBirdHeight = 250;
let birdWidth;
let birdHeight;
let margin;
let spacingY;
let wireVibrations = [];
let allBirdsGone = false;
let allGoneTime = -1000;
let lastMousePressTime = -1000;
let returnDelay = 1500;
let globalFrameSpeed = 6;
let returnTransitionPercentage = 0.9;

// Easter egg bird variables
let easterEggSpawnFrequency = 3;
let easterEggIdleDuration = 1000;
let easterEggCycleCount = 0;
let easterEggBird = null;
let hasSpawnedInCycle = false;

// Vibration parameters
let vibrationAmplitude = 4;
let vibrationFrequency = 0.01;
let vibrationSpeed = 1;

// Undulation parameters
let undulationAmplitude = 22;
let undulationFrequency = 0.02;
let undulationSpeed = 0.1;

let reactToTrainData = true;

let flying2Percentage = 0.2;

let idle1stillnessProbability = 0.2;
let idle2stillnessProbability = 0.2;
let idle3stillnessProbability = 0.1;
let idle4stillnessProbability = 0.1;
let idle5stillnessProbability = 0.1;
let idle6stillnessProbability = 0.0;
let idle7stillnessProbability = 0.0;
let idle8stillnessProbability = 0.2;
let idle9stillnessProbability = 0.1;

let idle1stillnessToIdleProbability = 0.005;
let idle2stillnessToIdleProbability = 0.025;
let idle3stillnessToIdleProbability = 0.005;
let idle4stillnessToIdleProbability = 0.003;
let idle5stillnessToIdleProbability = 0.003;
let idle6stillnessToIdleProbability = 0.003;
let idle7stillnessToIdleProbability = 0.003;
let idle8stillnessToIdleProbability = 0.003;
let idle9stillnessToIdleProbability = 0.003;

let idleToStillnessProbability = 0.05;

let idle1TransitionProbability = 0.34;
let idle2TransitionProbability = 0.33;
let idle3TransitionProbability = 0.33;

let scootProbability = 0.001;
let minScootDistance;
let maxScootDistance;
let scootHopDistance;

let flyingOutSpeedRange = { min: 5, max: 10 };
let flyingBackSpeedRange = { min: 5, max: 10 };

let frameCounts = {
  idle1: 11,
  idle1stillness: 22,
  idle2: 13,
  idle2stillness: 9,
  idle3: 16,
  idle3stillness: 11,
  idle4: 18,
  idle4stillness: 14,
  idle5: 25,
  idle5stillness: 12,
  idle6: 20,
  idle6stillness: 11,
  idle7: 21,
  idle7stillness: 17,
  idle8: 14,
  idle8stillness: 20,
  idle9stillness: 15,
  landing1: 9,
  outLeft1: 7,
  scooting1: 12,
  scootingLeft: 12,
  scootingRight: 12,
  flying1: 6,
  flyingBack1: 6,
  flying2: 9,
  flyingBack2: 9,
  saiIdle: 11,
  saiLanding: 6,
  saiFlying: 6,
  saiFlyingBack: 6,
  audreyIdle: 11,
  audreyLanding: 6,
  audreyFlying: 6,
  audreyFlyingBack: 6,
  bIdle: 11,
  bLanding: 6,
  bFlying: 6,
  bFlyingBack: 6
};

let animations = {
  idle1: [],
  idle1stillness: [],
  idle2: [],
  idle2stillness: [],
  idle3: [],
  idle3stillness: [],
  idle4: [],
  idle4stillness: [],
  idle5: [],
  idle5stillness: [],
  idle6: [],
  idle6stillness: [],
  idle7: [],
  idle7stillness: [],
  idle8: [],
  idle8stillness: [],
  idle9stillness: [],
  landing1: [],
  outLeft1: [],
  scooting1: [],
  scootingLeft: [],
  scootingRight: [],
  flying1: [],
  flyingBack1: [],
  flying2: [],
  flyingBack2: [],
  saiIdle: [],
  saiLanding: [],
  saiFlying: [],
  saiFlyingBack: [],
  audreyIdle: [],
  audreyLanding: [],
  audreyFlying: [],
  audreyFlyingBack: [],
  bIdle: [],
  bLanding: [],
  bFlying: [],
  bFlyingBack: []
};

// MTA train timing variables
let timingsArray = [];
let allTrainETAs = [];
const APIS = {
  grandSt: 'https://goodservice.io/api/stops/D22',
  canalSt: 'https://goodservice.io/api/stops/Q01',
  dekalbAv: 'https://goodservice.io/api/stops/R30',
  atlanticAv: 'https://goodservice.io/api/stops/R31'
};

const trainTriggerWindows = {
  D_north: { min: 185, max: 200 }, // D uptown (to Grand St)
  D_south: { min: 315, max: 330 }, // D downtown (to Atlantic Av)
  Q_north: { min: 300, max: 315 }, // Q uptown (to Canal St)
  Q_south: { min: 225, max: 240 }, // Q downtown (to Dekalb Av)
  N_north: { min: 240, max: 255 }, // N uptown (to Canal St)
  N_south: { min: 360, max: 375 }, // N downtown (to Atlantic Av)
  B_south: { min: 200, max: 210 }  // B downtown (to Dekalb Av)
};

function preload() {
  // Regular bird animations
  for (let i = 0; i < frameCounts.idle1; i++) {
    animations.idle1[i] = loadImage(`assets/idle1/idle1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle1stillness; i++) {
    animations.idle1stillness[i] = loadImage(`assets/idle1-stillness/idle1-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle2; i++) {
    animations.idle2[i] = loadImage(`assets/idle2/idle2_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle2stillness; i++) {
    animations.idle2stillness[i] = loadImage(`assets/idle2-stillness/idle2-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle3; i++) {
    animations.idle3[i] = loadImage(`assets/idle3/idle3_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle3stillness; i++) {
    animations.idle3stillness[i] = loadImage(`assets/idle3-stillness/idle3-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle4; i++) {
    animations.idle4[i] = loadImage(`assets/idle4/idle4_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle4stillness; i++) {
    animations.idle4stillness[i] = loadImage(`assets/idle4-stillness/idle4-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle5; i++) {
    animations.idle5[i] = loadImage(`assets/idle5/idle5_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle5stillness; i++) {
    animations.idle5stillness[i] = loadImage(`assets/idle5-stillness/idle5-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle6; i++) {
    animations.idle6[i] = loadImage(`assets/idle6/idle6_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle6stillness; i++) {
    animations.idle6stillness[i] = loadImage(`assets/idle6-stillness/idle6-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle7; i++) {
    animations.idle7[i] = loadImage(`assets/idle7/idle7_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle7stillness; i++) {
    animations.idle7stillness[i] = loadImage(`assets/idle7-stillness/idle7-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle8; i++) {
    animations.idle8[i] = loadImage(`assets/idle8/idle8_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle8stillness; i++) {
    animations.idle8stillness[i] = loadImage(`assets/idle8-stillness/idle8-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle9stillness; i++) {
    animations.idle9stillness[i] = loadImage(`assets/idle9-stillness/idle9-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.landing1; i++) {
    animations.landing1[i] = loadImage(`assets/landing1/landing1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.outLeft1; i++) {
    animations.outLeft1[i] = loadImage(`assets/outLeft1/outLeft1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.scooting1; i++) {
    animations.scooting1[i] = loadImage(`assets/scooting1/scooting1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.scootingLeft; i++) {
    animations.scootingLeft[i] = loadImage(`assets/scootingLeft/scootingLeft_${i}.png`);
  }
  for (let i = 0; i < frameCounts.scootingRight; i++) {
    animations.scootingRight[i] = loadImage(`assets/scootingRight/scootingRight_${i}.png`);
  }
  for (let i = 0; i < frameCounts.flying1; i++) {
    animations.flying1[i] = loadImage(`assets/flying1/flying1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.flyingBack1; i++) {
    animations.flyingBack1[i] = loadImage(`assets/flyingBack1/flyingBack1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.flying2; i++) {
    animations.flying2[i] = loadImage(`assets/flying2/flying2_${i}.png`);
  }
  for (let i = 0; i < frameCounts.flyingBack2; i++) {
    animations.flyingBack2[i] = loadImage(`assets/flyingBack2/flyingBack2_${i}.png`);
  }

  // Easter egg bird animations
  for (let i = 0; i < frameCounts.saiIdle; i++) {
    animations.saiIdle[i] = loadImage(`assets/easterEggBirds/sai/idle/saiIdle_${i}.png`);
  }
  for (let i = 0; i < frameCounts.saiLanding; i++) {
    animations.saiLanding[i] = loadImage(`assets/easterEggBirds/sai/landing/saiLanding_${i}.png`);
  }
  for (let i = 0; i < frameCounts.saiFlying; i++) {
    animations.saiFlying[i] = loadImage(`assets/easterEggBirds/sai/flying/saiFlying_${i}.png`);
  }
  for (let i = 0; i < frameCounts.saiFlyingBack; i++) {
    animations.saiFlyingBack[i] = loadImage(`assets/easterEggBirds/sai/flyingBack/saiFlyingBack_${i}.png`);
  }
  for (let i = 0; i < frameCounts.audreyIdle; i++) {
    animations.audreyIdle[i] = loadImage(`assets/easterEggBirds/audrey/idle/audreyIdle_${i}.png`);
  }
  for (let i = 0; i < frameCounts.audreyLanding; i++) {
    animations.audreyLanding[i] = loadImage(`assets/easterEggBirds/audrey/landing/audreyLanding_${i}.png`);
  }
  for (let i = 0; i < frameCounts.audreyFlying; i++) {
    animations.audreyFlying[i] = loadImage(`assets/easterEggBirds/audrey/flying/audreyFlying_${i}.png`);
  }
  for (let i = 0; i < frameCounts.audreyFlyingBack; i++) {
    animations.audreyFlyingBack[i] = loadImage(`assets/easterEggBirds/audrey/flyingBack/audreyFlyingBack_${i}.png`);
  }
  for (let i = 0; i < frameCounts.bIdle; i++) {
    animations.bIdle[i] = loadImage(`assets/easterEggBirds/b/idle/bIdle_${i}.png`);
  }
  for (let i = 0; i < frameCounts.bLanding; i++) {
    animations.bLanding[i] = loadImage(`assets/easterEggBirds/b/landing/bLanding_${i}.png`);
  }
  for (let i = 0; i < frameCounts.bFlying; i++) {
    animations.bFlying[i] = loadImage(`assets/easterEggBirds/b/flying/bFlying_${i}.png`);
  }
  for (let i = 0; i < frameCounts.bFlyingBack; i++) {
    animations.bFlyingBack[i] = loadImage(`assets/easterEggBirds/b/flyingBack/bFlyingBack_${i}.png`);
  }
}

class AnimationManager {
  constructor(frameCounts, animations, flyingType) {
    this.frameCounts = frameCounts;
    this.animations = animations;
    this.currentState = 'idle1stillness';
    this.frameSpeed = globalFrameSpeed;
    this.baseStillnessState = 'idle1stillness';
    this.outLeftStartFrame = -1;
    this.hasOutLeftPlayed = false;
    this.landingStartFrame = -1;
    this.lastCycleFrame = -1;
    this.flyingType = flyingType;
  }

  getFrame(frameOffset) {
    let frameSet = this.animations[this.currentState];
    let frameCountLimit = this.frameCounts[this.currentState];
    let frameIndex = (floor(frameCount / this.frameSpeed) + frameOffset) % frameCountLimit;
    return frameSet[frameIndex];
  }

  getCurrentFrameIndex() {
    let frameCountLimit = this.frameCounts[this.currentState];
    return floor(frameCount / this.frameSpeed) % frameCountLimit;
  }

  setState(state) {
    if (this.animations[state]) {
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
  }

  updateIdle() {
    let frameCountLimit = this.frameCounts[this.currentState];
    let frameIndex = floor(frameCount / this.frameSpeed) % frameCountLimit;

    if (frameIndex === 0 && this.lastCycleFrame !== frameCount) {
      this.lastCycleFrame = frameCount;

      let rand = random();
      if (this.currentState === 'idle1stillness' && random() < idle1stillnessToIdleProbability) {
        if (rand < idle1TransitionProbability) {
          this.setState('idle1');
        } else if (rand < idle1TransitionProbability + idle2TransitionProbability) {
          this.setState('idle2');
        } else {
          this.setState('idle3');
        }
      } else if (this.currentState === 'idle2stillness' && random() < idle2stillnessToIdleProbability) {
        if (rand < idle1TransitionProbability) {
          this.setState('idle1');
        } else if (rand < idle1TransitionProbability + idle2TransitionProbability) {
          this.setState('idle2');
        } else {
          this.setState('idle3');
        }
      } else if (this.currentState === 'idle3stillness' && random() < idle3stillnessToIdleProbability) {
        if (rand < idle1TransitionProbability) {
          this.setState('idle1');
        } else if (rand < idle1TransitionProbability + idle2TransitionProbability) {
          this.setState('idle2');
        } else {
          this.setState('idle3');
        }
      } else if (this.currentState === 'idle4stillness' && random() < idle4stillnessToIdleProbability) {
        if (rand < idle1TransitionProbability) {
          this.setState('idle1');
        } else if (rand < idle1TransitionProbability + idle2TransitionProbability) {
          this.setState('idle2');
        } else {
          this.setState('idle3');
        }
      } else if (this.currentState === 'idle5stillness' && random() < idle5stillnessToIdleProbability) {
        if (rand < idle1TransitionProbability) {
          this.setState('idle1');
        } else if (rand < idle1TransitionProbability + idle2TransitionProbability) {
          this.setState('idle2');
        } else {
          this.setState('idle3');
        }
      } else if (this.currentState === 'idle6stillness' && random() < idle6stillnessToIdleProbability) {
        if (rand < idle1TransitionProbability) {
          this.setState('idle1');
        } else if (rand < idle1TransitionProbability + idle2TransitionProbability) {
          this.setState('idle2');
        } else {
          this.setState('idle3');
        }
      } else if (this.currentState === 'idle7stillness' && random() < idle7stillnessToIdleProbability) {
        if (rand < idle1TransitionProbability) {
          this.setState('idle1');
        } else if (rand < idle1TransitionProbability + idle2TransitionProbability) {
          this.setState('idle2');
        } else {
          this.setState('idle3');
        }
      } else if (this.currentState === 'idle8stillness' && random() < idle8stillnessToIdleProbability) {
        if (rand < idle1TransitionProbability) {
          this.setState('idle1');
        } else if (rand < idle1TransitionProbability + idle2TransitionProbability) {
          this.setState('idle2');
        } else {
          this.setState('idle3');
        }
      } else if (this.currentState === 'idle9stillness' && random() < idle9stillnessToIdleProbability) {
        if (rand < idle1TransitionProbability) {
          this.setState('idle1');
        } else if (rand < idle1TransitionProbability + idle2TransitionProbability) {
          this.setState('idle2');
        } else {
          this.setState('idle3');
        }
      } else if (this.currentState === 'idle1' ||
        this.currentState === 'idle2' ||
        this.currentState === 'idle3' ||
        this.currentState === 'idle4' ||
        this.currentState === 'idle5' ||
        this.currentState === 'idle6' ||
        this.currentState === 'idle7' ||
        this.currentState === 'idle8') {
        if (random() < idleToStillnessProbability) {
          this.setState(this.baseStillnessState);
        }
      }
    }
  }

  updateFlight() {
    // Ensure flying animation is active
    if (this.currentState !== `flying${this.flyingType}`) {
      this.setState(`flying${this.flyingType}`);
    }
  }

  updateLanding() {
    if (this.currentState === 'landing1' && this.landingStartFrame >= 0) {
      let framesElapsed = frameCount - this.landingStartFrame;
      let landingFrames = this.frameCounts.landing1 * this.frameSpeed;
      if (framesElapsed >= landingFrames) {
        this.setState(this.baseStillnessState);
        this.landingStartFrame = -1;
      }
    }
  }

  resetFlight() {
    this.outLeftStartFrame = -1;
    this.hasOutLeftPlayed = false;
    this.landingStartFrame = -1;
  }
}

class EasterEggAnimationManager {
  constructor(frameCounts, animations, type) {
    this.frameCounts = frameCounts;
    this.animations = animations;
    this.currentState = `${type}FlyingBack`;
    this.frameSpeed = globalFrameSpeed;
    this.landingStartFrame = -1;
    this.type = type; // sai, audrey, or b
  }

  getFrame(frameOffset) {
    let frameSet = this.animations[this.currentState];
    let frameCountLimit = this.frameCounts[this.currentState];
    let frameIndex = (floor(frameCount / this.frameSpeed) + frameOffset) % frameCountLimit;
    return frameSet[frameIndex];
  }

  getCurrentFrameIndex() {
    let frameCountLimit = this.frameCounts[this.currentState];
    return floor(frameCount / this.frameSpeed) % frameCountLimit;
  }

  setState(state) {
    if (this.animations[state]) {
      this.currentState = state;
      if (state === `${this.type}Landing`) {
        this.landingStartFrame = frameCount;
      }
    }
  }

  updateLanding() {
    if (this.currentState === `${this.type}Landing` && this.landingStartFrame >= 0) {
      let framesElapsed = frameCount - this.landingStartFrame;
      let landingFrames = this.frameCounts[`${this.type}Landing`] * this.frameSpeed;
      if (framesElapsed >= landingFrames) {
        this.setState(`${this.type}Idle`);
        this.landingStartFrame = -1;
      }
    }
  }
}

class Bird {
  constructor(x, y, frameOffset, stillnessState, flyingType) {
    this.originalPosition = createVector(x, y);
    this.position = createVector(x, y);
    this.targetPosition = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.frameOffset = frameOffset;
    this.animation = new AnimationManager(frameCounts, animations, flyingType);
    this.animation.setState(stillnessState);
    this.animation.baseStillnessState = stillnessState;
    this.motion = false;
    this.triggerTime = -1;
    this.returnTime = -1;
    this.maxOutSpeed = random(flyingOutSpeedRange.min, flyingOutSpeedRange.max);
    this.maxBackSpeed = random(flyingBackSpeedRange.min, flyingBackSpeedRange.max);
    this.currentMaxSpeed = this.maxOutSpeed;
    this.maxForce = 0.5;
    this.arrived = true;
    this.scooting = false;
    this.scootTarget = null;
    this.scootStartFrame = 0;
    this.hasHoppedFirst = false;
    this.hasHoppedSecond = false;
    this.wireIndex = Math.round((y - margin + birdHeight / 4) / spacingY);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.position);
    let distance = desired.mag();
    desired.normalize();
    if (distance < 50) {
      let m = map(distance, 0, 50, 0, this.currentMaxSpeed);
      desired.mult(m);
    } else {
      desired.mult(this.currentMaxSpeed);
    }
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  }

  generateNewTargetOnWire() {
    let attempts = 0;
    let maxAttempts = 50;
    let newX;
    let targetY = margin + this.wireIndex * spacingY - birdHeight / 4;

    do {
      newX = random(0, width - margin - birdWidth);
      attempts++;
    } while (this.isTooClose(newX, targetY) && attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      newX = this.findNearestAvailableSpot(targetY);
    }

    this.targetPosition.x = newX;
    this.targetPosition.y = targetY;
  }

  isTooClose(x, y) {
    for (let bird of birds) {
      if (bird !== this) {
        let dist = Math.abs(x - bird.position.x);
        if (dist < birdWidth * 0.75 && Math.abs(y - bird.position.y) < birdHeight / 2) {
          return true;
        }
      }
    }
    return false;
  }

  findNearestAvailableSpot(y) {
    let newX = 0;
    while (newX < width - margin - birdWidth) {
      if (!this.isTooClose(newX, y)) {
        return newX;
      }
      newX += birdWidth / 4;
    }
    return 0;
  }

  findClosestNeighbor() {
    let closest = null;
    let minDist = Infinity;
    let wireY = this.originalPosition.y;

    for (let bird of birds) {
      if (bird !== this && bird.originalPosition.y === wireY && bird.arrived) {
        let dist = abs(this.position.x - bird.position.x);
        if (dist < minDist) {
          minDist = dist;
          closest = bird;
        }
      }
    }
    return { bird: closest, distance: minDist };
  }

  updateScooting() {
    if (!this.arrived || this.motion) return;

    if (!this.scooting && (this.animation.currentState.includes('idle') || this.animation.currentState.includes('stillness'))) {
      if (random() < scootProbability) {
        let neighborInfo = this.findClosestNeighbor();
        if (neighborInfo.bird) {
          let dist = neighborInfo.distance;
          let neighborX = neighborInfo.bird.position.x;

          if (dist > minScootDistance) {
            this.scootTarget = this.position.x + (neighborX - this.position.x) * 0.5;
            this.scooting = true;
            this.animation.setState(this.scootTarget < this.position.x ? 'scootingLeft' : 'scootingRight');
            this.scootStartFrame = frameCount;
            this.hasHoppedFirst = false;
            this.hasHoppedSecond = false;
          } else if (dist < maxScootDistance) {
            let direction = this.position.x < neighborX ? -1 : 1;
            this.scootTarget = this.position.x + direction * (maxScootDistance / 2);
            this.scooting = true;
            this.animation.setState(this.scootTarget < this.position.x ? 'scootingLeft' : 'scootingRight');
            this.scootStartFrame = frameCount;
            this.hasHoppedFirst = false;
            this.hasHoppedSecond = false;
          }
        }
      }
    }

    if (this.scooting && this.scootTarget !== null) {
      let frameIndex = this.animation.getCurrentFrameIndex();
      let direction = this.scootTarget < this.targetPosition.x ? -1 : 1;

      if (frameIndex === 4 && !this.hasHoppedFirst) {
        this.position.x += direction * scootHopDistance;
        this.hasHoppedFirst = true;
      }
      else if (frameIndex === 8 && !this.hasHoppedSecond) {
        this.position.x += direction * scootHopDistance;
        this.hasHoppedSecond = true;
      }
      else if (frameIndex === 0 && this.hasHoppedSecond) {
        this.scooting = false;
        this.scootTarget = null;
        this.hasHoppedFirst = false;
        this.hasHoppedSecond = false;
        this.animation.setState(this.animation.baseStillnessState);
        this.targetPosition.x = this.position.x;
        this.originalPosition.x = this.position.x;
      }
    }
  }

  update() {
    if (!this.scooting && this.triggerTime >= 0 && frameCount >= this.triggerTime && this.returnTime === -1) {
      this.motion = true;
      this.arrived = false;
      this.scooting = false;
      this.scootTarget = null;
      this.animation.resetFlight();
      this.animation.setState(`flying${this.animation.flyingType}`); // Start flying1 or flying2
      this.currentMaxSpeed = this.maxOutSpeed;
      // Maintain velocity set in triggerBirdFlight
      if (this.velocity.mag() === 0) {
        this.velocity.set(random(-this.maxOutSpeed, -this.maxOutSpeed / 2), random(-2, 2));
      }
    }

    if (!this.scooting && lastMousePressTime >= 0 && frameCount >= lastMousePressTime + returnDelay && this.triggerTime !== -1 && this.returnTime === -1) {
      this.returnTime = frameCount + floor(random(0, 60));
      this.generateNewTargetOnWire();
    }

    if (this.motion) {
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);
      this.acceleration.mult(0);

      if (this.returnTime === -1) {
        // Ensure flying animation during flight phase
        if (this.animation.currentState !== `flying${this.animation.flyingType}`) {
          this.animation.setState(`flying${this.animation.flyingType}`);
        }
        // Maintain leftward movement until off-screen
        if (this.position.x > -birdWidth) {
          this.velocity.x = constrain(this.velocity.x, -this.maxOutSpeed, -this.maxOutSpeed / 2);
        }
      } else if (frameCount >= this.returnTime) {
        this.currentMaxSpeed = this.maxBackSpeed;
        let distance = p5.Vector.dist(this.position, this.targetPosition);
        if (distance < 50 && this.animation.currentState !== 'landing1') {
          this.animation.setState('landing1');
        } else if (this.animation.currentState === 'landing1') {
          this.animation.updateLanding();
        } else if (this.animation.currentState !== 'landing1') {
          this.animation.setState(`flyingBack${this.animation.flyingType}`);
        }

        let steering = this.seek(this.targetPosition);
        this.applyForce(steering);

        if (distance < 5 && this.animation.currentState !== 'landing1') {
          this.motion = false;
          this.velocity.set(0, 0);
          this.animation.setState(this.animation.baseStillnessState);
          this.arrived = true;
          this.triggerTime = -1;
          this.returnTime = -1;
          this.position.set(this.targetPosition);
          this.originalPosition.x = this.targetPosition.x;
        }
      }

      if (this.velocity.mag() < 0.2 && this.returnTime === -1 && this.position.x > -birdWidth) {
        this.velocity.set(random(-this.maxOutSpeed, -this.maxOutSpeed / 2), random(-2, 2));
      }
    } else {
      this.updateScooting();
      this.animation.updateIdle();
    }
  }

  display() {
    let frame = this.animation.getFrame(this.frameOffset);
    image(frame, this.position.x, this.position.y, birdWidth, birdHeight);
  }

  isOffScreen() {
    return this.position.x < -birdWidth;
  }
}

class EasterEggBird {
  constructor(type, x, y, wireIndex) {
    this.type = type; // sai, audrey, or b
    this.position = createVector(-birdWidth, y); // Start off-screen left
    this.targetPosition = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.frameOffset = floor(random(0, frameCounts[`${type}Idle`]));
    this.animation = new EasterEggAnimationManager(frameCounts, animations, type);
    this.state = 'flyingBack';
    this.maxSpeed = random(5, 10);
    this.maxForce = 0.5;
    this.idleStartFrame = -1;
    this.wireIndex = wireIndex;
    this.triggered = false;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  seek(target) {
    let desired = p5.Vector.sub(target, this.position);
    let distance = desired.mag();
    desired.normalize();
    if (distance < 50) {
      let m = map(distance, 0, 50, 0, this.maxSpeed);
      desired.mult(m);
    } else {
      desired.mult(this.maxSpeed);
    }
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  }

  isTooClose(x, y) {
    for (let bird of birds) {
      let dist = Math.abs(x - bird.position.x);
      if (dist < birdWidth * 0.75 && Math.abs(y - bird.position.y) < birdHeight / 2) {
        return true;
      }
    }
    return false;
  }

  update() {
    if (this.triggered) {
      this.state = 'flying';
      this.animation.setState(`${this.type}Flying`);
      this.targetPosition.set(-birdWidth * 2, this.position.y);
    }

    if (this.state === 'flyingBack') {
      let distance = p5.Vector.dist(this.position, this.targetPosition);
      if (distance < 50) {
        this.animation.setState(`${this.type}Landing`);
        this.state = 'landing';
      }
      let steering = this.seek(this.targetPosition);
      this.applyForce(steering);
    } else if (this.state === 'landing') {
      this.animation.updateLanding();
      if (this.animation.currentState === `${this.type}Idle`) {
        this.state = 'idle';
        this.idleStartFrame = frameCount;
        this.position.set(this.targetPosition);
        this.velocity.set(0, 0);
      } else {
        let steering = this.seek(this.targetPosition);
        this.applyForce(steering);
      }
    } else if (this.state === 'idle') {
      if (frameCount >= this.idleStartFrame + easterEggIdleDuration) {
        this.state = 'flying';
        this.animation.setState(`${this.type}Flying`);
        this.targetPosition.set(-birdWidth * 2, this.position.y);
      }
    } else if (this.state === 'flying') {
      let steering = this.seek(this.targetPosition);
      this.applyForce(steering);
    }

    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    if (this.isOffScreen() && this.state === 'flying') {
      return true; // Signal to delete
    }
    return false;
  }

  display() {
    let frame = this.animation.getFrame(this.frameOffset);
    image(frame, this.position.x, this.position.y, birdWidth, birdHeight);
  }

  isOffScreen() {
    return this.position.x < -birdWidth;
  }

  triggerFlight() {
    this.triggered = true;
  }
}

function assignStillnessState() {
  let rand = random();
  if (rand < idle1stillnessProbability) return "idle1stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability) return "idle2stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability + idle3stillnessProbability) return "idle3stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability + idle3stillnessProbability + idle4stillnessProbability) return "idle4stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability + idle3stillnessProbability + idle4stillnessProbability + idle5stillnessProbability) return "idle5stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability + idle3stillnessProbability + idle4stillnessProbability + idle5stillnessProbability + idle6stillnessProbability) return "idle6stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability + idle3stillnessProbability + idle4stillnessProbability + idle5stillnessProbability + idle6stillnessProbability + idle7stillnessProbability) return "idle7stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability + idle3stillnessProbability + idle4stillnessProbability + idle5stillnessProbability + idle6stillnessProbability + idle7stillnessProbability + idle8stillnessProbability) return "idle8stillness";
  else return "idle9stillness";
}

// Function to format time difference
function formatTimeDiff(seconds) {
  if (seconds < 0) {
    return 'Departed';
  } else if (seconds < 60) {
    return `${Math.floor(seconds)}s`;
  } else {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  }
}

// Function to get station name from stop ID
function getStationName(stopId) {
  switch (stopId) {
    case 'D03': return 'Rockefeller Ctr';
    case 'D43': return 'Coney Island';
    default: return stopId;
  }
}

// Process trains data
function processTrains(trains, stationName, direction) {
  const currentTime = Math.floor(Date.now() / 1000);
  const trainData = [];
  const logData = [];

  trains.forEach(train => {
    if (train.estimated_current_stop_arrival_time) {
      const etaSeconds = train.estimated_current_stop_arrival_time - currentTime;
      const etaFormatted = formatTimeDiff(etaSeconds);
      // Collect data for logging only if ETA <= 10 minutes
      if (etaSeconds <= 600) {
        logData.push({
          route: train.route_id,
          direction,
          station: stationName,
          eta: etaFormatted
        });
      }
      // Collect full data for allTrainETAs
      trainData.push({
        id: train.id,
        station: stationName,
        direction,
        route: train.route_id,
        destination: getStationName(train.destination_stop),
        etaSeconds,
        etaFormatted,
        fullData: train
      });
    }
  });

  return { trainData, logData };
}

// Fetch and update all train timings
async function updateAllTimings() {
  try {
    allTrainETAs = [];
    const logData = [];

    // Fetch Grand St (northbound only)
    const grandStResponse = await fetch(APIS.grandSt);
    const grandStData = await grandStResponse.json();
    if (grandStData.upcoming_trips && grandStData.upcoming_trips.north) {
      const { trainData, logData: grandLog } = processTrains(grandStData.upcoming_trips.north, 'Grand St', 'north');
      allTrainETAs.push(...trainData);
      logData.push(...grandLog);
    }

    // Fetch Canal St (northbound only)
    const canalStResponse = await fetch(APIS.canalSt);
    const canalStData = await canalStResponse.json();
    if (canalStData.upcoming_trips && canalStData.upcoming_trips.north) {
      const { trainData, logData: canalLog } = processTrains(canalStData.upcoming_trips.north, 'Canal St', 'north');
      allTrainETAs.push(...trainData);
      logData.push(...canalLog);
    }

    // Fetch Dekalb Av (B/D/Q southbound only)
    const dekalbAvResponse = await fetch(APIS.dekalbAv);
    const dekalbAvData = await dekalbAvResponse.json();
    if (dekalbAvData.upcoming_trips && dekalbAvData.upcoming_trips.south) {
      const filteredTrains = dekalbAvData.upcoming_trips.south.filter(train =>
        ['B', 'D', 'Q'].includes(train.route_id)
      );
      const { trainData, logData: dekalbLog } = processTrains(filteredTrains, 'Dekalb Av', 'south');
      allTrainETAs.push(...trainData);
      logData.push(...dekalbLog);
    }

    // Fetch Atlantic Av (D/N southbound only)
    const atlanticAvResponse = await fetch(APIS.atlanticAv);
    const atlanticAvData = await atlanticAvResponse.json();
    if (atlanticAvData.upcoming_trips && atlanticAvData.upcoming_trips.south) {
      const filteredTrains = atlanticAvData.upcoming_trips.south.filter(train =>
        ['D', 'N'].includes(train.route_id)
      );
      const { trainData, logData: atlanticLog } = processTrains(filteredTrains, 'Atlantic Av', 'south');
      allTrainETAs.push(...trainData);
      logData.push(...atlanticLog);
    }

    // Sort allTrainETAs by ETA
    allTrainETAs.sort((a, b) => a.etaSeconds - b.etaSeconds);

    // Log all train data as a single object
    console.log({ trains: logData });

  } catch (error) {
    console.error('Error fetching data:', error);
  }
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  margin = width / 10;

  // Scale bird size based on window width
  let scaleFactor = windowWidth / referenceWindowWidth;
  birdWidth = max(referenceBirdWidth * 0.5, referenceBirdWidth * scaleFactor);
  birdHeight = max(referenceBirdHeight * 0.5, referenceBirdHeight * scaleFactor);

  // Scale scooting distances
  minScootDistance = 300 * scaleFactor;
  maxScootDistance = 100 * scaleFactor;
  scootHopDistance = 20 * scaleFactor;

  let availableHeight = height - margin;
  spacingY = availableHeight / numBirdsY;

  let birdsPerWire = [1, 1, 1, 1];
  let remainingBirds = numBirdsTotal - 4;
  while (remainingBirds > 0) {
    let wireIndex = floor(random(0, 4));
    birdsPerWire[wireIndex]++;
    remainingBirds--;
  }

  // Assign flying types based on flying2Percentage
  let totalBirds = birdsPerWire.reduce((sum, num) => sum + num, 0);
  let flying2Count = Math.round((flying2Percentage) * totalBirds);
  let flying2Assigned = 0;

  for (let j = 0; j < numBirdsY; j++) {
    for (let i = 0; i < birdsPerWire[j]; i++) {
      let x;
      let attempts = 0;
      let maxAttempts = 50;
      do {
        x = random(0, width - margin - birdWidth);
        attempts++;
      } while (birds.some(b => Math.abs(b.position.x - x) < birdWidth * 0.75 && b.position.y === margin + j * spacingY - birdHeight / 4) && attempts < maxAttempts);

      if (attempts >= maxAttempts) {
        x = i * birdWidth;
      }

      let y = margin + j * spacingY - birdHeight / 4;
      let frameOffset = floor(random(0, frameCounts.idle1));
      let stillnessState = assignStillnessState();
      let flyingType = flying2Assigned < flying2Count ? 2 : 1;
      birds.push(new Bird(x, y, frameOffset, stillnessState, flyingType));
      if (flyingType === 2) flying2Assigned++;
    }
  }

  for (let i = 0; i < numBirdsY; i++) {
    wireVibrations[i] = {
      amplitude: 0,
      frequency: 0,
      startTime: -1000,
      lastVibrationTime: -1000,
      baseAmplitude: 0,
      pluckPhase: 0,
      manglePoints: [],
      elasticMultiplier: 0.1,
      vibrationMultiplier: 1,
      stopTime: -1000
    };
  }

  updateAllTimings();
  setInterval(updateAllTimings, 10000);
}

function draw() {
  background(0);

  drawWires();

  // Handle regular birds
  if (!allBirdsGone && birds.every(bird => bird.isOffScreen())) {
    allBirdsGone = true;
    allGoneTime = frameCount;
    easterEggCycleCount++; // Increment cycle count
    console.log("All birds gone at frame:", frameCount, "Cycle count:", easterEggCycleCount);
    for (let i = 0; i < numBirdsY; i++) {
      wireVibrations[i].manglePoints = [
        { x: random(width * 0.2, width * 0.4), offset: 0 },
        { x: random(width * 0.4, width * 0.6), offset: 0 },
        { x: random(width * 0.6, width * 0.8), offset: 0 }
      ];
    }
  }

  // Check for birds landing to stop wire vibration
  for (let i = 0; i < numBirdsY; i++) {
    if (wireVibrations[i].amplitude > 0 && birds.some(bird => bird.wireIndex === i && bird.arrived && bird.triggerTime === -1)) {
      wireVibrations[i].amplitude = 0;
      wireVibrations[i].elasticMultiplier = 0.1;
      wireVibrations[i].vibrationMultiplier = 1;
      wireVibrations[i].stopTime = -1000;
      wireVibrations[i].startTime = -1000;
      wireVibrations[i].lastVibrationTime = -1000;
      wireVibrations[i].manglePoints = [];
    }
  }

  if (birds.every(bird => bird.arrived && bird.triggerTime === -1)) {
    allBirdsGone = false;
    allGoneTime = -1000;
    lastMousePressTime = -1000;
  }

  // Easter egg bird spawning logic
  if (easterEggCycleCount % easterEggSpawnFrequency === 0) {
    // Eligible cycle for spawning
    if (!easterEggBird && !hasSpawnedInCycle && birds.every(bird => bird.arrived && !bird.motion && !bird.scooting)) {
      // Spawn a random easter egg bird
      let types = ['sai', 'audrey', 'b'];
      let type = types[floor(random(0, types.length))];
      let wireIndex = floor(random(0, numBirdsY));
      let y = margin + wireIndex * spacingY - birdHeight / 4;
      let x;
      let attempts = 0;
      let maxAttempts = 50;
      do {
        x = random(0, width - margin - birdWidth);
        attempts++;
      } while (birds.some(b => Math.abs(b.position.x - x) < birdWidth * 0.75 && b.position.y === y) && attempts < maxAttempts);
      if (attempts >= maxAttempts) {
        x = birdWidth * floor(random(0, (width - margin - birdWidth) / birdWidth));
      }
      easterEggBird = new EasterEggBird(type, x, y, wireIndex);
      hasSpawnedInCycle = true; // Mark that we've spawned in this cycle
    }
  } else {
    // Reset spawn flag in non-eligible cycles
    hasSpawnedInCycle = false;
  }

  // Update easter egg bird
  let shouldDeleteEasterEgg = false;
  if (easterEggBird) {
    shouldDeleteEasterEgg = easterEggBird.update();
  }

  // Trigger flight for regular and easter egg birds
  let lastTriggerTime = -1000;
  if (reactToTrainData && frameCount - lastTriggerTime > 30 && birds.some(bird => bird.arrived && !bird.motion)) {
    const triggeringTrain = allTrainETAs.find(train => {
      const window = trainTriggerWindows[`${train.route}_${train.direction}`];
      return window && train.etaSeconds <= window.max && train.etaSeconds > window.min;
    });
    if (triggeringTrain) {
      console.log(`Triggered to ${triggeringTrain.route} ${triggeringTrain.direction} ${triggeringTrain.station} ${triggeringTrain.etaFormatted}`);
      triggerBirdFlight();
      lastTriggerTime = frameCount;
    }
  }

  // Update and display regular birds
  birds.forEach((bird) => {
    bird.update();
    bird.display();
  });

  // Display easter egg bird after regular birds to draw on top
  if (easterEggBird) {
    easterEggBird.display();
    if (shouldDeleteEasterEgg) {
      easterEggBird = null;
    }
  }
}

function drawWires() {
  for (let i = 0; i < numBirdsY; i++) {
    let baseY = margin + i * spacingY + birdHeight / 2.8;
    let elapsed = frameCount - wireVibrations[i].startTime;
    let transitionProgress = allBirdsGone ? min((frameCount - allGoneTime) / 60, 1) : 0;
    let returnProgress = lastMousePressTime >= 0 && allBirdsGone ?
      constrain((frameCount - (lastMousePressTime + returnDelay * returnTransitionPercentage)) / (returnDelay * (1 - returnTransitionPercentage)), 0, 1) : 0;

    drawSingleWire(baseY, i, elapsed, transitionProgress, returnProgress);
  }
}

function drawSingleWire(y, i, elapsed, transitionProgress, returnProgress) {
  push();
  translate(0, y);
  noFill();
  stroke(255);
  strokeWeight(height / 200);

  beginShape();
  for (let x = 0; x <= width; x += 5) {
    let yOffset = 0;
    if (wireVibrations[i].amplitude > 0) {
      let progress = map(x, 0, width, 0, 1);
      let rampUpProgress = min(elapsed / 60, 1); // Ramp up over 1 second
      let currentAmplitude = wireVibrations[i].amplitude * rampUpProgress;
      let currentFrequency = lerp(vibrationFrequency * 0.5, wireVibrations[i].frequency, rampUpProgress);
      let currentElasticMultiplier = wireVibrations[i].elasticMultiplier * rampUpProgress;

      let vibration = sin(x * currentFrequency + frameCount * vibrationSpeed);
      let elastic = sin(vibrationFrequency * elapsed + wireVibrations[i].pluckPhase) * (1 - progress) * progress * 4;
      let baseEffect = vibration * wireVibrations[i].vibrationMultiplier + elastic * currentElasticMultiplier;

      let mangleOffset = 0;
      if (allBirdsGone && wireVibrations[i].manglePoints.length > 0) {
        for (let point of wireVibrations[i].manglePoints) {
          let dist = abs(x - point.x);
          let curveStrength = exp(-pow(dist, 2) / (2 * pow(width * 0.15, 2))) * undulationAmplitude;
          point.offset = sin(elapsed * undulationSpeed + point.x * undulationFrequency) * curveStrength;
          mangleOffset += point.offset / 2;
        }
      }

      // Blend between vibration and undulation
      let effect = lerp(baseEffect, baseEffect + mangleOffset, transitionProgress);
      if (returnProgress > 0) {
        // Smoothly transition back to vibration, then ramp down
        effect = lerp(baseEffect + mangleOffset, baseEffect, returnProgress);
        let rampDownProgress = min(returnProgress, 1); // Ramp down over remaining time
        currentAmplitude = lerp(currentAmplitude, currentAmplitude * 0.5, rampDownProgress);
        currentFrequency = lerp(currentFrequency, currentFrequency * 0.75, rampDownProgress);
        vibration = sin(x * currentFrequency + frameCount * vibrationSpeed);
        elastic = sin(vibrationFrequency * elapsed + wireVibrations[i].pluckPhase) * (1 - progress) * progress * 4;
        baseEffect = vibration * wireVibrations[i].vibrationMultiplier + elastic * currentElasticMultiplier;
        effect = lerp(baseEffect + mangleOffset, baseEffect, returnProgress); // Ensure smooth blend
      }
      yOffset = currentAmplitude * effect;
    }
    vertex(x, yOffset);
  }
  endShape();
  pop();
}

function triggerVibration() {
  for (let i = 0; i < numBirdsY; i++) {
    let beatPattern = [0, 1, 0, 1];
    let beatIndex = (frameCount + i * 1) % beatPattern.length;
    let elapsed = frameCount - wireVibrations[i].startTime;

    if (wireVibrations[i].startTime === -1000 || elapsed < 0) {
      wireVibrations[i].baseAmplitude = beatPattern[beatIndex] === 1 ? random(0.5, 1) : random(1, 2);
      wireVibrations[i].frequency = vibrationFrequency;
      wireVibrations[i].startTime = frameCount;
      wireVibrations[i].pluckPhase = random(0, TWO_PI);
      wireVibrations[i].elasticMultiplier = 0.1;
      wireVibrations[i].vibrationMultiplier = 1;
    }

    let rampUpProgress = min(elapsed / 60, 1); // Ramp up over 1 second
    wireVibrations[i].amplitude = lerp(0, vibrationAmplitude, rampUpProgress);
    wireVibrations[i].elasticMultiplier = lerp(0.1, 4, rampUpProgress);
    wireVibrations[i].vibrationMultiplier = 1;
    wireVibrations[i].lastVibrationTime = frameCount;
  }
}

function mousePressed() {
  if (!reactToTrainData) {
    triggerBirdFlight();
  }
}

function keyPressed() {
  if (key === 'T' || key === 't') {
    reactToTrainData = !reactToTrainData;
    console.log('reactToTrainData toggled to:', reactToTrainData);
  }
}

function triggerBirdFlight() {
  allBirdsGone = false;
  allGoneTime = -1000;
  lastMousePressTime = frameCount;
  triggerVibration();
  for (let i = 0; i < numBirdsY; i++) {
    wireVibrations[i].stopTime = -1000;
  }

  birds.forEach(bird => {
    bird.scooting = false;
    bird.scootTarget = null;
    bird.hasHoppedFirst = false;
    bird.hasHoppedSecond = false;
    bird.triggerTime = frameCount + floor(random(0, 150));
    bird.returnTime = -1;
    bird.motion = true; // Start motion immediately
    bird.arrived = false;
    bird.velocity.set(random(-bird.maxOutSpeed, -bird.maxOutSpeed / 2), random(-2, 2)); // Consistent leftward velocity
    bird.animation.resetFlight();
    bird.animation.setState(`flying${bird.animation.flyingType}`); // Set flying1 or flying2
  });

  if (easterEggBird) {
    easterEggBird.triggerFlight();
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  margin = width / 10;
  let availableHeight = height - margin;
  spacingY = availableHeight / numBirdsY;

  // Scale bird size based on new window width
  let scaleFactor = windowWidth / referenceWindowWidth;
  let oldBirdWidth = birdWidth;
  birdWidth = max(referenceBirdWidth * 0.5, referenceBirdWidth * scaleFactor);
  birdHeight = max(referenceBirdHeight * 0.5, referenceBirdHeight * scaleFactor);

  // Scale scooting distances
  minScootDistance = 300 * scaleFactor;
  maxScootDistance = 100 * scaleFactor;
  scootHopDistance = 20 * scaleFactor;

  birds.forEach(bird => {
    bird.wireIndex = constrain(bird.wireIndex, 0, numBirdsY - 1);
    bird.originalPosition.y = margin + bird.wireIndex * spacingY - birdHeight / 4;
    bird.position.y = bird.originalPosition.y;
    bird.targetPosition.y = bird.originalPosition.y;

    // Scale x positions proportionally
    if (!bird.motion) {
      let xRatio = bird.position.x / (windowWidth - oldBirdWidth);
      bird.position.x = xRatio * (windowWidth - birdWidth);
      bird.targetPosition.x = xRatio * (windowWidth - birdWidth);
      bird.position.x = constrain(bird.position.x, 0, windowWidth - margin - birdWidth);
      bird.targetPosition.x = constrain(bird.targetPosition.x, 0, windowWidth - margin - birdWidth);
    }
  });

  if (easterEggBird) {
    easterEggBird.wireIndex = constrain(easterEggBird.wireIndex, 0, numBirdsY - 1);
    let newY = margin + easterEggBird.wireIndex * spacingY - birdHeight / 4;
    easterEggBird.position.y = newY;
    easterEggBird.targetPosition.y = newY;
    if (easterEggBird.state !== 'flying') {
      let xRatio = easterEggBird.position.x / (windowWidth - oldBirdWidth);
      easterEggBird.position.x = xRatio * (windowWidth - birdWidth);
      easterEggBird.targetPosition.x = xRatio * (windowWidth - birdWidth);
      easterEggBird.position.x = constrain(easterEggBird.position.x, 0, windowWidth - margin - birdWidth);
      easterEggBird.targetPosition.x = constrain(easterEggBird.targetPosition.x, 0, windowWidth - margin - birdWidth);
    }
  }
}