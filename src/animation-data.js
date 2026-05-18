// Sprite manifest. preload() walks this and fills `animations` with p5.Image arrays.

const frameCounts = {
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
  bFlyingBack: 6,
};

// Each entry: [animationKey, directoryPath, filePrefix].
// Directory paths use folder names with hyphens; file prefixes match the on-disk
// naming convention (which sometimes differs, e.g. "idle1-stillness" → "idle1-stillness_0.png").
const spriteManifest = [
  // Regular birds
  ['idle1', 'assets/idle1', 'idle1'],
  ['idle1stillness', 'assets/idle1-stillness', 'idle1-stillness'],
  ['idle2', 'assets/idle2', 'idle2'],
  ['idle2stillness', 'assets/idle2-stillness', 'idle2-stillness'],
  ['idle3', 'assets/idle3', 'idle3'],
  ['idle3stillness', 'assets/idle3-stillness', 'idle3-stillness'],
  ['idle4', 'assets/idle4', 'idle4'],
  ['idle4stillness', 'assets/idle4-stillness', 'idle4-stillness'],
  ['idle5', 'assets/idle5', 'idle5'],
  ['idle5stillness', 'assets/idle5-stillness', 'idle5-stillness'],
  ['idle6', 'assets/idle6', 'idle6'],
  ['idle6stillness', 'assets/idle6-stillness', 'idle6-stillness'],
  ['idle7', 'assets/idle7', 'idle7'],
  ['idle7stillness', 'assets/idle7-stillness', 'idle7-stillness'],
  ['idle8', 'assets/idle8', 'idle8'],
  ['idle8stillness', 'assets/idle8-stillness', 'idle8-stillness'],
  ['idle9stillness', 'assets/idle9-stillness', 'idle9-stillness'],
  ['landing1', 'assets/landing1', 'landing1'],
  ['outLeft1', 'assets/outLeft1', 'outLeft1'],
  ['scooting1', 'assets/scooting1', 'scooting1'],
  ['scootingLeft', 'assets/scootingLeft', 'scootingLeft'],
  ['scootingRight', 'assets/scootingRight', 'scootingRight'],
  ['flying1', 'assets/flying1', 'flying1'],
  ['flyingBack1', 'assets/flyingBack1', 'flyingBack1'],
  ['flying2', 'assets/flying2', 'flying2'],
  ['flyingBack2', 'assets/flyingBack2', 'flyingBack2'],

  // Easter-egg birds
  ['saiIdle', 'assets/easterEggBirds/sai/idle', 'saiIdle'],
  ['saiLanding', 'assets/easterEggBirds/sai/landing', 'saiLanding'],
  ['saiFlying', 'assets/easterEggBirds/sai/flying', 'saiFlying'],
  ['saiFlyingBack', 'assets/easterEggBirds/sai/flyingBack', 'saiFlyingBack'],
  ['audreyIdle', 'assets/easterEggBirds/audrey/idle', 'audreyIdle'],
  ['audreyLanding', 'assets/easterEggBirds/audrey/landing', 'audreyLanding'],
  ['audreyFlying', 'assets/easterEggBirds/audrey/flying', 'audreyFlying'],
  ['audreyFlyingBack', 'assets/easterEggBirds/audrey/flyingBack', 'audreyFlyingBack'],
  ['bIdle', 'assets/easterEggBirds/b/idle', 'bIdle'],
  ['bLanding', 'assets/easterEggBirds/b/landing', 'bLanding'],
  ['bFlying', 'assets/easterEggBirds/b/flying', 'bFlying'],
  ['bFlyingBack', 'assets/easterEggBirds/b/flyingBack', 'bFlyingBack'],
];

const animations = Object.fromEntries(Object.keys(frameCounts).map((k) => [k, []]));

function preloadAnimations() {
  for (const [key, dir, prefix] of spriteManifest) {
    const count = frameCounts[key];
    for (let i = 0; i < count; i++) {
      animations[key][i] = loadImage(`${dir}/${prefix}_${i}.png`);
    }
  }
}
