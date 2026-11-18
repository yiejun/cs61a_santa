// The canvas animation loop. The renderer is kept out of Lustre's virtual DOM:
// Gleam computes the full curve of every path once (whenever the code or
// `shape_slider` changes) and pushes it here via `setDrawing`. A single
// requestAnimationFrame loop owns the clock and, each frame, reveals a growing
// prefix of the precomputed points straight to the 2D context. So per frame
// there is no geometry work and no vdom diffing — just canvas strokes — which
// is what lets many paths animate at high frames per second.
//
// Values cross the Gleam/JS boundary directly — no JSON: a Gleam record arrives
// as an object with named fields, and a Gleam list is iterable.
//
// Extension (Sled Symphony), only for drawings that use ColorLine, Rider, or
// Goal: lines are strings that play and vibrate, sleds ride the lines drawn so
// far, and the camera follows them. The Sled Studio lets the user draw a track
// with the mouse; see the Studio section at the end.

import {
  playNote,
  playFanfare,
  playCrash,
  pitchFromLength,
  setMuted as setAudioMuted,
} from "./audio.mjs";
import { toList } from "./gleam.mjs";

let canvas = null;
let ctx = null;
// { paths: [{ pts: Float64Array [x0,y0,...], thickness, color, start, end }] }
let drawing = null;
let rate = 1; // a multiple of normal speed; negative plays the drawing backward
let clock = 0; // the drawing's time, in tenths of a second, in [0, endClock]
let lastTs = 0;
let running = false;
let framesWithoutCanvas = 0;

const TENTHS_PER_SECOND = 10;
// How many frames (about 10 seconds' worth) to wait for the canvas to appear
// before reporting that it hasn't.
const MAX_FRAMES_WITHOUT_CANVAS = 600;

// Replace the drawing being animated. `pathList` is the List(RenderPath) built
// by render.gleam; each path's points are packed into a flat Float64Array so
// the per-frame draw loop touches only contiguous numbers.
export function setDrawing(pathList) {
  const paths = [];
  for (const p of pathList) {
    const flat = [];
    for (const q of p.points) flat.push(q.x, q.y);
    paths.push({
      pts: new Float64Array(flat),
      thickness: p.thickness,
      color: p.color,
      start: p.start,
      end: p.end,
    });
  }
  // Keep the current clock across drawing swaps: dragging the shape slider on an
  // already-finished drawing shows the new shape complete, rather than restarting.
  // `endClock` is the moment the last path finishes drawing, past which the frame
  // loop holds time still (see frame).
  drawing = { paths, endClock: drawingEndClock(paths) };
  // A new drawing is a new track: its strings are at rest, and the sleds ride
  // it again from the start, up to the current time, silently.
  vibrations.clear();
  startSleds();
  if (!running) {
    running = true;
    lastTs = performance.now();
    requestAnimationFrame(frame);
  }
}

// The clock at which every path has fully drawn — the largest per-path finish
// time (u = 1). A path finishes at its `end` time, or right at `start` when it
// has no positive duration (end ≤ start, an instant path). An empty drawing
// has nothing to finish, so time runs on unbounded (Infinity).
function drawingEndClock(paths) {
  let end = Infinity;
  for (const p of paths) {
    const finish = Math.max(p.start, p.end);
    end = end === Infinity ? finish : Math.max(end, finish);
  }
  return end;
}

export function setSpeed(r) {
  rate = r;
}

// Jump the animation back to the start (empty canvas).
export function resetClock() {
  clock = 0;
  // Notes at time 0 should play again when the drawing next runs.
  noteClock = -1;
  if (drawing) startSleds();
}

export function setMuted(m) {
  setAudioMuted(m);
}

// Whether the current drawing is a Sled Symphony drawing (one that uses
// ColorLine, Rider, or Goal). Only then are there notes, sleds, and effects;
// any other drawing animates exactly as before.
let game = false;

export function setGame(on) {
  game = on;
}

function frame(ts) {
  // Cap dt so a backgrounded/paused tab can't jump the clock far ahead.
  const dt = Math.min((ts - lastTs) / 1000, 0.1);
  lastTs = ts;
  notesLeft = MAX_NOTES_PER_FRAME;
  // The clock runs forward, each path drawing in over its window and then
  // staying; there is no loop back to an empty canvas. It is bounded at both
  // ends: reverse rewinds only as far as the start (0), and forward stops the
  // instant the last path has fully drawn (endClock), so time never runs on past
  // a finished drawing — unless sleds are still riding, in which case time runs
  // on until their rides end.
  clock += dt * rate * TENTHS_PER_SECOND;
  clock = clamp(clock, 0, Math.max(drawing.endClock, sledsEndClock()));
  if (studio === "draw") {
    noteClock = clock;
  } else {
    playRevealedNotes();
    advanceSleds(clock);
  }
  updateParticles(dt);
  updateCamera(dt);
  render();
  requestAnimationFrame(frame);
}

// Match the backing store to the element's CSS size (× device pixel ratio) so
// the drawing stays crisp; only touched when the size actually changes.
function ensureSize() {
  const dpr = window.devicePixelRatio || 1;
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
    canvas.width = w;
    canvas.height = h;
  }
}

// Find the page's canvas, which Lustre can add to the page after the first drawing
// arrives. Returns whether it is there.
function findCanvas() {
  const el = document.getElementById("animation-canvas");
  if (!el) {
    framesWithoutCanvas += 1;
    if (framesWithoutCanvas === MAX_FRAMES_WITHOUT_CANVAS) {
      console.error('The page has no <canvas id="animation-canvas"> element to draw on.');
    }
    return false;
  }
  if (el !== canvas) {
    canvas = el;
    ctx = canvas.getContext("2d");
    listenForPointer(canvas);
  }
  return true;
}

function render() {
  if (!findCanvas()) return;
  ensureSize();
  const w = canvas.width;
  const h = canvas.height;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, w, h);
  if (studio === "draw") {
    // The Studio's own canvas: the lines drawn so far, the flag, and a guide.
    ctx.setTransform(w / 1000, 0, 0, h / 1000, w / 2, h / 2);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    renderStudio(w, h);
    return;
  }
  // Draw functions work in a 0..1000 world centred on the origin: scale it to
  // fill the canvas and translate (0, 0) to the middle, so positive coordinates
  // run toward the bottom-right corner. The sled camera may pan and zoom this
  // view; for any other drawing it stays put.
  applyCamera(w, h);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  drawing.paths.forEach((p, i) => {
    // Each path is revealed by a parameter u ∈ [0, 1] that advances at a steady
    // rate. A path is complete once u reaches 1.
    const u = penU(p);
    // `u` clamps to 0 both before a path starts and at the very instant it
    // does, so it can't tell "not yet" from "just begun". Gate on the start
    // time instead, so a just-begun path is shown at rest at u = 0
    // rather than staying hidden until the clock advances.
    if (clock >= p.start) {
      const v = vibrations.get(i);
      if (v && isLine(p) && u > 0) drawVibrating(p, u, v);
      else drawUpToU(p, u);
    }
  });
  if (game) renderSledScene();
  drawParticles();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (game) drawStatus(w, h);
}

// How much of a path is revealed now: its parameter u ∈ [0, 1], advancing
// linearly from its start time to its end time — 0 before it starts, 1 once
// done. A path with no positive duration (end ≤ start) appears complete the
// moment it starts.
function penU(p, at = clock) {
  const duration = p.end - p.start;
  if (duration <= 0) return at >= p.start ? 1 : 0;
  const u = (at - p.start) / duration;
  return u < 0 ? 0 : u > 1 ? 1 : u;
}

function clamp(x, lo, hi) {
  return x < lo ? lo : x > hi ? hi : x;
}

// Stroke the first `u` fraction of a path's polyline, interpolating the final
// partial segment so the curve reveals smoothly rather than a vertex at a time.
function drawUpToU(p, u) {
  const pts = p.pts;
  const count = pts.length / 2;
  if (count < 2) return;
  const segs = count - 1;
  const f = u * segs;
  const k = Math.min(segs, Math.floor(f));
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 1; i <= k; i++) ctx.lineTo(pts[2 * i], pts[2 * i + 1]);
  const frac = f - k;
  if (k < segs && frac > 0) {
    const ax = pts[2 * k];
    const ay = pts[2 * k + 1];
    const bx = pts[2 * k + 2];
    const by = pts[2 * k + 3];
    ctx.lineTo(ax + (bx - ax) * frac, ay + (by - ay) * frac);
  }
  ctx.lineWidth = p.thickness;
  ctx.strokeStyle = p.color;
  ctx.stroke();
}

// ── Extension: lines are strings ─────────────────────────────────────────────

function isLine(p) {
  return p.pts.length >= 4;
}

function lineLength(p) {
  const n = p.pts.length;
  return Math.hypot(p.pts[n - 2] - p.pts[0], p.pts[n - 1] - p.pts[1]);
}

// A line's note: its length sets the pitch, its colour the instrument.
function pluck(p, volume) {
  if (notesLeft <= 0) return;
  notesLeft -= 1;
  playNote(p.color, pitchFromLength(lineLength(p)), volume);
}

// The strings vibrating now: path index → { amp, t0 (ms), hz }. A pluck sets
// an amplitude that decays over about a second and a half.
const vibrations = new Map();
const VIBRATION_MS = 1500;

function vibrate(map, key, p, amp) {
  const old = map.get(key);
  const now = performance.now();
  // A new pluck only takes over from a stronger, newer one if it is stronger.
  if (old && old.amp * vibrationLeft(old, now) > amp) return;
  // Shorter strings shimmer faster, as they sound higher.
  const hz = 6 + 18 * (1 - Math.min(1, lineLength(p) / 900));
  map.set(key, { amp, t0: now, hz });
}

function vibrationLeft(v, now) {
  const age = (now - v.t0) / VIBRATION_MS;
  return age >= 1 ? 0 : Math.exp(-3 * age) * (1 - age);
}

// Stroke the revealed part of a line as a plucked string: a standing wave,
// fixed at both ends, whose amplitude decays after the pluck.
function drawVibrating(p, u, v) {
  const now = performance.now();
  const left = vibrationLeft(v, now);
  if (left <= 0) {
    vibrations.forEach((value, key) => value === v && vibrations.delete(key));
    drawUpToU(p, u);
    return;
  }
  const pts = p.pts;
  const n = pts.length;
  const ax = pts[0];
  const ay = pts[1];
  const dx = (pts[n - 2] - ax) * u;
  const dy = (pts[n - 1] - ay) * u;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const swing = v.amp * left * Math.sin((2 * Math.PI * v.hz * (now - v.t0)) / 1000);
  const SAMPLES = 28;
  ctx.beginPath();
  for (let i = 0; i <= SAMPLES; i++) {
    const s = i / SAMPLES;
    const off = swing * Math.sin(Math.PI * s);
    const x = ax + dx * s + nx * off;
    const y = ay + dy * s + ny * off;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.lineWidth = p.thickness;
  ctx.strokeStyle = p.color;
  ctx.stroke();
}

// ── Extension: notes as lines appear ─────────────────────────────────────────

// The clock as of the last frame's notes. Each frame plays the lines whose start
// time the clock crossed since then, in either direction, so the speed slider
// sets the tempo and playing backward plays the notes in reverse order.
let noteClock = -1;

// The most notes a single frame plays, shared by lines appearing and sleds
// landing, so fifty sleds or a hundred lines make music rather than a roar.
const MAX_NOTES_PER_FRAME = 8;
let notesLeft = MAX_NOTES_PER_FRAME;

function playRevealedNotes() {
  const from = noteClock;
  const to = clock;
  noteClock = clock;
  if (!game || from === to) return;
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const due = [];
  drawing.paths.forEach((p, i) => {
    if (!isLine(p)) return;
    const crossed = from < to ? p.start > lo && p.start <= hi : p.start >= lo && p.start < hi;
    if (crossed) due.push(i);
  });
  if (due.length === 0) return;
  // Spread the allowance evenly over a big chord, and soften each note so the
  // chord isn't louder than a single line.
  const stride = Math.max(1, Math.ceil(due.length / MAX_NOTES_PER_FRAME));
  const volume = 0.6 / Math.sqrt(Math.min(due.length, MAX_NOTES_PER_FRAME));
  for (let k = 0; k < due.length; k += stride) pluck(drawing.paths[due[k]], volume);
  // Every appearing line gives a small pluck.
  for (const i of due) vibrate(vibrations, i, drawing.paths[i], 3);
}

// ── Extension: the sleds ─────────────────────────────────────────────────────
//
// Each sled is a small circle that falls under gravity and slides along lines,
// but only along the parts of them that have been drawn at the current time.
// Rides are simulated in drawing time (tenths of a second, like the clock), in
// fixed small steps, so the same drawing always gives the same rides. Snapshots
// are kept every so often, so that playing backward rewinds each sled along
// the ride it took.

const GRAVITY = 900; // world units per second²
const SLED_RADIUS = 7; // world units, plus half the line's thickness
const MAX_SPEED = 1400; // world units per second, so a sled can't tunnel
const STEP = TENTHS_PER_SECOND / 240; // one physics step, in tenths of a second
const SNAPSHOT_EVERY = 12; // steps between snapshots
const GOAL_RADIUS = 30;
const OUT_OF_BOUNDS = 560;
const STILL_SPEED = 6; // below this a sled counts as stopped
const STILL_TENTHS = 20; // stopped this long after the drawing ends: the ride ends
const MAX_RIDE_TENTHS = 600; // a ride that never ends stops after a minute
const MAX_SLED_LINES = 3000; // more lines than this: no sleds
const MAX_SLEDS = 50;
const TRAIL_LENGTH = 40;
const SLED_COLORS = ["#ff7a59", "#6fa8e0", "#6cc070", "#f0b030", "#a678e8", "#e0584f"];

// The drawing's Rider and Goal markers: [{ kind, x, y, start }].
let markers = [];

// The sleds of the drawing. Each one is
//   { spawn: { x, y, t }, s: state, history: [state], trail: [x, y, color, ...],
//     color }
// and a state is { t, x, y, vx, vy, status, finishT, contact, airborne, still,
//   lastNoteT: Map, angle, steps }, where status runs
//   waiting → riding → goal | crashed | stopped.
let sleds = [];

export function setMarkers(list) {
  markers = [];
  for (const m of list) markers.push({ kind: m.kind, x: m.x, y: m.y, start: m.start });
}

// Where and when each sled drops in: every Rider marker (up to MAX_SLEDS), or,
// with none, one sled just above the start of the line that appears first.
function sledSpawns() {
  const riders = markers.filter((m) => m.kind === "rider").slice(0, MAX_SLEDS);
  if (riders.length > 0) return riders.map((m) => ({ x: m.x, y: m.y, t: m.start }));
  let first = null;
  for (const p of drawing.paths) {
    if (isLine(p) && (first === null || p.start < first.start)) first = p;
  }
  if (first === null) return [];
  // A little way in from the line's higher end, so the sled doesn't balance on
  // the very tip.
  const n = first.pts.length;
  const [hx, hy, ox, oy] =
    first.pts[1] <= first.pts[n - 1]
      ? [first.pts[0], first.pts[1], first.pts[n - 2], first.pts[n - 1]]
      : [first.pts[n - 2], first.pts[n - 1], first.pts[0], first.pts[1]];
  return [{ x: hx + (ox - hx) * 0.08, y: hy + (oy - hy) * 0.08 - 25, t: first.start }];
}

// Begin every sled's ride from the start, then catch them up to the current
// time silently, so a drawing that changes mid-ride keeps time with the clock.
function startSleds() {
  sleds = [];
  const lines = drawing.paths.filter(isLine).length;
  if (!game || lines === 0 || lines > MAX_SLED_LINES) return;
  sleds = sledSpawns().map((spawn, i) => {
    const sled = {
      spawn,
      s: initialState(spawn),
      history: [],
      trail: [],
      color: SLED_COLORS[i % SLED_COLORS.length],
    };
    sled.history.push(copyState(sled.s));
    return sled;
  });
  advanceSleds(clock, true);
}

function initialState(spawn) {
  return {
    t: 0,
    x: spawn.x,
    y: spawn.y,
    vx: 0,
    vy: 0,
    status: "waiting",
    finishT: null,
    contact: -1,
    airborne: 0,
    still: 0,
    lastNoteT: new Map(),
    angle: 0,
    steps: 0,
  };
}

function copyState(s) {
  return { ...s, lastNoteT: new Map(s.lastNoteT) };
}

function isActive(sled) {
  return sled.s.status === "waiting" || sled.s.status === "riding";
}

// The latest time the clock may run to for the sleds: unbounded while any is
// still waiting or riding, so rides can finish after the drawing has.
function sledsEndClock() {
  let end = 0;
  for (const sled of sleds) {
    if (isActive(sled)) return Infinity;
    end = Math.max(end, sled.s.finishT);
  }
  return end;
}

function advanceSleds(target, silent = false) {
  for (const sled of sleds) advanceSled(sled, target, silent);
}

// Move one sled's ride to time `target`: forward by simulating, backward by
// restoring its last snapshot before it.
function advanceSled(sled, target, silent) {
  if (target < sled.s.t) {
    while (sled.history.length > 1 && sled.history[sled.history.length - 1].t > target) {
      sled.history.pop();
    }
    sled.s = copyState(sled.history[sled.history.length - 1]);
    sled.trail = [];
    silent = true; // catching up after a rewind replays nothing
  }
  const s = sled.s;
  while (s.t < target) {
    if (s.status === "waiting") {
      if (target < sled.spawn.t) {
        s.t = target;
        break;
      }
      s.t = sled.spawn.t;
      s.status = "riding";
      continue;
    }
    if (s.status !== "riding") {
      s.t = target;
      break;
    }
    step(sled, Math.min(STEP, target - s.t), silent);
    s.steps += 1;
    if (s.steps % SNAPSHOT_EVERY === 0) sled.history.push(copyState(s));
    if (!silent && s.steps % 4 === 0) {
      const color = s.contact >= 0 ? drawing.paths[s.contact].color : sled.color;
      sled.trail.push(s.x, s.y, color);
      if (sled.trail.length > TRAIL_LENGTH * 3) sled.trail.splice(0, 3);
    }
  }
}

// One physics step of dt tenths of a second.
function step(sled, dt, silent) {
  const s = sled.s;
  const sec = dt / TENTHS_PER_SECOND;
  s.t += dt;
  s.vy += GRAVITY * sec;
  const speed = Math.hypot(s.vx, s.vy);
  if (speed > MAX_SPEED) {
    s.vx *= MAX_SPEED / speed;
    s.vy *= MAX_SPEED / speed;
  }
  s.x += s.vx * sec;
  s.y += s.vy * sec;

  // Push the sled out of every drawn line it overlaps, and turn its velocity to
  // run along the line.
  let touching = -1;
  let deepest = 0;
  let impact = 0;
  drawing.paths.forEach((p, i) => {
    if (!isLine(p) || s.t < p.start) return;
    const u = penU(p, s.t);
    const pts = p.pts;
    const segs = pts.length / 2 - 1;
    const f = u * segs;
    const reach = SLED_RADIUS + p.thickness / 2;
    for (let k = 0; k < segs && k < f; k++) {
      const ax = pts[2 * k];
      const ay = pts[2 * k + 1];
      // The last segment is drawn only partway.
      const part = Math.min(1, f - k);
      const bx = ax + (pts[2 * k + 2] - ax) * part;
      const by = ay + (pts[2 * k + 3] - ay) * part;
      const hit = collide(s, ax, ay, bx, by, reach);
      if (hit.depth > deepest) {
        deepest = hit.depth;
        touching = i;
        impact = Math.max(impact, hit.into);
      }
    }
  });

  // A sled that has just left a line over a downhill bend stays pressed to the
  // line below it, as on packed snow, rather than flying off every corner. A
  // fast enough jump still clears the gap.
  if (touching < 0 && s.contact >= 0 && s.airborne < 0.3) {
    const held = holdToLine(s);
    if (held >= 0) touching = held;
  }

  if (touching >= 0) {
    // Landing on a new line plucks it: a note and a visible vibration, both
    // stronger the faster the sled is.
    const landed = touching !== s.contact && (s.airborne > 0.6 || s.contact >= 0);
    const last = s.lastNoteT.get(touching);
    if (!silent && landed && (last === undefined || s.t - last > 2.5)) {
      const p = drawing.paths[touching];
      const v = Math.hypot(s.vx, s.vy);
      const strength = Math.min(1, v / 900);
      pluck(p, 0.3 + 0.7 * strength);
      vibrate(vibrations, touching, p, 4 + 14 * strength);
      snowSpray(s.x, s.y, p.color, 6 + Math.round(10 * strength));
      if (impact > 350) shake(Math.min(10, impact / 80));
      s.lastNoteT.set(touching, s.t);
    }
    s.contact = touching;
    s.airborne = 0;
  } else {
    s.airborne += dt;
    if (s.airborne > 0.6) s.contact = -1;
  }

  const v = Math.hypot(s.vx, s.vy);
  if (v > 20) {
    // Face the way it is going, never upside down.
    s.angle = s.vx < 0 ? Math.atan2(-s.vy, -s.vx) : Math.atan2(s.vy, s.vx);
  }

  // Reaching a goal wins; leaving the canvas crashes.
  for (const g of markers) {
    if (g.kind === "goal" && s.t >= g.start && Math.hypot(s.x - g.x, s.y - g.y) < GOAL_RADIUS) {
      finish(sled, "goal", silent);
      return;
    }
  }
  if (s.y > OUT_OF_BOUNDS || Math.abs(s.x) > OUT_OF_BOUNDS) {
    finish(sled, "crashed", silent);
    return;
  }
  // Resting once the drawing is complete, or riding for too long, ends the ride.
  s.still = v < STILL_SPEED ? s.still + dt : 0;
  if (s.t >= drawing.endClock && s.still > STILL_TENTHS) finish(sled, "stopped", silent);
  else if (s.t - sled.spawn.t > MAX_RIDE_TENTHS) finish(sled, "stopped", silent);
}

// How close (in world units, beyond touching) a line must be for a sled that
// has just left a line to stay pressed to it.
const HOLD_GAP = 9;

// Pull the sled down onto the nearest drawn line just below it, if there is one
// within HOLD_GAP, and stop it moving away from that line. Returns the line's
// index, or -1.
function holdToLine(s) {
  let best = null;
  drawing.paths.forEach((p, i) => {
    if (!isLine(p) || s.t < p.start) return;
    const pts = p.pts;
    const segs = pts.length / 2 - 1;
    const f = penU(p, s.t) * segs;
    const reach = SLED_RADIUS + p.thickness / 2;
    for (let k = 0; k < segs && k < f; k++) {
      const ax = pts[2 * k];
      const ay = pts[2 * k + 1];
      const part = Math.min(1, f - k);
      const bx = ax + (pts[2 * k + 2] - ax) * part;
      const by = ay + (pts[2 * k + 3] - ay) * part;
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy;
      if (len2 === 0) continue;
      const t = ((s.x - ax) * dx + (s.y - ay) * dy) / len2;
      // Only alongside the segment, not off its ends.
      if (t <= 0 || t >= 1) continue;
      const qx = ax + dx * t;
      const qy = ay + dy * t;
      const d = Math.hypot(s.x - qx, s.y - qy);
      const gap = d - reach;
      // Only a line below the sled.
      if (gap <= 0 || gap > HOLD_GAP || s.y >= qy) continue;
      if (best === null || gap < best.gap) best = { i, qx, qy, d, reach, gap };
    }
  });
  if (best === null) return -1;
  const nx = (s.x - best.qx) / best.d;
  const ny = (s.y - best.qy) / best.d;
  s.x = best.qx + nx * best.reach;
  s.y = best.qy + ny * best.reach;
  const away = s.vx * nx + s.vy * ny;
  if (away > 0) {
    s.vx -= away * nx;
    s.vy -= away * ny;
  }
  return best.i;
}

// The first sled home gets a fanfare; later ones a single bell.
let lastCrashSound = 0;

function finish(sled, status, silent) {
  const s = sled.s;
  s.status = status;
  s.finishT = s.t;
  sled.history.push(copyState(s));
  if (silent) return;
  if (status === "goal") {
    const firstHome = sleds.filter((o) => o.s.status === "goal").length === 1;
    if (firstHome) playFanfare();
    else if (notesLeft > 0) {
      notesLeft -= 1;
      playNote("#6fa8e0", 1046.5, 0.4);
    }
    fireworks(s.x, s.y, firstHome ? 70 : 24);
  }
  if (status === "crashed") {
    const now = performance.now();
    if (now - lastCrashSound > 300) {
      playCrash();
      lastCrashSound = now;
    }
    debris(s.x, Math.min(s.y, 500), sled.color);
    shake(6);
  }
}

// Resolve the sled against segment a–b: if it is within reach, push it out and
// turn its velocity to run along the segment. Returns how deep it was (0 for no
// hit) and how fast it was moving into the segment.
function collide(s, ax, ay, bx, by, reach) {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  let t = len2 > 0 ? ((s.x - ax) * dx + (s.y - ay) * dy) / len2 : 0;
  t = clamp(t, 0, 1);
  const qx = ax + dx * t;
  const qy = ay + dy * t;
  const ox = s.x - qx;
  const oy = s.y - qy;
  const d = Math.hypot(ox, oy);
  if (d >= reach) return { depth: 0, into: 0 };
  // Exactly on the line: push up, off its top side.
  let nx = 0;
  let ny = -1;
  if (d > 1e-6) {
    nx = ox / d;
    ny = oy / d;
  } else if (len2 > 0) {
    nx = dy / Math.sqrt(len2);
    ny = -dx / Math.sqrt(len2);
    if (ny > 0) {
      nx = -nx;
      ny = -ny;
    }
  }
  s.x = qx + nx * reach;
  s.y = qy + ny * reach;
  const into = s.vx * nx + s.vy * ny;
  if (into < 0) {
    // Turn the sled to run along the line rather than just stopping its motion
    // into it, so it carries its speed through bends and up ramps, keeping
    // more of it the more gently it meets the line.
    const speed = Math.hypot(s.vx, s.vy);
    const tx = s.vx - into * nx;
    const ty = s.vy - into * ny;
    const along = Math.hypot(tx, ty);
    if (along > 1e-6) {
      const keep = (speed * (0.5 + 0.5 * (along / speed)) * 0.998) / along;
      s.vx = tx * keep;
      s.vy = ty * keep;
    } else {
      s.vx = 0;
      s.vy = 0;
    }
  }
  return { depth: reach - d, into: Math.max(0, -into) };
}

// ── Extension: juice (particles and the camera) ──────────────────────────────

// Particles live in real time, not drawing time, so they finish their flight
// even while the drawing is paused. Each is { x, y, vx, vy, life, max, color,
// size, gravity }.
let particles = [];
const MAX_PARTICLES = 900;

function addParticle(p) {
  if (particles.length >= MAX_PARTICLES) particles.shift();
  particles.push(p);
}

// A spray of snow, tinted with the line's colour, kicked up by a landing.
function snowSpray(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
    const sp = 60 + Math.random() * 160;
    addParticle({
      x,
      y: y + 4,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      max: 0.5 + Math.random() * 0.5,
      color: Math.random() < 0.6 ? "#ffffff" : color,
      size: 1.5 + Math.random() * 2.5,
      gravity: 500,
    });
  }
}

// A burst of fireworks at the flag.
function fireworks(x, y, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * 2 * Math.PI;
    const sp = 120 + Math.random() * 320;
    addParticle({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp - 120,
      life: 0,
      max: 0.9 + Math.random() * 0.9,
      color: SLED_COLORS[Math.floor(Math.random() * SLED_COLORS.length)],
      size: 2 + Math.random() * 2.5,
      gravity: 260,
    });
  }
}

// Pieces of a crashed sled.
function debris(x, y, color) {
  for (let i = 0; i < 14; i++) {
    const a = -Math.PI * Math.random();
    const sp = 80 + Math.random() * 220;
    addParticle({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0,
      max: 0.6 + Math.random() * 0.6,
      color: i % 2 === 0 ? color : "#b5652b",
      size: 2 + Math.random() * 3,
      gravity: 700,
    });
  }
}

function updateParticles(dt) {
  if (particles.length === 0) return;
  for (const p of particles) {
    p.life += dt;
    p.vy += p.gravity * dt;
    p.vx *= 0.99;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
  }
  particles = particles.filter((p) => p.life < p.max);
}

function drawParticles() {
  if (particles.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const p of particles) {
    ctx.globalAlpha = 1 - p.life / p.max;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.restore();
}

// The camera: a centre and zoom in world units that ease toward the riding
// sleds, plus a brief shake on hard landings.
const camera = { x: 0, y: 0, zoom: 1, shake: 0 };

function shake(amount) {
  camera.shake = Math.max(camera.shake, amount);
}

function updateCamera(dt) {
  let tx = 0;
  let ty = 0;
  let tz = 1;
  const riding = studio !== "draw" ? sleds.filter((s) => s.s.status === "riding") : [];
  if (riding.length > 0) {
    // Follow the leading sled (the one furthest along), so the camera stays on
    // the action rather than the middle of a long stream.
    let lead = riding[0];
    for (const sled of riding) if (sled.s.t - sled.spawn.t > lead.s.t - lead.spawn.t) lead = sled;
    tx = lead.s.x;
    ty = lead.s.y;
    tz = riding.length === 1 ? 1.6 : 1.35;
  }
  // Keep the whole view inside the 1000 × 1000 world.
  const half = 500 / tz;
  tx = clamp(tx, -500 + half, 500 - half);
  ty = clamp(ty, -500 + half, 500 - half);
  const k = 1 - Math.exp(-dt * 2.5);
  camera.x += (tx - camera.x) * k;
  camera.y += (ty - camera.y) * k;
  camera.zoom += (tz - camera.zoom) * k;
  camera.shake *= Math.exp(-dt * 8);
  if (camera.shake < 0.05) camera.shake = 0;
}

function applyCamera(w, h) {
  if (!game) {
    ctx.setTransform(w / 1000, 0, 0, h / 1000, w / 2, h / 2);
    return;
  }
  const sx = (w / 1000) * camera.zoom;
  const sy = (h / 1000) * camera.zoom;
  const jx = camera.shake * (Math.random() - 0.5) * 2;
  const jy = camera.shake * (Math.random() - 0.5) * 2;
  ctx.setTransform(sx, 0, 0, sy, w / 2 - (camera.x + jx) * sx, h / 2 - (camera.y + jy) * sy);
}

// ── Drawing the sleds, the goal, and the rides' status ───────────────────────

function renderSledScene() {
  for (const m of markers) {
    if (m.kind === "goal" && clock >= m.start) drawGoal(m.x, m.y);
  }
  for (const sled of sleds) {
    if (sled.s.status === "waiting") continue;
    drawTrail(sled);
  }
  for (const sled of sleds) {
    if (sled.s.status === "waiting" || sled.s.status === "crashed") continue;
    drawSled(sled);
  }
}

function drawGoal(x, y) {
  const pulse = 1 + 0.08 * Math.sin(performance.now() / 200);
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#f0b030";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, GOAL_RADIUS * pulse, 0, 2 * Math.PI);
  ctx.stroke();
  // A small flag.
  ctx.strokeStyle = "#e8d8b0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 14);
  ctx.lineTo(0, -16);
  ctx.stroke();
  ctx.fillStyle = "#f0b030";
  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(16, -10);
  ctx.lineTo(0, -4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// A glowing trail in the colours of the lines the sled rode: a wide, faint
// stroke for the glow under a thin, bright one.
function drawTrail(sled) {
  const t = sled.trail;
  if (t.length < 6) return;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 3; i < t.length; i += 3) {
    const fade = i / t.length;
    ctx.strokeStyle = t[i + 2];
    ctx.globalAlpha = 0.18 * fade;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(t[i - 3], t[i - 2]);
    ctx.lineTo(t[i], t[i + 1]);
    ctx.stroke();
    ctx.globalAlpha = 0.7 * fade;
    ctx.lineWidth = 2.5;
    ctx.stroke();
  }
  ctx.restore();
}

// A sled with a rider: runners, a seat, a body, and a head.
function drawSled(sled) {
  const s = sled.s;
  ctx.save();
  ctx.translate(s.x, s.y);
  ctx.rotate(s.angle);
  ctx.strokeStyle = "#d4c5a0";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-14, 6);
  ctx.lineTo(12, 6);
  ctx.quadraticCurveTo(18, 6, 17, 0);
  ctx.stroke();
  ctx.fillStyle = "#b5652b";
  ctx.fillRect(-12, 0, 24, 4);
  ctx.fillStyle = sled.color;
  ctx.fillRect(-6, -12, 8, 12);
  ctx.fillStyle = "#f5e6c0";
  ctx.beginPath();
  ctx.arc(-2, -17, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = "#f5e6c0";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-2, -12);
  ctx.lineTo(-12, -14);
  ctx.stroke();
  ctx.restore();
}

// How the rides are going, at the top of the canvas.
function drawStatus(w, h) {
  if (sleds.length === 0) return;
  const total = sleds.length;
  let home = 0;
  let active = 0;
  let best = Infinity;
  for (const sled of sleds) {
    const s = sled.s;
    if (isActive(sled)) active += 1;
    if (s.status === "goal") {
      home += 1;
      best = Math.min(best, s.finishT - sled.spawn.t);
    }
  }
  if (active === total && sleds.every((sl) => sl.s.status === "waiting")) return;
  let text;
  if (total === 1) {
    const s = sleds[0].s;
    if (s.status === "riding") text = `🛷 ${seconds(s.t - sleds[0].spawn.t)}`;
    else if (s.status === "goal") text = `🏁 Goal! ${seconds(best)}`;
    else if (s.status === "crashed") text = "💥 Crashed";
    else text = "⏸ Stopped";
  } else if (active > 0) {
    text = `🛷 ${home} / ${total} at the flag`;
  } else if (home > 0) {
    text = `🏁 ${home} / ${total} reached the flag · best ${seconds(best)}`;
  } else {
    text = `💥 None of the ${total} sleds reached the flag`;
  }
  ctx.save();
  ctx.font = `600 ${Math.round(h * 0.032)}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillStyle = home === 0 && active === 0 ? "#ffb3b3" : "#e8d8b0";
  ctx.fillText(text, w / 2, h * 0.05);
  ctx.restore();
}

function seconds(tenths) {
  return `${(tenths / TENTHS_PER_SECOND).toFixed(1)} s`;
}

// ── Extension: the Sled Studio ───────────────────────────────────────────────
//
// In the Studio's drawing phase, the canvas shows only the user's own lines and
// the flag. Dragging on the canvas draws a straight line in the current pen
// colour; dragging the flag moves it. The app reads the lines and the flag
// back (studioLines, studioGoal) to write them as Gleam code. The lines and the
// flag are kept in localStorage, so they survive a reload.

const STUDIO_KEY = "animator.studio";
// Clear of the control panel, which covers the bottom-right corner.
const DEFAULT_GOAL = { x: 200, y: 110 };
const MIN_LINE = 12; // shorter drags are ignored

let studio = "off"; // "off" | "draw" | "ride"
let pen = "#f5e6c0";
let studioLinesList = []; // [{ x1, y1, x2, y2, color }]
let studioGoalPoint = { ...DEFAULT_GOAL };
let drag = null; // null | { kind: "line", x1, y1, x2, y2 } | { kind: "flag" }
const studioVibrations = new Map();

(function loadStudio() {
  try {
    const saved = JSON.parse(globalThis.localStorage.getItem(STUDIO_KEY) || "null");
    if (saved && Array.isArray(saved.lines)) studioLinesList = saved.lines;
    if (saved && saved.goal) studioGoalPoint = saved.goal;
  } catch {
    // No saved Studio, or no localStorage: start empty.
  }
})();

function saveStudio() {
  try {
    globalThis.localStorage.setItem(
      STUDIO_KEY,
      JSON.stringify({ lines: studioLinesList, goal: studioGoalPoint }),
    );
  } catch (error) {
    console.error(`Couldn't save the Studio: ${error.message}`);
  }
}

/// "off" for an ordinary drawing, "draw" while the user draws in the Studio,
/// "ride" once the Studio's code is riding.
export function setStudio(phase) {
  studio = phase;
  drag = null;
  if (canvas) canvas.style.cursor = phase === "draw" ? "crosshair" : "";
}

export function setPen(color) {
  pen = color;
}

// The drawn lines as a Gleam List(#(Int, Int, Int, Int, String)).
export function studioLines() {
  return toList(studioLinesList.map((l) => [l.x1, l.y1, l.x2, l.y2, l.color]));
}

// The flag as a Gleam #(Int, Int).
export function studioGoal() {
  return [studioGoalPoint.x, studioGoalPoint.y];
}

export function studioUndo() {
  studioLinesList.pop();
  saveStudio();
}

export function studioClear() {
  studioLinesList = [];
  saveStudio();
}

// The world point under a pointer event, rounded to whole units, as draw code
// uses Ints.
function worldPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 1000 - 500;
  const y = ((event.clientY - rect.top) / rect.height) * 1000 - 500;
  return { x: Math.round(clamp(x, -500, 500)), y: Math.round(clamp(y, -500, 500)) };
}

function nearFlag(p) {
  return Math.hypot(p.x - studioGoalPoint.x, p.y - studioGoalPoint.y) < GOAL_RADIUS + 8;
}

function listenForPointer(el) {
  el.addEventListener("pointerdown", (event) => {
    if (studio !== "draw") return;
    const p = worldPoint(event);
    el.setPointerCapture(event.pointerId);
    drag = nearFlag(p) ? { kind: "flag" } : { kind: "line", x1: p.x, y1: p.y, x2: p.x, y2: p.y };
    event.preventDefault();
  });
  el.addEventListener("pointermove", (event) => {
    if (studio !== "draw") return;
    const p = worldPoint(event);
    if (drag === null) {
      el.style.cursor = nearFlag(p) ? "grab" : "crosshair";
    } else if (drag.kind === "flag") {
      studioGoalPoint = p;
      el.style.cursor = "grabbing";
    } else {
      drag.x2 = p.x;
      drag.y2 = p.y;
    }
  });
  const end = () => {
    if (studio !== "draw" || drag === null) return;
    if (drag.kind === "flag") {
      saveStudio();
    } else if (Math.hypot(drag.x2 - drag.x1, drag.y2 - drag.y1) >= MIN_LINE) {
      const line = { x1: drag.x1, y1: drag.y1, x2: drag.x2, y2: drag.y2, color: pen };
      studioLinesList.push(line);
      saveStudio();
      // Hear and see the new string.
      const p = studioPath(line);
      notesLeft = Math.max(notesLeft, 1);
      pluck(p, 0.6);
      vibrate(studioVibrations, studioLinesList.length - 1, p, 10);
    }
    drag = null;
  };
  el.addEventListener("pointerup", end);
  el.addEventListener("pointercancel", end);
}

// A Studio line in the shape the drawing code uses.
function studioPath(l) {
  return {
    pts: new Float64Array([l.x1, l.y1, l.x2, l.y2]),
    thickness: 4,
    color: l.color,
    start: 0,
    end: 0,
  };
}

function renderStudio(w, h) {
  studioLinesList.forEach((l, i) => {
    const p = studioPath(l);
    const v = studioVibrations.get(i);
    if (v) drawVibrating(p, 1, v);
    else drawUpToU(p, 1);
  });
  if (drag && drag.kind === "line") {
    ctx.save();
    ctx.setLineDash([10, 8]);
    ctx.globalAlpha = 0.8;
    drawUpToU(studioPath({ ...drag, color: pen }), 1);
    ctx.restore();
  }
  drawGoal(studioGoalPoint.x, studioGoalPoint.y);
  drawParticles();

  // The guide: large while the canvas is empty, a reminder once it isn't.
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.textAlign = "center";
  ctx.fillStyle = "#e8d8b0";
  if (studioLinesList.length === 0) {
    const lines = [
      "✏️  Drag on the canvas to draw lines for the sleds to ride.",
      "Draw as many as you like, in any instrument.",
      "🏁  Drag the flag to where the sleds should go.",
      "Press ✓ Done when you're finished.",
    ];
    ctx.textBaseline = "middle";
    lines.forEach((text, i) => {
      ctx.font = `${i === 0 ? 600 : 400} ${Math.round(h * 0.027)}px system-ui, sans-serif`;
      ctx.globalAlpha = i === 0 ? 1 : 0.8;
      ctx.fillText(text, w / 2, h * (0.24 + i * 0.05));
    });
  } else {
    ctx.textBaseline = "top";
    ctx.font = `${Math.round(h * 0.022)}px system-ui, sans-serif`;
    ctx.globalAlpha = 0.75;
    ctx.fillText(
      `${studioLinesList.length} line${studioLinesList.length === 1 ? "" : "s"} · keep drawing, move the 🏁 flag, then press ✓ Done`,
      w / 2,
      h * 0.04,
    );
  }
  ctx.restore();
}

// ── For checking a track from the browser console ────────────────────────────

// `(await import("./build/dev/javascript/animator/canvas.mjs")).sledStatus()`
export function sledStatus() {
  if (sleds.length === 0) return null;
  const s = sleds[0].s;
  return {
    status: s.status,
    t: s.t,
    x: s.x,
    y: s.y,
    finishT: s.finishT,
    clock,
    total: sleds.length,
    home: sleds.filter((o) => o.s.status === "goal").length,
    active: sleds.filter(isActive).length,
  };
}
