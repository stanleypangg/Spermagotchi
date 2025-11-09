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
  { x: 0, y: 0 },
  { x: 5, y: -6 },
  { x: 10, y: -18 },
  { x: 15, y: -32 },
  { x: 20, y: -12 },
  { x: 25, y: 10 },
  { x: 30, y: 26 },
  { x: 35, y: 38 },
  { x: 40, y: 18 },
  { x: 45, y: -8 },
  { x: 50, y: -28 },
  { x: 55, y: -38 },
  { x: 60, y: -16 },
  { x: 65, y: 12 },
  { x: 70, y: 30 },
  { x: 75, y: 40 },
  { x: 80, y: 18 },
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
    controlPoints: transformPoints(LINEAR_LOOP, {
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
]);

export const MOCK_TRACK = TRACK_PRESETS[0];

export const MOCK_SEED = 133742;


