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
let returnDelay = 1500;
let globalFrameSpeed = 6;


let reactToTrainData = true;


let idle1stillnessProbability = 0.2;
let idle2stillnessProbability = 0.2;
let idle3stillnessProbability = 0.2;
let idle4stillnessProbability = 0.2;
let idle5stillnessProbability = 0.2;


let idle1stillnessToIdleProbability = 0.005;
let idle2stillnessToIdleProbability = 0.005;
let idle3stillnessToIdleProbability = 0.005;
let idle4stillnessToIdleProbability = 0.003;
let idle5stillnessToIdleProbability = 0.003;


let idleToStillnessProbability = 0.05;


let idle1TransitionProbability = 0.34;
let idle2TransitionProbability = 0.33;
let idle3TransitionProbability = 0.33;

let scootProbability = 0.001;
let minScootDistance = 300;
let maxScootDistance = 100;
let scootSpeed = 0.5;

let flyingOutSpeedRange = { min: 5, max: 10 };
let flyingBackSpeedRange = { min: 5, max: 10 };

let frameCounts = {
  idle1: 11,
  idle1stillness: 22,
  idle2: 13,
  idle2stillness: 9,
  idle3: 16,
  idle3stillness: 11,
  idle4stillness: 14,
  idle5stillness: 12,
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
  idle2: [],
  idle2stillness: [],
  idle3: [],
  idle3stillness: [],
  idle4stillness: [],
  idle5stillness: [],
  landing1: [],
  outLeft1: [],
  scooting1: [],
  scootingLeft: [],
  scootingRight: [],
  flying1: [],
  flyingBack1: []
};

// MTA train timing variables
let timingsArray = [];
const proxyUrl = 'https://api.allorigins.win/get?url=';
const uptownUrls = [
  encodeURIComponent('https://nyc-mta-realtime.fly.dev/?route_filter=D&station_name_filter=Grand'),
  encodeURIComponent('https://nyc-mta-realtime.fly.dev/?route_filter=N&station_name_filter=Canal')
];
const downtownUrls = [
  encodeURIComponent('https://nyc-mta-realtime.fly.dev/?route_filter=Q&station_name_filter=Dekalb'),
  encodeURIComponent('https://nyc-mta-realtime.fly.dev/?route_filter=D&station_name_filter=Atlantic')
];
const uptownLabels = ['Uptown', 'Manhattan', 'Queens'];
const downtownLabels = ['Downtown', 'Coney Island', 'Bay Ridge', 'Brooklyn'];
const validTrains = ['D', 'B', 'N', 'Q'];

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
  for (let i = 0; i < frameCounts.idle4stillness; i++) {
    animations.idle4stillness[i] = loadImage(`assets/idle4-stillness/idle4-stillness_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle5stillness; i++) {
    animations.idle5stillness[i] = loadImage(`assets/idle5-stillness/idle5-stillness_${i}.png`);
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
    this.baseStillnessState = 'idle1stillness';  // Tracks the assigned stillness state
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
      } else if (this.currentState === 'idle1' || 
                 this.currentState === 'idle2' || 
                 this.currentState === 'idle3') {
        if (random() < idleToStillnessProbability) {
          this.setState(this.baseStillnessState);
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

class Bird {
  constructor(x, y, frameOffset, stillnessState) {
    this.originalPosition = createVector(x, y);
    this.position = createVector(x, y);
    this.targetPosition = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.frameOffset = frameOffset;
    this.animation = new AnimationManager(frameCounts, animations);
    this.animation.setState(stillnessState);  // Start in assigned stillness state
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
          } else if (dist < maxScootDistance) {
            let direction = this.position.x < neighborX ? -1 : 1;
            this.scootTarget = this.position.x + direction * (maxScootDistance / 2);
            this.scooting = true;
            this.animation.setState(this.scootTarget < this.position.x ? 'scootingLeft' : 'scootingRight');
            this.scootSteps = 0;
            this.stepSize = (this.scootTarget - this.position.x) / this.totalScootSteps;
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
        }
      }

      if (this.scootSteps >= this.totalScootSteps || abs(this.scootTarget - this.position.x) < abs(this.stepSize)) {
        this.position.x = this.scootTarget;
        this.scooting = false;
        this.scootTarget = null;
        this.scootSteps = 0;
        this.animation.setState(this.animation.baseStillnessState);
        this.targetPosition.x = this.position.x;
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
          this.animation.setState(this.animation.baseStillnessState);
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

function assignStillnessState() {
  let rand = random();
  if (rand < idle1stillnessProbability) return "idle1stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability) return "idle2stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability + idle3stillnessProbability) return "idle3stillness";
  else if (rand < idle1stillnessProbability + idle2stillnessProbability + idle3stillnessProbability + idle4stillnessProbability) return "idle4stillness";
  else return "idle5stillness";
}

// Fetch MTA train timings
async function fetchTimings(urls, direction, directionLabels) {
  let tempTimings = [];

  for (const targetUrl of urls) {
    try {
      const endpoint = `${proxyUrl}${targetUrl}&_=${new Date().getTime()}`;
      const response = await fetch(endpoint);
      const data = await response.json();
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.contents, 'text/html');

      let directionSection = Array.from(doc.querySelectorAll('.underline.font-bold'))
        .find(section => {
          const text = section.innerText.toLowerCase();
          return directionLabels.some(label => text.includes(label.toLowerCase()));
        });

      if (!directionSection) {
        console.warn(`No ${direction} section found for ${targetUrl}, using fallback`);
        directionSection = doc.querySelector('.items-center.pt-6') || 
                          doc.querySelector('.underline.font-bold');
      }

      if (!directionSection || !directionSection.parentElement.nextElementSibling) {
        console.error(`No valid timing section found for ${targetUrl}`);
        continue;
      }

      const items = directionSection.parentElement
        .nextElementSibling.querySelectorAll('li.mx-3.p-2.sm\\:py-4.flex.justify-between.overflow-hidden.items-center');

      if (items.length === 0) {
        console.warn(`No timing items found for ${targetUrl}`);
      }

      items.forEach(item => {
        const trainNameElement = item.querySelector('.rounded-full');
        const trainName = trainNameElement ? trainNameElement.innerText.trim() : 
                          targetUrl.includes('route_filter=Q') ? 'Q' : 
                          targetUrl.includes('route_filter=D') ? 'D' : 
                          targetUrl.includes('route_filter=N') ? 'N' : '';
        
        if (!validTrains.includes(trainName)) {
          return;
        }

        const timing = item.querySelector('.font-bold')?.innerText.trim() || 'N/A';
        tempTimings.push(timing);
      });

    } catch (error) {
      console.error(`Error fetching data for ${targetUrl}:`, error);
    }
  }

  return tempTimings;
}

async function updateAllTimings() {
  const uptownTimings = await fetchTimings(uptownUrls, 'Uptown', uptownLabels);
  const downtownTimings = await fetchTimings(downtownUrls, 'Downtown', downtownLabels);
  timingsArray = [...uptownTimings, ...downtownTimings];
  console.log('Updated Timings Array:', timingsArray);
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
      let stillnessState = assignStillnessState();
      birds.push(new Bird(x, y, frameOffset, stillnessState));
    }
  }
  
  for (let i = 0; i < numBirdsY; i++) {
    wirePlucks[i] = { time: -1000, amplitude: 0 };
    nextPluckTimes[i] = -1;
  }

  // Initial fetch of train timings
  updateAllTimings();
  // Update every 60 seconds
  setInterval(updateAllTimings, 60000);
}

function draw() {
  background(0);

  drawWires();

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

  if (reactToTrainData && birds.every(bird => bird.arrived && !bird.motion) && timingsArray.includes('2 min')) {
    triggerBirdFlight();
  }

  birds.forEach((bird) => {
    bird.update();
    bird.display();
  });
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
  for (let i = 0; i < numBirdsY; i++) {
    nextPluckTimes[i] = frameCount + floor(random(0, 60));
  }

  birds.forEach(bird => {
    bird.scooting = false;
    bird.scootTarget = null;
    bird.scootSteps = 0;
    bird.stepSize = 0;
    bird.triggerTime = frameCount + floor(random(0, 150));
    bird.returnTime = -1;
    bird.motion = false;
    bird.arrived = false;
    bird.velocity.set(0, 0);
    bird.applyForce(createVector(random(-20, -10), random(-5, 5)));
  });
}