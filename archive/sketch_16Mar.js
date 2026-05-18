let numBirdsX = 4;
let numBirdsY = 4;
let birds = [];
let birdWidth = 250;
let birdHeight = 250;
let margin;
let spacingX, spacingY;
let wirePlucks = [];
let nextPluckTimes = [];
let allBirdsGone = false;
let allGoneTime = -1000;
let lastMousePressTime = -1000;
let returnDelay = 300;
let globalFrameSpeed = 6;

let stillnessToIdleProbability = 0.01;
let idleToStillnessProbability = 0.05;

let scootProbability = 0.001;
let minScootDistance = 300;
let maxScootDistance = 100;
let scootSpeed = 0.5;

let idle1Probability = 0.4;
let idle2Probability = 0.3;
let idle3Probability = 0.3;

// Probabilities for idle1 variants when transitioning from idle1-stillness
let idle1aProbability = 0.4;
let idle1bProbability = 0.35;
let idle1cProbability = 0.25;

let flyingOutSpeedRange = { min: 5, max: 10 };
let flyingBackSpeedRange = { min: 5, max: 10 };

let frameCounts = {
  idle1: 33,
  idle1stillness: 12,
  idle1a: 36,
  idle1b: 27,
  idle1c: 21,
  idle2: 44,
  idle2stillness: 13,
  idle3: 26,
  idle3stillness: 6,
  landing1: 9,
  outLeft1: 7,
  scooting1: 12,
  scootingLeft: 12,
  scootingRight: 12,
  flying1: 6,
  flyingBack1: 6
};

let animations = {
  idle1: [],
  idle1stillness: [],
  idle1a: [],
  idle1b: [],
  idle1c: [],
  idle2: [],
  idle2stillness: [],
  idle3: [],
  idle3stillness: [],
  landing1: [],
  outLeft1: [],
  scooting1: [],
  scootingLeft: [],
  scootingRight: [],
  flying1: [],
  flyingBack1: []
};

function preload() {
  for (let i = 0; i < frameCounts.idle1; i++) {
    animations.idle1[i] = loadImage(`assets/idle1/idle1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle1stillness; i++) {
    animations.idle1stillness[i] = loadImage(`assets/idle1-stillness/idle1-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle1a; i++) {
    animations.idle1a[i] = loadImage(`assets/idle1a/idle1a_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle1b; i++) {
    animations.idle1b[i] = loadImage(`assets/idle1b/idle1b_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle1c; i++) {
    animations.idle1c[i] = loadImage(`assets/idle1c/idle1c_${i}.png`);
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
}

class AnimationManager {
  constructor(frameCounts, animations) {
    this.frameCounts = frameCounts;
    this.animations = animations;
    this.currentState = 'idle1stillness';
    this.frameSpeed = globalFrameSpeed;
    this.baseIdleState = 'idle1';
    this.outLeftStartFrame = -1;
    this.hasOutLeftPlayed = false;
    this.landingStartFrame = -1;
    this.lastCycleFrame = -1;
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
      } else if (state === 'idle1' || state === 'idle2' || state === 'idle3') {
        this.baseIdleState = state;
      }
    }
  }

  updateIdle() {
    let frameCountLimit = this.frameCounts[this.currentState];
    let frameIndex = floor(frameCount / this.frameSpeed) % frameCountLimit;

    if (frameIndex === 0 && this.lastCycleFrame !== frameCount) {
      this.lastCycleFrame = frameCount;

      if (this.currentState.includes('stillness')) {
        if (random() < stillnessToIdleProbability) {
          if (this.baseIdleState === 'idle1') {
            let rand = random();
            if (rand < idle1aProbability) {
              this.setState('idle1a');
            } else if (rand < idle1aProbability + idle1bProbability) {
              this.setState('idle1b');
            } else {
              this.setState('idle1c');
            }
          } else {
            this.setState(this.baseIdleState);
          }
        }
      } else if (this.currentState === this.baseIdleState || 
                 this.currentState === 'idle1a' || 
                 this.currentState === 'idle1b' || 
                 this.currentState === 'idle1c') {
        if (random() < idleToStillnessProbability) {
          this.setState(this.baseIdleState + 'stillness');
        }
      }
    }
  }

  updateFlight() {
    if (this.currentState === 'outLeft1' && this.outLeftStartFrame >= 0) {
      let framesElapsed = frameCount - this.outLeftStartFrame;
      let outLeftFrames = this.frameCounts.outLeft1 * this.frameSpeed;
      if (frameCount == this.outLeftStartFrame && !this.hasOutLeftPlayed) {
        this.setState('flying1');
        this.hasOutLeftPlayed = true;
      }
    }
  }

  updateLanding() {
    if (this.currentState === 'landing1' && this.landingStartFrame >= 0) {
      let framesElapsed = frameCount - this.landingStartFrame;
      let landingFrames = this.frameCounts.landing1 * this.frameSpeed;
      if (framesElapsed >= landingFrames) {
        this.setState(this.baseIdleState + 'stillness');
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

class Bird {
  constructor(x, y, frameOffset, idleState) {
    this.originalPosition = createVector(x, y);
    this.position = createVector(x, y);
    this.targetPosition = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.frameOffset = frameOffset;
    this.animation = new AnimationManager(frameCounts, animations);
    this.animation.setState(idleState + 'stillness');
    this.animation.baseIdleState = idleState;
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
    this.scootSteps = 0;
    this.totalScootSteps = 300;
    this.stepSize = 0;
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
    this.targetPosition.x = random(margin, width - margin);
    this.targetPosition.y = this.originalPosition.y;
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
            this.scootSteps = 0;
            this.stepSize = (this.scootTarget - this.position.x) / this.totalScootSteps;
            console.log(`Bird at ${this.position.x} scooting to ${this.scootTarget}, stepSize: ${this.stepSize}`);
          } else if (dist < maxScootDistance) {
            let direction = this.position.x < neighborX ? -1 : 1;
            this.scootTarget = this.position.x + direction * (maxScootDistance / 2);
            this.scooting = true;
            this.animation.setState(this.scootTarget < this.position.x ? 'scootingLeft' : 'scootingRight');
            this.scootSteps = 0;
            this.stepSize = (this.scootTarget - this.position.x) / this.totalScootSteps;
            console.log(`Bird at ${this.position.x} scooting to ${this.scootTarget}, stepSize: ${this.stepSize}`);
          }
        }
      }
    }

    if (this.scooting && this.scootTarget !== null) {
      let frameIndex = this.animation.getCurrentFrameIndex();

      if ((frameIndex >= 4 && frameIndex <= 6) || (frameIndex >= 8 && frameIndex <= 10)) {
        if (this.scootSteps < this.totalScootSteps) {
          this.position.x += this.stepSize;
          this.scootSteps++;
          console.log(`Bird stepped to ${this.position.x}, step ${this.scootSteps}/${this.totalScootSteps}, frame ${frameIndex}`);
        }
      }

      if (this.scootSteps >= this.totalScootSteps || abs(this.scootTarget - this.position.x) < abs(this.stepSize)) {
        this.position.x = this.scootTarget;
        this.scooting = false;
        this.scootTarget = null;
        this.scootSteps = 0;
        this.animation.setState(this.animation.baseIdleState);
        this.targetPosition.x = this.position.x;
        console.log(`Bird reached target at ${this.position.x}`);
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
      this.animation.setState('outLeft1');
      this.currentMaxSpeed = this.maxOutSpeed;
    }

    if (!this.scooting && lastMousePressTime >= 0 && frameCount >= lastMousePressTime + returnDelay && this.triggerTime !== -1) {
      if (this.returnTime === -1) {
        this.returnTime = frameCount + floor(random(0, 60));
        this.generateNewTargetOnWire();
      }
    }

    if (this.motion) {
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);
      this.acceleration.mult(0);

      if (this.returnTime === -1) {
        this.animation.updateFlight();
      } else if (frameCount >= this.returnTime) {
        this.currentMaxSpeed = this.maxBackSpeed;
        let distance = p5.Vector.dist(this.position, this.targetPosition);
        if (distance < 50 && this.animation.currentState !== 'landing1') {
          this.animation.setState('landing1');
        } else if (this.animation.currentState === 'landing1') {
          this.animation.updateLanding();
        } else if (this.animation.currentState !== 'landing1') {
          this.animation.setState('flyingBack1');
        }

        let steering = this.seek(this.targetPosition);
        this.applyForce(steering);

        if (distance < 5 && this.animation.currentState !== 'landing1') {
          this.motion = false;
          this.velocity.set(0, 0);
          this.animation.setState(this.animation.baseIdleState + 'stillness');
          this.arrived = true;
          this.triggerTime = -1;
          this.returnTime = -1;
          this.position.set(this.targetPosition);
        }
      }

      if (this.velocity.mag() < 0.2 && this.returnTime === -1) {
        this.velocity.set(0, 0);
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

function assignIdleState() {
  let rand = random();
  if (rand < idle1Probability) return "idle1";
  else if (rand < idle1Probability + idle2Probability) return "idle2";
  else return "idle3";
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  margin = width / 10;

  let availableWidth = width - 2 * margin;
  let availableHeight = height - margin;
  spacingX = availableWidth / numBirdsX;
  spacingY = availableHeight / numBirdsY;

  for (let i = 0; i < numBirdsX; i++) {
    for (let j = 0; j < numBirdsY; j++) {
      let x = random(margin, width - margin);
      let y = margin + j * spacingY - birdHeight / 4;
      let frameOffset = floor(random(0, frameCounts.idle1));
      let idleState = assignIdleState();
      birds.push(new Bird(x, y, frameOffset, idleState));
    }
  }
  
  for (let i = 0; i < numBirdsY; i++) {
    wirePlucks[i] = { time: -1000, amplitude: 0 };
    nextPluckTimes[i] = -1;
  }
}

function draw() {
  background(0);

  if (!allBirdsGone && birds.every(bird => bird.isOffScreen())) {
    allBirdsGone = true;
    allGoneTime = frameCount;
    console.log("All birds gone at frame:", frameCount);
  }

  if (birds.some(bird => bird.arrived && bird.triggerTime === -1)) {
    for (let i = 0; i < numBirdsY; i++) {
      wirePlucks[i].time = -1000;
      nextPluckTimes[i] = -1;
    }
  }

  if (birds.every(bird => bird.arrived && bird.triggerTime === -1)) {
    allBirdsGone = false;
    allGoneTime = -1000;
    lastMousePressTime = -1000;
  }

  if (allBirdsGone && frameCount >= allGoneTime + 180 && !birds.some(bird => bird.arrived && bird.triggerTime === -1)) {
    for (let i = 0; i < numBirdsY; i++) {
      if (nextPluckTimes[i] >= 0 && frameCount >= nextPluckTimes[i]) {
        wirePlucks[i].time = frameCount;
        wirePlucks[i].amplitude = random(0.5, 1);
        nextPluckTimes[i] = frameCount + floor(random(30, 120));
        console.log(`Wire ${i} plucked at frame ${frameCount}, next at ${nextPluckTimes[i]}`);
      }
    }
  }

  birds.forEach((bird) => {
    bird.update();
    bird.display();
  });

  drawWires();
}

function drawWires() {
  for (let i = 0; i < numBirdsY; i++) {
    push();
    translate(0, margin + i * spacingY + birdHeight / 2.8);
    noFill();
    stroke(255);
    strokeWeight(height / 200);

    let baseAmplitude = 50;
    let decay = 0.93;
    let duration = 90;
    
    beginShape();
    for (let x = 0; x <= width; x += 5) {
      let progress = map(x, 0, width, 0, 1);
      let yOffset = 0;
      
      let elapsed = frameCount - wirePlucks[i].time;
      if (elapsed >= 0 && elapsed < duration) {
        let pluckProgress = elapsed / duration;
        let amplitude = baseAmplitude * wirePlucks[i].amplitude * (1 - pluckProgress) * pow(decay, elapsed);
        let frequency = 0.01;
        yOffset = amplitude * sin(x * frequency) * sin(progress * PI);
      }
      
      vertex(x, yOffset);
    }
    
    endShape();
    pop();
  }
}

function mousePressed() {
  allBirdsGone = false;
  allGoneTime = -1000;
  lastMousePressTime = frameCount;
  for (let i = 0; i < numBirdsY; i++) {
    nextPluckTimes[i] = frameCount + floor(random(0, 60));
  }

  birds.forEach(bird => {
    if (!bird.scooting) {
      bird.triggerTime = frameCount + floor(random(0, 150));
      bird.returnTime = -1;
      bird.motion = false;
      bird.arrived = false;
      bird.velocity.set(0, 0);
      bird.applyForce(createVector(random(-20, -10), random(-5, 5)));
    }
  });
}