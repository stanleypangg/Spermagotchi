/**
 * Mock data for the race showcase.
 * The actual race math lives in `lib/race`, this file only supplies
 * deterministic sample racers, balance knobs, and a curvy track shape.
 */

export const MOCK_BALANCE = Object.freeze({
  labels: { MI: 'Motility', LQ: 'Linearity', RE: 'Flow', CS: 'Signals' },
  race: {
    lengths: { flow: 120, gradient: 100, viscous: 110 },
    env: { flowSpeed: 35, viscosity: 0.6 },
    proc: { base: 0.02, sigScale: 0.0015, vclBoost: 1.15, linNerf: 0.92, chemoMax: 0.05 },
    rheo: { alignBase: 0.3, alignPerFlow: 0.006, boostMax: 0.25 },
  },
  progression: {
    dailyCap: 4,
    weeklyStatCap: 10,
    decay: { MI: 2, LQ: 2, RE: 0, CS: 0 },
  },
});

const SPRITE_POOL = [
  '/67.png',
  '/amongus.png',
  '/drunk.png',
  '/fat.png',
  '/happier.png',
  '/happy.png',
  '/laptop hot.png',
  '/matcha.png',
  '/neutral.png',
  '/petri.png',
  '/plug.png',
  '/sad.png',
  '/sadder.png',
  '/smoking.png',
  '/speed.png',
];

function shuffledSprites(pool, count) {
  const copy = [...pool];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, count);
}

const ASSIGNED_SPRITES = shuffledSprites(SPRITE_POOL, 4);

export const MOCK_RACERS = Object.freeze([
  {
    id: 'player',
    name: 'You',
    tint: '#7dd3fc',
    stats: { MI: 58, LQ: 54, RE: 46, CS: 44 },
    sprite: ASSIGNED_SPRITES[0] ?? '/67.png',
  },
  {
    id: 'dash',
    name: 'Dash',
    tint: '#f9a8d4',
    stats: { MI: 64, LQ: 48, RE: 42, CS: 36 },
    sprite: ASSIGNED_SPRITES[1] ?? '/speed.png',
  },
  {
    id: 'glide',
    name: 'Glide',
    tint: '#bef264',
    stats: { MI: 52, LQ: 60, RE: 40, CS: 52 },
    sprite: ASSIGNED_SPRITES[2] ?? '/amongus.png',
  },
  {
    id: 'vector',
    name: 'Vector',
    tint: '#c4b5fd',
    stats: { MI: 48, LQ: 50, RE: 58, CS: 46 },
    sprite: ASSIGNED_SPRITES[3] ?? '/matcha.png',
  },
]);

// DRIFTWAY: Aggressive alternating S-curves - DRIFT HEAVEN
const DRIFTWAY_PATH = [
  { x: 0, y: 0 },
  { x: 10, y: -18 },
  { x: 20, y: -38 },
  { x: 30, y: -42 },
  { x: 40, y: -28 },
  { x: 50, y: 0 },
  { x: 60, y: 28 },
  { x: 70, y: 42 },
  { x: 80, y: 38 },
  { x: 90, y: 18 },
  { x: 100, y: 0 },
];

// GULF STREAM: Wide gentle flowing river with long sweeping bends
const GULFSTREAM_PATH = [
  { x: 0, y: 0 },
  { x: 15, y: -2 },
  { x: 30, y: -6 },
  { x: 45, y: -12 },
  { x: 60, y: -14 },
  { x: 75, y: -12 },
  { x: 90, y: -6 },
  { x: 105, y: 2 },
  { x: 120, y: 8 },
  { x: 135, y: 12 },
  { x: 150, y: 10 },
];

// RAPIDS: Extreme zigzag chaos - TECHNICAL NIGHTMARE
const RAPIDS_PATH = [
  { x: 0, y: 0 },
  { x: 5, y: -20 },
  { x: 10, y: 5 },
  { x: 15, y: -18 },
  { x: 20, y: 8 },
  { x: 25, y: -25 },
  { x: 30, y: 12 },
  { x: 35, y: -15 },
  { x: 40, y: 18 },
  { x: 45, y: -10 },
  { x: 50, y: 22 },
  { x: 55, y: -5 },
  { x: 60, y: 15 },
  { x: 65, y: -12 },
  { x: 70, y: 8 },
  { x: 75, y: 0 },
];

// SPIRAL: Tight inward spiral - GETS CLAUSTROPHOBIC
const SPIRAL_PATH = [];
for (let i = 0; i <= 20; i++) {
  const angle = (i / 20) * Math.PI * 3.5; // 1.75 rotations
  const radius = 45 - (i * 2); // Tightening faster
  SPIRAL_PATH.push({
    x: i * 5,
    y: Math.sin(angle) * radius,
  });
}

// CANYON: Sharp hairpin switchbacks like a mountain road
const CANYON_PATH = [
  { x: 0, y: 0 },
  { x: 15, y: -8 },
  { x: 25, y: -20 },
  { x: 28, y: -35 },
  { x: 25, y: -50 },
  { x: 15, y: -62 },
  { x: 0, y: -68 },
  { x: -15, y: -70 },
  { x: -25, y: -60 },
  { x: -28, y: -45 },
  { x: -25, y: -30 },
  { x: -10, y: -15 },
  { x: 5, y: -5 },
];

// VORTEX: Figure-8 with dynamic radius - DISORIENTING
const VORTEX_PATH = [];
for (let i = 0; i <= 24; i++) {
  const t = (i / 24) * Math.PI * 2;
  const radius = 35 + Math.cos(t * 3) * 12; // Oscillating radius
  VORTEX_PATH.push({
    x: i * 4,
    y: Math.sin(t) * radius * Math.cos(t * 0.5),
  });
}

function transformPoints(points, options = {}) {
  const {
    scale = 1,
    scaleX,
    scaleY,
    rotate = 0,
    translateX = 0,
    translateY = 0,
  } = options;
  const sx = scaleX ?? scale;
  const sy = scaleY ?? scale;
  const rad = (rotate * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return points.map((point) => {
    const px = point.x * sx;
    const py = point.y * sy;
    const rx = px * cos - py * sin;
    const ry = px * sin + py * cos;
    return {
      x: rx + translateX,
      y: ry + translateY,
    };
  });
}

export const TRACK_PRESETS = Object.freeze([
  {
    id: 'driftway',
    name: 'Driftway',
    controlPoints: transformPoints(DRIFTWAY_PATH, {
      scaleX: 185,
      scaleY: 38,
      rotate: -2.2,
      translateX: -36,
      translateY: -8,
    }),
    zones: [
      { kind: 'flow', start: 0, end: 0.25 },
      { kind: 'gradient', start: 0.25, end: 0.6 },
      { kind: 'viscous', start: 0.6, end: 1.0 },
    ],
    width: 78,
    closed: false,
  },
  {
    id: 'gulfstream',
    name: 'Gulf Stream',
    controlPoints: transformPoints(GULFSTREAM_PATH, {
      scaleX: 210,
      scaleY: 43,
      rotate: 4.8,
      translateX: -16,
      translateY: 8,
    }),
    zones: [
      { kind: 'gradient', start: 0, end: 0.2 },
      { kind: 'flow', start: 0.2, end: 0.55 },
      { kind: 'viscous', start: 0.55, end: 1.0 },
    ],
    width: 88,
    closed: false,
  },
  {
    id: 'rapids',
    name: 'Rapids',
    controlPoints: transformPoints(RAPIDS_PATH, {
      scaleX: 195,
      scaleY: 52,
      rotate: -6.5,
      translateX: -28,
      translateY: 12,
    }),
    zones: [
      { kind: 'flow', start: 0, end: 0.4 },
      { kind: 'viscous', start: 0.4, end: 0.7 },
      { kind: 'gradient', start: 0.7, end: 1.0 },
    ],
    width: 82,
    closed: false,
  },
  {
    id: 'spiral',
    name: 'Spiral',
    controlPoints: transformPoints(SPIRAL_PATH, {
      scaleX: 178,
      scaleY: 48,
      rotate: 8.2,
      translateX: -42,
      translateY: -15,
    }),
    zones: [
      { kind: 'viscous', start: 0, end: 0.3 },
      { kind: 'gradient', start: 0.3, end: 0.65 },
      { kind: 'flow', start: 0.65, end: 1.0 },
    ],
    width: 85,
    closed: false,
  },
  {
    id: 'canyon',
    name: 'Canyon',
    controlPoints: transformPoints(CANYON_PATH, {
      scaleX: 202,
      scaleY: 35,
      rotate: 1.8,
      translateX: -20,
      translateY: 5,
    }),
    zones: [
      { kind: 'gradient', start: 0, end: 0.35 },
      { kind: 'viscous', start: 0.35, end: 0.6 },
      { kind: 'flow', start: 0.6, end: 1.0 },
    ],
    width: 75,
    closed: false,
  },
  {
    id: 'vortex',
    name: 'Vortex',
    controlPoints: transformPoints(VORTEX_PATH, {
      scaleX: 188,
      scaleY: 56,
      rotate: -11.3,
      translateX: -32,
      translateY: -22,
    }),
    zones: [
      { kind: 'flow', start: 0, end: 0.28 },
      { kind: 'gradient', start: 0.28, end: 0.72 },
      { kind: 'viscous', start: 0.72, end: 1.0 },
    ],
    width: 90,
    closed: false,
  },
]);

export const MOCK_TRACK = TRACK_PRESETS[0];

export const MOCK_SEED = 133742;


