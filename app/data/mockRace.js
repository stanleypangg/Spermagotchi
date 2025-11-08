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

/**
 * A single track defined by smooth control points. Geometry helpers will
 * convert these Catmull-Rom points into a dense polyline for positioning.
 *
 * The zones map onto the normalized distance along the course (0-1).
 */
export const MOCK_TRACK = Object.freeze({
  id: 'lab-loop',
  name: 'Lab Loop',
  controlPoints: [
    { x: 0, y: 0 },
    { x: 98, y: -28 },
    { x: 147, y: -77 },
    { x: 126, y: -147 },
    { x: 56, y: -182 },
    { x: -28, y: -154 },
    { x: -77, y: -98 },
    { x: -112, y: -28 },
    { x: -98, y: 42 },
    { x: -42, y: 98 },
    { x: 42, y: 133 },
    { x: 126, y: 112 },
    { x: 168, y: 49 },
    { x: 154, y: -7 },
    { x: 98, y: -28 },
  ],
  zones: [
    { kind: 'flow', start: 0.0, end: 0.33 },
    { kind: 'gradient', start: 0.33, end: 0.67 },
    { kind: 'viscous', start: 0.67, end: 1.0 },
  ],
  width: 65,
});

export const MOCK_SEED = 133742;


