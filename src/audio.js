// Flight audio: one shot plays each time a flight triggers. Overlapping
// triggers layer on top — earlier voices keep playing to completion. Muted
// instances are still spawned so unmuting mid-flight resumes audibility on
// the next trigger; currently-playing voices respect the mute via volume=0.

const flightAudioVoices = [];
let flightAudioMuted = false;
let flightAudioPathChecked = false;

function playFlightAudio() {
  const audio = new Audio(config.audio.flightSrc);
  audio.volume = flightAudioMuted ? 0 : config.audio.volume;
  audio.addEventListener('ended', () => {
    const i = flightAudioVoices.indexOf(audio);
    if (i !== -1) flightAudioVoices.splice(i, 1);
  });
  audio.addEventListener('error', () => {
    if (!flightAudioPathChecked) {
      console.warn('flight audio failed to load:', config.audio.flightSrc);
      flightAudioPathChecked = true;
    }
  });
  audio.play().catch((err) => {
    // Most likely: browser blocked autoplay before any user gesture. After the
    // first click/keypress this resolves on its own.
    console.warn('flight audio play() rejected:', err);
  });
  flightAudioVoices.push(audio);
}

function toggleFlightAudioMute() {
  flightAudioMuted = !flightAudioMuted;
  const v = flightAudioMuted ? 0 : config.audio.volume;
  flightAudioVoices.forEach((a) => {
    a.volume = v;
  });
  console.log('audio muted:', flightAudioMuted);
}
