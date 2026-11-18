// Extension (Sled Symphony): the instruments, synthesized with the Web Audio API
// so the app needs no sound files.
//
// A line's colour chooses its instrument (see render.gleam's color_hex), and its
// length chooses its pitch, as for a string, snapped to a pentatonic scale so
// any drawing sounds musical.

// Browsers only let a page make sound after the user has interacted with it,
// so the AudioContext is created (or resumed) on the first click or key press.
let audio = null;
let master = null;
let muted = false;

function unlock() {
  try {
    if (!audio) {
      const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
      if (!Ctx) return;
      audio = new Ctx();
      const compressor = audio.createDynamicsCompressor();
      master = audio.createGain();
      master.gain.value = 0.6;
      master.connect(compressor);
      compressor.connect(audio.destination);
    }
    if (audio.state === "suspended") audio.resume();
  } catch (e) {
    console.error("Sound is unavailable:", e);
  }
}

if (globalThis.document) {
  document.addEventListener("pointerdown", unlock, true);
  document.addEventListener("keydown", unlock, true);
}

export function setMuted(m) {
  muted = m;
}

// Whether a note played now would be heard. A context that isn't running yet
// would queue its notes and play them all at once later, so nothing is played
// until it is.
export function canPlay() {
  return !muted && audio !== null && audio.state === "running";
}

// ── Pitch ────────────────────────────────────────────────────────────────────

const PENTATONIC = [0, 2, 4, 7, 9];
const STEPS = 15; // three octaves of the scale, from A3 up
const LOWEST_MIDI = 57; // A3

// The frequency of a line's note from its length (in world units), like a
// string: shorter lines are higher. Lengths from about 20 to 1400 span the
// three octaves of the scale.
export function pitchFromLength(length) {
  const lo = Math.log(20);
  const hi = Math.log(1400);
  const t = (Math.log(Math.max(length, 1)) - lo) / (hi - lo);
  const height = 1 - Math.max(0, Math.min(1, t)); // 1 for the shortest
  const step = Math.round(height * (STEPS - 1));
  const midi =
    LOWEST_MIDI + 12 * Math.floor(step / 5) + PENTATONIC[step % 5];
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// ── Instruments ──────────────────────────────────────────────────────────────

// An envelope: a gain that rises to peak in attack seconds, then decays to
// silence over decay seconds.
function envelope(t, peak, attack, decay) {
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t + attack);
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  g.connect(master);
  return g;
}

function tone(type, freq, t, dest, length, gain = 1) {
  const o = audio.createOscillator();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (gain === 1) {
    o.connect(dest);
  } else {
    const g = audio.createGain();
    g.gain.value = gain;
    o.connect(g);
    g.connect(dest);
  }
  o.start(t);
  o.stop(t + length);
  return o;
}

function piano(f, v, t) {
  const env = envelope(t, 0.5 * v, 0.005, 1.2);
  tone("triangle", f, t, env, 1.3);
  tone("sine", 2 * f, t, env, 1.3, 0.3);
}

function bell(f, v, t) {
  const env = envelope(t, 0.4 * v, 0.003, 2.2);
  tone("sine", f, t, env, 2.3);
  tone("sine", 2.76 * f, t, env, 2.3, 0.4);
  tone("sine", 5.4 * f, t, env, 1.2, 0.15);
}

function marimba(f, v, t) {
  const env = envelope(t, 0.55 * v, 0.003, 0.45);
  tone("sine", f, t, env, 0.5);
  tone("sine", 4 * f, t, envelope(t, 0.15 * v, 0.002, 0.12), 0.15);
}

function bass(f, v, t) {
  const env = envelope(t, 0.45 * v, 0.008, 0.7);
  const lowpass = audio.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 700;
  lowpass.connect(env);
  tone("sawtooth", f / 2, t, lowpass, 0.8);
}

function synth(f, v, t) {
  const env = envelope(t, 0.22 * v, 0.01, 0.5);
  const lowpass = audio.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.frequency.value = 2400;
  lowpass.connect(env);
  tone("square", f, t, lowpass, 0.6);
  tone("square", f * 1.006, t, lowpass, 0.6);
}

// A drum has no pitch: a falling thump plus a short burst of noise.
function drum(_f, v, t) {
  const body = audio.createOscillator();
  body.type = "sine";
  body.frequency.setValueAtTime(160, t);
  body.frequency.exponentialRampToValueAtTime(45, t + 0.25);
  body.connect(envelope(t, 0.8 * v, 0.002, 0.3));
  body.start(t);
  body.stop(t + 0.35);

  const length = Math.floor(audio.sampleRate * 0.15);
  const buffer = audio.createBuffer(1, length, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const noise = audio.createBufferSource();
  noise.buffer = buffer;
  const band = audio.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = 1200;
  noise.connect(band);
  band.connect(envelope(t, 0.3 * v, 0.002, 0.12));
  noise.start(t);
}

// The instrument for each colour that render.gleam's color_hex can produce.
// Any other colour (such as a plain Line's cream) plays the piano.
const INSTRUMENTS = {
  "#6fa8e0": bell, // Blue
  "#e0584f": drum, // Red
  "#6cc070": marimba, // Green
  "#a678e8": bass, // Purple
  "#f0b030": synth, // Gold
};

// Play a note at frequency f on the instrument of a line with this colour, at
// volume v in [0, 1].
export function playNote(color, f, v = 1) {
  if (!canPlay()) return;
  const instrument = INSTRUMENTS[color] || piano;
  instrument(f, Math.max(0.05, Math.min(1, v)), audio.currentTime);
}

// A rising arpeggio for reaching the goal.
export function playFanfare() {
  if (!canPlay()) return;
  const t = audio.currentTime;
  [0, 4, 7, 12].forEach((semitones, i) => {
    const f = 523.25 * Math.pow(2, semitones / 12);
    bell(f, 0.8, t + i * 0.11);
  });
}

// A low thud for a crash.
export function playCrash() {
  if (!canPlay()) return;
  drum(0, 1, audio.currentTime);
  bass(110, 0.8, audio.currentTime + 0.05);
}
