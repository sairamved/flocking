// Birds drawn by B (https://www.bethanylwu.com) 

let numBirdsX = 4;
let numBirdsY = 4;
let birds = [];
let birdWidth = 100;
let birdHeight = 100;
let margin;
let spacingX, spacingY;
let wirePlucks = [];
let nextPluckTimes = [];

let frameCounts = {
  idle1: 32,
  idle2: 24,
  idle3: 25,
  moving: 6
};

let animations = {
  idle1: [],
  idle2: [],
  idle3: [],
  moving: []
};

let idleStateDistribution = {
  idle1: 0.5,
  idle2: 0.3,
  idle3: 0.2
};

function preload() {
  for (let i = 0; i < frameCounts.idle1; i++) {
    animations.idle1[i] = loadImage(`assets/idle1/idle1_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle2; i++) {
    animations.idle2[i] = loadImage(`assets/idle2/idle2_${i}.png`);
  }
  for (let i = 0; i < frameCounts.idle3; i++) {
    animations.idle3[i] = loadImage(`assets/idle3/idle3_${i}.png`);
  }
  for (let i = 0; i < frameCounts.moving; i++) {
    animations.moving[i] = loadImage(`assets/outLeft1/outLeft1_${i}.png`);
  }
}

class AnimationManager {
  constructor(frameCounts, animations) {
    this.frameCounts = frameCounts;
    this.animations = animations;
    this.currentState = 'idle1';
    this.frameSpeed = 6;
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
    this.animation.setState(idleState);
    this.motion = false;
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  update() {
    if (this.motion) {
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);
      this.acceleration.mult(0);
      this.animation.setState('moving');

      if (this.velocity.mag() < 0.2) {
        this.motion = false;
        this.velocity.set(0, 0);
        this.animation.setState(assignIdleState());
      }
    }
  }

  display() {
    let frame = this.animation.getFrame(this.frameOffset);
    image(frame, this.position.x, this.position.y, birdWidth, birdHeight);
  }
}

function assignIdleState() {
  let rand = random();
  if (rand < idleStateDistribution.idle1) return "idle1";
  else if (rand < idleStateDistribution.idle1 + idleStateDistribution.idle2) return "idle2";
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
  
  // Initialize wire plucks and next pluck times arrays
  for (let i = 0; i < numBirdsY; i++) {
    wirePlucks[i] = { time: -1000, amplitude: 0 };
    nextPluckTimes[i] = -1;
  }
}

function draw() {
  background(0);

  // Check and trigger random plucks
  for (let i = 0; i < numBirdsY; i++) {
    if (nextPluckTimes[i] >= 0 && frameCount >= nextPluckTimes[i]) {
      wirePlucks[i].time = frameCount;
      wirePlucks[i].amplitude = random(0.5, 1);
      nextPluckTimes[i] = frameCount + floor(random(30, 120)); // Next pluck in 0.5-2 seconds
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

    let baseAmplitude = 20;
    let decay = 0.95;
    
    beginShape();
    for (let x = 0; x <= width; x += 5) {
      let progress = map(x, 0, width, 0, 1);
      let yOffset = 0;
      
      // Calculate pluck effect
      let elapsed = frameCount - wirePlucks[i].time;
      if (elapsed >= 0 && elapsed < 60) {
        let pluckProgress = elapsed / 60;
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
  birds.forEach((bird) => {
    bird.motion = true;
    bird.applyForce(createVector(random(-10, -5), random(-1, 1)));
  });

  // Schedule initial random plucks
  for (let i = 0; i < numBirdsY; i++) {
    nextPluckTimes[i] = frameCount + floor(random(0, 60)); // First pluck within 1 second
  }
}