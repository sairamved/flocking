// A single regular bird sitting on a wire. Handles steering, scooting, and
// the trigger/return flight loop. Reads from `state` (in sketch.js) to know
// when to take flight and when to return.

class Bird {
  constructor(x, y, frameOffset, stillnessState, flyingType, wireIndex) {
    this.originalPosition = createVector(x, y);
    this.position = createVector(x, y);
    this.targetPosition = createVector(x, y);
    this.velocity = createVector();
    this.acceleration = createVector();
    this.frameOffset = frameOffset;

    this.animation = new AnimationManager(flyingType);
    this.animation.setState(stillnessState);
    this.animation.baseStillnessState = stillnessState;

    this.motion = false;
    this.arrived = true;
    this.triggerTime = -1;
    this.returnTime = -1;

    this.maxOutSpeed = random(config.flightSpeed.out.min, config.flightSpeed.out.max);
    this.maxBackSpeed = random(config.flightSpeed.back.min, config.flightSpeed.back.max);
    this.currentMaxSpeed = this.maxOutSpeed;
    this.maxForce = 0.5;

    this.scooting = false;
    this.scootTarget = null;
    this.scootStartFrame = 0;
    this.hasHoppedFirst = false;
    this.hasHoppedSecond = false;

    // Prefer the explicit wireIndex (the caller already knows which wire it
    // intended). Fall back to back-computing from y for legacy call sites,
    // but the back-computation breaks once per-wire y-offsets are applied.
    this.wireIndex =
      typeof wireIndex === 'number'
        ? wireIndex
        : Math.round((y - margin + birdHeight / 4) / spacingY);
  }

  applyForce(force) {
    this.acceleration.add(force);
  }

  // Reynolds-style arrival steering: full speed far from target, ramped down
  // inside a 50px arrival radius.
  seek(target) {
    const desired = p5.Vector.sub(target, this.position);
    const distance = desired.mag();
    desired.normalize();
    if (distance < 50) {
      desired.mult(map(distance, 0, 50, 0, this.currentMaxSpeed));
    } else {
      desired.mult(this.currentMaxSpeed);
    }
    const steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxForce);
    return steer;
  }

  // Pick a return-landing spot on this bird's wire that isn't too close to
  // any existing bird; fall back to the nearest open slot if we can't.
  generateNewTargetOnWire() {
    const targetY = birdTargetYForWire(this.wireIndex);
    const xMin = birdSafeXMin();
    const xMax = max(xMin, birdSafeXMax());
    let newX;
    let attempts = 0;
    do {
      newX = random(xMin, xMax);
      attempts++;
    } while ((isInMaskedBand(newX) || this.isTooClose(newX, targetY)) && attempts < 50);

    if (attempts >= 50) newX = this.findNearestAvailableSpot(targetY);

    this.targetPosition.x = newX;
    this.targetPosition.y = targetY;
  }

  // We allow birds to land close, even overlapping — but never on the exact
  // same spot. Reject candidate (x, y) only if it's within a small tolerance
  // of another bird's position/target on the same wire.
  isTooClose(x, y) {
    const minSeparation = birdWidth * 0.25;
    for (const bird of birds) {
      if (bird === this) continue;
      // If the other bird is mid-return-flight, compare against where it's
      // heading, not where it currently is (likely off-screen).
      const otherIsReturning = bird.returnTime !== -1 && bird.triggerTime !== -1;
      const refX = otherIsReturning ? bird.targetPosition.x : bird.position.x;
      const refY = otherIsReturning ? bird.targetPosition.y : bird.position.y;
      const dx = Math.abs(x - refX);
      const dy = Math.abs(y - refY);
      if (dx < minSeparation && dy < birdHeight / 2) return true;
    }
    return false;
  }

  findNearestAvailableSpot(y) {
    const xMin = birdSafeXMin();
    const xMax = max(xMin, birdSafeXMax());
    let newX = xMin;
    while (newX < xMax) {
      if (!isInMaskedBand(newX) && !this.isTooClose(newX, y)) return newX;
      newX += birdWidth / 4;
    }
    return xMin;
  }

  findClosestNeighbor() {
    let closest = null;
    let minDist = Infinity;
    const wireY = this.originalPosition.y;
    for (const bird of birds) {
      if (bird === this || bird.originalPosition.y !== wireY || !bird.arrived) continue;
      const d = abs(this.position.x - bird.position.x);
      if (d < minDist) {
        minDist = d;
        closest = bird;
      }
    }
    return { bird: closest, distance: minDist };
  }

  // Scooting = tiny sideways hop animation toward (or away from) a neighbor,
  // triggered probabilistically when in idle. The hop displacements happen on
  // specific animation frames so the visual scoot syncs with the foot-down poses.
  updateScooting() {
    if (!this.arrived || this.motion) return;

    const inIdleOrStillness =
      this.animation.currentState.includes('idle') || this.animation.currentState.includes('stillness');

    // Forced scoot: if the mask is covering us, hop sideways toward whichever
    // edge of the band is closer. Repeats automatically until we're clear.
    if (!this.scooting && inIdleOrStillness && isInMaskedBand(this.position.x)) {
      const bandLeft = maskCenterX - maskWidth / 2;
      const bandRight = maskCenterX + maskWidth / 2;
      const exitLeft = bandLeft - birdWidth - 1;
      const exitRight = bandRight + 1;
      const goLeft =
        exitLeft >= 0 &&
        (exitRight > width - margin - birdWidth ||
          this.position.x - exitLeft < exitRight - this.position.x);
      this.beginScoot(goLeft ? exitLeft : exitRight);
      return;
    }

    if (!this.scooting && inIdleOrStillness && random() < config.scoot.probability) {
      const neighbor = this.findClosestNeighbor();
      if (neighbor.bird) {
        const dist = neighbor.distance;
        const neighborX = neighbor.bird.position.x;

        let candidate = null;
        if (dist > minScootDistance) {
          // Too far apart: scoot halfway toward the neighbor.
          candidate = this.position.x + (neighborX - this.position.x) * 0.5;
        } else if (dist < maxScootDistance) {
          // Too close: scoot away by half of maxScootDistance.
          const direction = this.position.x < neighborX ? -1 : 1;
          candidate = this.position.x + direction * (maxScootDistance / 2);
        }

        if (
          candidate !== null &&
          !isInMaskedBand(candidate) &&
          candidate >= birdSafeXMin() &&
          candidate <= birdSafeXMax()
        ) {
          this.beginScoot(candidate);
        }
      }
    }

    if (!this.scooting || this.scootTarget === null) return;

    const frameIndex = this.animation.getCurrentFrameIndex();
    const direction = this.scootTarget < this.targetPosition.x ? -1 : 1;

    if (frameIndex === 4 && !this.hasHoppedFirst) {
      this.position.x += direction * scootHopDistance;
      this.hasHoppedFirst = true;
    } else if (frameIndex === 8 && !this.hasHoppedSecond) {
      this.position.x += direction * scootHopDistance;
      this.hasHoppedSecond = true;
    } else if (frameIndex === 0 && this.hasHoppedSecond) {
      this.scooting = false;
      this.scootTarget = null;
      this.hasHoppedFirst = false;
      this.hasHoppedSecond = false;
      this.animation.setState(this.animation.baseStillnessState);
      this.targetPosition.x = this.position.x;
      this.originalPosition.x = this.position.x;
    }
  }

  beginScoot(target) {
    this.scootTarget = target;
    this.scooting = true;
    this.animation.setState(target < this.position.x ? 'scootingLeft' : 'scootingRight');
    this.scootStartFrame = frameCount;
    this.hasHoppedFirst = false;
    this.hasHoppedSecond = false;
  }

  update() {
    // Begin flying out at the scheduled trigger frame.
    if (!this.scooting && this.triggerTime >= 0 && frameCount >= this.triggerTime && this.returnTime === -1) {
      this.motion = true;
      this.arrived = false;
      this.scooting = false;
      this.scootTarget = null;
      this.animation.resetFlight();
      this.animation.setState(`flying${this.animation.flyingType}`);
      this.currentMaxSpeed = this.maxOutSpeed;
      if (this.velocity.mag() === 0) {
        this.velocity.set(random(-this.maxOutSpeed, -this.maxOutSpeed / 2), random(-2, 2));
      }
    }

    // Schedule the return-flight after the global return delay has elapsed.
    if (
      !this.scooting &&
      lastMousePressTime >= 0 &&
      frameCount >= lastMousePressTime + config.timing.returnDelay &&
      this.triggerTime !== -1 &&
      this.returnTime === -1
    ) {
      this.returnTime = frameCount + floor(random(0, 60));
      this.generateNewTargetOnWire();
    }

    if (this.motion) {
      this.velocity.add(this.acceleration);
      this.position.add(this.velocity);
      this.acceleration.mult(0);

      if (this.returnTime === -1) {
        // Outbound: hold the flying animation, keep moving left until off-screen.
        const flying = `flying${this.animation.flyingType}`;
        if (this.animation.currentState !== flying) this.animation.setState(flying);
        if (this.position.x > -birdWidth) {
          this.velocity.x = constrain(this.velocity.x, -this.maxOutSpeed, -this.maxOutSpeed / 2);
        }
      } else if (frameCount >= this.returnTime) {
        // Inbound: seek target, switch to landing within 50px, settle within 5px.
        this.currentMaxSpeed = this.maxBackSpeed;
        const distance = p5.Vector.dist(this.position, this.targetPosition);

        if (distance < 50 && this.animation.currentState !== 'landing1') {
          this.animation.setState('landing1');
        } else if (this.animation.currentState === 'landing1') {
          this.animation.updateLanding();
        } else {
          this.animation.setState(`flyingBack${this.animation.flyingType}`);
        }

        this.applyForce(this.seek(this.targetPosition));

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

      // If we stalled out before going off-screen, give another shove.
      if (this.velocity.mag() < 0.2 && this.returnTime === -1 && this.position.x > -birdWidth) {
        this.velocity.set(random(-this.maxOutSpeed, -this.maxOutSpeed / 2), random(-2, 2));
      }
    } else {
      this.updateScooting();
      this.animation.updateIdle();
    }
  }

  display() {
    image(this.animation.getFrame(this.frameOffset), this.position.x, this.position.y, birdWidth, birdHeight);
  }

  isOffScreen() {
    return this.position.x < -birdWidth;
  }
}
