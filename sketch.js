// Birds drawn by B (https://www.bethanylwu.com) 

let numBirdsX = 4;
let numBirdsY = 4;
let birds = [];
let birdWidth = 100;
let birdHeight = 100;
let margin;
let spacingX, spacingY;

let hand;
let playing = false;

let ramp = 0.1;

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

class Bird {
  constructor(x, y, frameOffset, idleState) {
    this.position = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.frameOffset = frameOffset;
    this.idleState = idleState;
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

      if (this.velocity.mag() < 0.2) {
        this.motion = false;
        this.velocity.set(0, 0);
      }
    }
  }

  display() {
    let state = this.motion ? "moving" : this.idleState;
    let frameSet = animations[state];
    let frameCountLimit = frameCounts[state];
    let frameIndex = (floor(frameCount / 6) + this.frameOffset) % frameCountLimit;
    image(frameSet[frameIndex], this.position.x, this.position.y, birdWidth, birdHeight);
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

  hand = createVideo("assets/hand/hand.mp4");
  hand.size(1280, 720);
  hand.hide();
}

function draw() {
  background(0);

  let img = hand.get();
  push();
  imageMode(CENTER);
  
  let handAspect = 1280 / 720;
  let canvasAspect = width / height;
  let scaleFactor = canvasAspect > handAspect ? height / 720 : width / 1280;

  let vidWidth = 1280 * scaleFactor * 2;
  let vidHeight = 720 * scaleFactor * 2;
  image(img, width / 2, height / 2, vidWidth, vidHeight);
  
  pop();

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
    noFill()
    stroke(255);
    strokeWeight(height / 200);

    let amplitude = (i + 1) * 2;
    let frequency = 0.01 + i * 0.002;
    
    // if (i == 3) frequency *= 3;

    beginShape();
    for (let x = 0; x <= width; x += 5) {
      let progress = map(x, 0, width, 0, 1);
      let yOffset = 0;
      
      if (playing) {
        let wave = sin((x * frequency * i) + frameCount * ramp); 
        let fade = sin(progress * PI);
        yOffset = amplitude * wave * fade;
        ramp+=0.0000005;
        
        if(ramp > 0.4) ramp = 0;

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

  playing = !playing;
  
  if (playing) {
    hand.play();
  } else {
    hand.pause();
  }
}
