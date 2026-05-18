# flocking

A public art project in DUMBO by B Wu, Audrey Oh, and Sai Ram Ved Vijapurapu.



- **Mouse click** — manually trigger a flock takeoff (only when train-data mode is off).
- **T** — toggle train-data reactivity. When off, the flock only takes off on click; when on, the flock takes off when an upcoming train falls inside its trigger window.

## Project layout

```
index.html           # script load order lives here
style.css            # full-bleed canvas reset
src/
  config.js              # all tunable parameters
  animation-data.js      # sprite manifest + preloadAnimations()
  animation-manager.js   # AnimationManager, EasterEggAnimationManager,
                         # weighted-pick helpers
  bird.js                # Bird: idle / scoot / flight loop
  easter-egg-bird.js     # EasterEggBird: cameo birds for the artists
  wires.js               # wire pluck + slow undulation when flock is gone
  mta.js                 # goodservice.io polling, ETA → trigger logic
  sketch.js              # p5 entry point: preload / setup / draw / events
assets/                  # PNG sprite sequences for every animation state
archive/                 # earlier monolithic sketches kept for history
```

## How a flight cycle works

1. `mta.js` polls four feeds every 10 s and keeps a sorted list of upcoming train ETAs.
2. Each frame, `sketch.js`'s `maybeTriggerFromTrainData()` looks for a train whose ETA falls in its `triggerWindows` entry (e.g. `D_north: { min: 185, max: 200 }` — fires when the next D-uptown is 185–200 s out).
3. `triggerBirdFlight()` plucks every wire and schedules each bird to take off over the next ~150 frames.
4. After `returnDelay` (1500 frames ≈ 25 s at 60 fps), each bird picks a fresh landing spot on its original wire and flies back.
5. While the flock is gone, the wires shift from a high-frequency pluck to a slow rolling undulation, then fade back to a flat line as the flock returns.

## Tuning

Almost everything visible (idle probabilities, scoot distances, flight speeds, train windows, vibration parameters) lives in [src/config.js](src/config.js). Numbers there should be the only thing you need to touch to retune the piece.

## External dependencies

- [p5.js 1.11.1](https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.11.1/p5.js) — loaded from CDN
- [goodservice.io](https://goodservice.io) — public NYC subway ETA API
