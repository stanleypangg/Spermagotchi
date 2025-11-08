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

export const MOCK_RACERS = Object.freeze([
  {
    id: 'player',
    name: 'You',
    tint: '#7dd3fc',
    stats: { MI: 58, LQ: 54, RE: 46, CS: 44 },
  },
  {
    id: 'dash',
    name: 'Dash',
    tint: '#f9a8d4',
    stats: { MI: 64, LQ: 48, RE: 42, CS: 36 },
  },
  {
    id: 'glide',
    name: 'Glide',
    tint: '#bef264',
    stats: { MI: 52, LQ: 60, RE: 40, CS: 52 },
  },
  {
    id: 'vector',
    name: 'Vector',
    tint: '#c4b5fd',
    stats: { MI: 48, LQ: 50, RE: 58, CS: 46 },
  },
]);

const LINEAR_LOOP = [
  { x: 0.0, y: 0.0 },
  { x: 0.8, y: -0.08 },
  { x: 1.9, y: -0.16 },
  { x: 3.3, y: -0.22 },
  { x: 4.9, y: -0.2 },
  { x: 6.4, y: -0.06 },
  { x: 7.9, y: 0.14 },
  { x: 9.4, y: 0.34 },
  { x: 10.9, y: 0.5 },
  { x: 12.4, y: 0.58 },
  { x: 13.9, y: 0.54 },
  { x: 15.4, y: 0.34 },
  { x: 16.8, y: 0.06 },
  { x: 18.0, y: -0.24 },
  { x: 19.1, y: -0.52 },
  { x: 20.2, y: -0.76 },
  { x: 21.3, y: -0.94 },
  { x: 22.6, y: -1.06 },
  { x: 24.1, y: -1.1 },
  { x: 25.6, y: -1.02 },
  { x: 27.1, y: -0.82 },
  { x: 28.6, y: -0.56 },
  { x: 30.0, y: -0.3 },
  { x: 31.4, y: -0.06 },
  { x: 32.9, y: 0.1 },
  { x: 34.4, y: 0.16 },
  { x: 35.9, y: 0.08 },
  { x: 37.4, y: -0.12 },
  { x: 38.6, y: -0.38 },
  { x: 39.6, y: -0.66 },
  { x: 40.5, y: -0.96 },
  { x: 41.5, y: -1.2 },
  { x: 42.7, y: -1.34 },
  { x: 44.1, y: -1.36 },
  { x: 45.6, y: -1.28 },
  { x: 47.0, y: -1.1 },
  { x: 48.4, y: -0.84 },
  { x: 49.8, y: -0.52 },
  { x: 51.1, y: -0.2 },
  { x: 52.4, y: 0.02 },
  { x: 53.8, y: 0.16 },
  { x: 55.3, y: 0.22 },
  { x: 56.8, y: 0.12 },
  { x: 58.2, y: -0.12 },
  { x: 59.4, y: -0.42 },
  { x: 60.4, y: -0.74 },
  { x: 61.4, y: -1.04 },
  { x: 62.6, y: -1.26 },
  { x: 64.1, y: -1.36 },
  { x: 65.7, y: -1.32 },
  { x: 67.2, y: -1.14 },
  { x: 68.6, y: -0.86 },
  { x: 69.9, y: -0.54 },
  { x: 71.2, y: -0.22 },
  { x: 72.6, y: 0.02 },
  { x: 74.0, y: 0.18 },
  { x: 75.4, y: 0.22 },
  { x: 76.8, y: 0.12 },
  { x: 78.2, y: -0.08 },
  { x: 79.6, y: -0.34 },
  { x: 81.0, y: -0.62 },
  { x: 82.2, y: -0.88 },
  { x: 83.4, y: -1.08 },
  { x: 84.9, y: -1.18 },
  { x: 86.4, y: -1.12 },
  { x: 87.8, y: -0.92 },
  { x: 89.2, y: -0.66 },
  { x: 90.5, y: -0.38 },
  { x: 91.8, y: -0.1 },
  { x: 93.0, y: 0.14 },
  { x: 94.2, y: 0.28 },
];

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
    controlPoints: transformPoints(LINEAR_LOOP, {
      scaleX: 9,
      scaleY: 5.5,
      rotate: -2,
      translateX: -20,
    }),
    zones: [
      { kind: 'flow', start: 0, end: 0.25 },
      { kind: 'gradient', start: 0.25, end: 0.6 },
      { kind: 'viscous', start: 0.6, end: 1.0 },
    ],
    width: 65,
    closed: false,
  },
  {
    id: 'gulfstream',
    name: 'Gulf Stream',
    controlPoints: transformPoints(LINEAR_LOOP, {
      scaleX: 10,
      scaleY: 6.2,
      rotate: 4,
      translateY: -6,
    }),
    zones: [
      { kind: 'gradient', start: 0, end: 0.2 },
      { kind: 'flow', start: 0.2, end: 0.55 },
      { kind: 'viscous', start: 0.55, end: 1.0 },
    ],
    width: 70,
    closed: false,
  },
]);

export const MOCK_TRACK = TRACK_PRESETS[0];

export const MOCK_SEED = 133742;


