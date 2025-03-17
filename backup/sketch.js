// Birds drawn by B (https://www.bethanylwu.com) 

let numBirdsX = 4;
let numBirdsY = 4;
let birds = [];
let birdWidth = 200;
let birdHeight = 200;
let margin;
let spacingX, spacingY;
let wirePlucks = [];
let nextPluckTimes = [];
let flightTriggers = [];
let allBirdsGone = false;
let allGoneTime = -1000;

// Probability of switching from stillness to regular idle (0 to 1)
let idleSwitchProbability = 0.01; // 1% chance per frame

let frameCounts = {
  idle1: 33,           // 0 to 32
  idle1stillness: 12,  // 0 to 11
  idle2: 25,           // 0 to 24
  idle2stillness: 13,  // 0 to 12
  idle3: 26,           // 0 to 25
  idle3stillness: 6,   // 0 to 5
  landing1: 6,         // 0 to 5
  outLeft1: 7,         // 0 to 6
  scooting1: 12,       // 0 to 11
  flying1: 6           // 0 to 5
};

let animations = {
  idle1: [],
  idle1stillness: [],
  idle2: [],
  idle2stillness: [],
  idle3: [],
  idle3stillness: [],
  landing1: [],
  outLeft1: [],
  scooting1: [],
  flying1: []
};

function preload() {
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
  for (let i = 0; i < frameCounts.landing1; i++) {
    animations.landing1[i] = loadImage(`assets/landing1/landing1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.outLeft1; i++) {
    animations.outLeft1[i] = loadImage(`assets/outLeft1/outLeft1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.scooting1; i++) {
    animations.scooting1[i] = loadImage(`assets/scooting1/scooting1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.flying1; i++) {
    animations.flying1[i] = loadImage(`assets/flying1/flying1_${i}.png`);
  }
}

class AnimationManager {
  constructor(frameCounts, animations) {
    this.frameCounts = frameCounts;
    this.animations = animations;
    this.currentState = 'idle1stillness';
    this.frameSpeed = 4;
    this.baseIdleState = 'idle1';
    this.outLeftStartFrame = -1; // Track when outLeft1 started
    this.hasOutLeftPlayed = false; // Flag to ensure outLeft1 plays only once
  }

  getFrame(frameOffset) {
    let frameSet = this.animations[this.currentState];
    let frameCountLimit = this.frameCounts[this.currentState];
    let frameIndex = (floor(frameCount / this.frameSpeed) + frameOffset) % frameCountLimit;
    return frameSet[frameIndex];
  }

  setState(state) {
    if (this.animations[state]) {
      this.currentState = state;
      if (state === 'outLeft1') {
        this.outLeftStartFrame = frameCount;
        this.hasOutLeftPlayed = false; // Reset flag when starting outLeft1
      } else if (state === 'idle1' || state === 'idle2' || state === 'idle3') {
        this.baseIdleState = state;
      }
    }
  }

  updateIdle() {
    if (this.currentState.includes('stillness')) {
      if (random() < idleSwitchProbability) {
        this.setState(this.baseIdleState);
      }
    } else if (this.currentState === this.baseIdleState) {
      let frameCountLimit = this.frameCounts[this.currentState];
      let frameIndex = floor(frameCount / this.frameSpeed) % frameCountLimit;
      if (frameIndex === frameCountLimit - 1) {
        this.setState(this.baseIdleState + 'stillness');
      }
    }
  }

  updateFlight() {
    if (this.currentState === 'outLeft1' && this.outLeftStartFrame >= 0) {
      let framesElapsed = frameCount - this.outLeftStartFrame;
      let outLeftFrames = this.frameCounts.outLeft1 * this.frameSpeed;
      if (framesElapsed >= outLeftFrames && !this.hasOutLeftPlayed) {
        this.setState('flying1');
        this.hasOutLeftPlayed = true; // Mark outLeft1 as played
      }
    }
  }
}

class Bird {
  constructor(x, y, frameOffset, idleState) {
    this.position = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.frameOffset = frameOffset;
    this.animation = new AnimationManager(frameCounts, animations);
    this.animation.setState(idleState + 'stillness');
    this.animation.baseIdleState = idleState;
    this.motion = false;
    this.triggerTime = -1;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    if (this.triggerTime >= 0 && frameCount >= this.triggerTime) {
      this.motion = true;
    }

    if (this.motion) {
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);
      this.acceleration.mult(0);
      
      this.animation.updateFlight(); // Check flight transition
      if (!this.animation.hasOutLeftPlayed && this.animation.currentState !== 'outLeft1') {
        this.animation.setState('outLeft1'); // Start with outLeft1 if not already played
      }

      if (this.velocity.mag() < 0.2) {
        this.motion = false;
        this.velocity.set(0, 0);
        this.animation.setState(this.animation.baseIdleState + 'stillness');
      }
    } else {
      this.animation.updateIdle();
    }
  }

  display() {
    if (this.position.x > -birdWidth) {
      let frame = this.animation.getFrame(this.frameOffset);
      image(frame, this.position.x, this.position.y, birdWidth, birdHeight);
    }
  }

  isOffScreen() {
    return this.position.x < -birdWidth;
  }
}

function assignIdleState() {
  let rand = random();
  if (rand < 0.5) return "idle1";
  else if (rand < 0.8) return "idle2";
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

  if (allBirdsGone && frameCount >= allGoneTime + 180) {
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
    translate(0, margin + i * spacingY + birdHeight / 2.3);
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
  for (let i = 0; i < numBirdsY; i++) {
    nextPluckTimes[i] = frameCount + floor(random(0, 60)); // Initial plucks within 1 second
  }

  let firstBird = floor(random(birds.length));
  birds[firstBird].triggerTime = frameCount;
  birds[firstBird].applyForce(createVector(random(-20, -10), random(-5, 5)));

  let nearbyCount = floor(random(2, 5));
  let nearbyBirds = [];
  for (let i = 0; i < birds.length; i++) {
    if (i !== firstBird) {
      let dist = p5.Vector.dist(birds[i].position, birds[firstBird].position);
      nearbyBirds.push({ index: i, distance: dist });
    }
  }
  nearbyBirds.sort((a, b) => a.distance - b.distance);
  for (let i = 0; i < nearbyCount && i < nearbyBirds.length; i++) {
    let birdIndex = nearbyBirds[i].index;
    birds[birdIndex].triggerTime = frameCount + floor(random(30, 60));
    birds[birdIndex].applyForce(createVector(random(-20, -10), random(-5, 5)));
  }

  for (let i = 0; i < birds.length; i++) {
    if (i !== firstBird && !nearbyBirds.some(b => b.index === i && b.distance < nearbyBirds[nearbyCount - 1].distance)) {
      birds[i].triggerTime = frameCount + floor(random(90, 150));
      birds[i].applyForce(createVector(random(-20, -10), random(-5, 5)));
    }
  }
}