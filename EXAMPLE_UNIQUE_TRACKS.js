/**
 * Example: Creating Unique Track Geometries
 * 
 * Drop these into your mockRace.js to replace the current tracks
 * Each track has a completely different shape!
 */

// 1. ORIGINAL: Flowing S-curves (keep this one, it's good)
const FLOWING_PATH = [
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

// 2. SERPENTINE: Tight alternating curves (technical track)
const SERPENTINE_PATH = [
  { x: 0, y: 0 },
  { x: 8, y: -12 },
  { x: 16, y: -20 },
  { x: 24, y: -15 },
  { x: 32, y: 0 },
  { x: 40, y: 15 },
  { x: 48, y: 20 },
  { x: 56, y: 12 },
  { x: 64, y: -5 },
  { x: 72, y: -18 },
  { x: 80, y: -10 },
];

// 3. SPEEDWAY: Wide sweeping oval (high-speed)
const SPEEDWAY_PATH = [
  { x: 0, y: 0 },
  { x: 20, y: -3 },
  { x: 40, y: -5 },
  { x: 60, y: -5 },
  { x: 80, y: -3 },
  { x: 95, y: 5 },
  { x: 100, y: 15 },
  { x: 95, y: 25 },
  { x: 80, y: 33 },
  { x: 60, y: 35 },
  { x: 40, y: 35 },
  { x: 20, y: 33 },
  { x: 5, y: 25 },
  { x: 0, y: 15 },
];

// 4. HAIRPIN: Tight U-turns (drift heaven)
const HAIRPIN_PATH = [
  { x: 0, y: 0 },
  { x: 15, y: -5 },
  { x: 30, y: -15 },
  { x: 35, y: -30 },
  { x: 30, y: -45 },
  { x: 15, y: -50 },
  { x: 0, y: -48 },
  { x: -10, y: -40 },
  { x: -10, y: -25 },
  { x: -5, y: -10 },
  { x: 10, y: 5 },
];

// 5. MOUNTAIN: Elevation changes (technical climb/descent)
const MOUNTAIN_PATH = [
  { x: 0, y: 0 },
  { x: 10, y: -15 },   // Climbing
  { x: 20, y: -35 },   // Peak
  { x: 30, y: -50 },   // Summit
  { x: 40, y: -45 },   // Start descent
  { x: 50, y: -25 },   // Dropping
  { x: 60, y: -5 },    // Valley
  { x: 70, y: 10 },    // Mini climb
  { x: 80, y: 15 },    // Finish
];

// 6. SPIRAL: Gradually tightening turns
const SPIRAL_PATH = [];
for (let i = 0; i <= 12; i++) {
  const angle = (i / 12) * Math.PI * 3; // 1.5 rotations
  const radius = 40 - (i * 2.5); // Tightening radius
  SPIRAL_PATH.push({
    x: i * 7,
    y: Math.sin(angle) * radius,
  });
}

// Update your TRACK_PRESETS to use these unique geometries:
export const TRACK_PRESETS_NEW = Object.freeze([
  {
    id: 'driftway',
    name: 'Driftway',
    controlPoints: transformPoints(FLOWING_PATH, {
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
    id: 'serpentine',
    name: 'Serpentine',
    controlPoints: transformPoints(SERPENTINE_PATH, {
      scaleX: 220,
      scaleY: 55,
      rotate: 3,
      translateX: -40,
      translateY: 5,
    }),
    zones: [
      { kind: 'gradient', start: 0, end: 0.4 },
      { kind: 'viscous', start: 0.4, end: 0.7 },
      { kind: 'flow', start: 0.7, end: 1.0 },
    ],
    width: 72,
    closed: false,
  },
  {
    id: 'speedway',
    name: 'Speedway',
    controlPoints: transformPoints(SPEEDWAY_PATH, {
      scaleX: 180,
      scaleY: 42,
      rotate: 0,
      translateX: -50,
      translateY: 0,
    }),
    zones: [
      { kind: 'flow', start: 0, end: 0.5 },
      { kind: 'gradient', start: 0.5, end: 1.0 },
    ],
    width: 95,
    closed: true, // Oval track!
  },
  {
    id: 'hairpin',
    name: 'Hairpin Heaven',
    controlPoints: transformPoints(HAIRPIN_PATH, {
      scaleX: 200,
      scaleY: 40,
      rotate: 15,
      translateX: -30,
      translateY: -10,
    }),
    zones: [
      { kind: 'viscous', start: 0, end: 0.3 },
      { kind: 'gradient', start: 0.3, end: 0.7 },
      { kind: 'flow', start: 0.7, end: 1.0 },
    ],
    width: 70,
    closed: false,
  },
  {
    id: 'mountain',
    name: 'Mountain Pass',
    controlPoints: transformPoints(MOUNTAIN_PATH, {
      scaleX: 210,
      scaleY: 35,
      rotate: -5,
      translateX: -45,
      translateY: 8,
    }),
    zones: [
      { kind: 'gradient', start: 0, end: 0.35 },
      { kind: 'viscous', start: 0.35, end: 0.65 },
      { kind: 'flow', start: 0.65, end: 1.0 },
    ],
    width: 75,
    closed: false,
  },
  {
    id: 'spiral',
    name: 'Spiral Vortex',
    controlPoints: transformPoints(SPIRAL_PATH, {
      scaleX: 190,
      scaleY: 48,
      rotate: -8,
      translateX: -35,
      translateY: 0,
    }),
    zones: [
      { kind: 'flow', start: 0, end: 0.4 },
      { kind: 'viscous', start: 0.4, end: 0.75 },
      { kind: 'gradient', start: 0.75, end: 1.0 },
    ],
    width: 82,
    closed: false,
  },
]);

/**
 * HOW TO USE:
 * 
 * 1. Copy the path arrays (FLOWING_PATH, SERPENTINE_PATH, etc.) to your mockRace.js
 * 2. Replace your current TRACK_PRESETS with TRACK_PRESETS_NEW
 * 3. Each track now has a unique geometry!
 * 
 * RESULT:
 * - Driftway: Smooth flowing S-curves
 * - Serpentine: Tight technical chicanes
 * - Speedway: Wide oval (good for speed)
 * - Hairpin Heaven: Sharp U-turns (drift focus)
 * - Mountain Pass: Elevation simulation
 * - Spiral Vortex: Gradually tightening turns
 */

