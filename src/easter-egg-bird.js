// Cameo birds for the three artists. They fly in from the left, land on a
// wire, idle for a beat, then fly back off-screen. One at a time, every Nth
// flight cycle.

class EasterEggBird {
  constructor(type, x, y, wireIndex) {
    this.type = type; // 'sai' | 'audrey' | 'b'
    this.position = createVector(-birdWidth, y); // start off-screen left
    this.targetPosition = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.frameOffset = floor(random(0, frameCounts[`${type}Idle`]));
    this.animation = new EasterEggAnimationManager(type);
    this.state = 'flyingBack'; // flyingBack → landing → idle → flying
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
    const desired = p5.Vector.sub(target, this.position);
    const distance = desired.mag();
    desired.normalize();
    if (distance < 50) {
      desired.mult(map(distance, 0, 50, 0, this.maxSpeed));
    } else {
      desired.mult(this.maxSpeed);
    }
    const steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  }

  update() {
    // External trigger (regular flock departed) forces an early exit.
    if (this.triggered) {
      this.state = 'flying';
      this.animation.setState(`${this.type}Flying`);
      this.targetPosition.set(-birdWidth * 2, this.position.y);
    }

    if (this.state === 'flyingBack') {
      const distance = p5.Vector.dist(this.position, this.targetPosition);
      if (distance < 50) {
        this.animation.setState(`${this.type}Landing`);
        this.state = 'landing';
      }
      this.applyForce(this.seek(this.targetPosition));
    } else if (this.state === 'landing') {
      this.animation.updateLanding();
      if (this.animation.currentState === `${this.type}Idle`) {
        this.state = 'idle';
        this.idleStartFrame = frameCount;
        this.position.set(this.targetPosition);
        this.velocity.set(0, 0);
      } else {
        this.applyForce(this.seek(this.targetPosition));
      }
    } else if (this.state === 'idle') {
      if (frameCount >= this.idleStartFrame + config.easterEgg.idleDuration) {
        this.state = 'flying';
        this.animation.setState(`${this.type}Flying`);
        this.targetPosition.set(-birdWidth * 2, this.position.y);
      }
    } else if (this.state === 'flying') {
      this.applyForce(this.seek(this.targetPosition));
    }

    this.velocity.add(this.acceleration);
    this.position.add(this.velocity);
    this.acceleration.mult(0);

    return this.isOffScreen() && this.state === 'flying';
  }

  display() {
    image(this.animation.getFrame(this.frameOffset), this.position.x, this.position.y, birdWidth, birdHeight);
  }

  isOffScreen() {
    return this.position.x < -birdWidth;
  }

  triggerFlight() {
    this.triggered = true;
  }
}
