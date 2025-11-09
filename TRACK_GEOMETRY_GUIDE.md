# Track Geometry Generation Guide

## Current System (Transform-Based)
All tracks use the same `LINEAR_LOOP` base shape with different transforms (scale, rotate, translate). This makes tracks look similar.

## Creating Unique Track Geometries

### Method 1: Define Unique Control Points for Each Track

Instead of one shared `LINEAR_LOOP`, create unique point arrays:

```javascript
// Tight S-curves track
const SERPENTINE_PATH = [
  { x: 0, y: 0 },
  { x: 10, y: -15 },
  { x: 20, y: -25 },
  { x: 30, y: -20 },
  { x: 40, y: 0 },
  { x: 50, y: 20 },
  { x: 60, y: 25 },
  { x: 70, y: 15 },
  { x: 80, y: 0 },
];

// Hairpin turns track
const HAIRPIN_PATH = [
  { x: 0, y: 0 },
  { x: 20, y: 0 },
  { x: 40, y: -20 },
  { x: 40, y: -40 },
  { x: 20, y: -60 },
  { x: 0, y: -60 },
  { x: -20, y: -40 },
  { x: -20, y: -20 },
  { x: 0, y: 0 },
];

// Wide arcs track
const SWEEPER_PATH = [
  { x: 0, y: 0 },
  { x: 30, y: -10 },
  { x: 60, y: -5 },
  { x: 90, y: 10 },
  { x: 100, y: 30 },
];
```

### Method 2: Procedural Generation

Generate tracks mathematically based on parameters:

```javascript
// Generate a spiral track
function generateSpiralTrack(rotations = 2, radiusGrowth = 20) {
  const points = [];
  const steps = 20 * rotations;
  
  for (let i = 0; i <= steps; i++) {
    const angle = (i / steps) * rotations * Math.PI * 2;
    const radius = radiusGrowth * (i / steps);
    points.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    });
  }
  
  return points;
}

// Generate a figure-8 track
function generateFigure8Track(width = 50, height = 80) {
  const points = [];
  const steps = 40;
  
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    points.push({
      x: width * Math.sin(t),
      y: height * Math.sin(t) * Math.cos(t),
    });
  }
  
  return points;
}

// Generate a zigzag track
function generateZigzagTrack(segments = 8, width = 30, length = 20) {
  const points = [];
  
  for (let i = 0; i <= segments; i++) {
    const isEven = i % 2 === 0;
    points.push({
      x: i * length,
      y: isEven ? 0 : width,
    });
  }
  
  return points;
}
```

### Method 3: Combined Approach (Recommended)

Mix hand-crafted and procedural for best results:

```javascript
export const TRACK_GEOMETRIES = {
  // Hand-crafted technical track
  TECHNICAL: [
    { x: 0, y: 0 },
    { x: 15, y: -20 },
    { x: 30, y: -25 },
    { x: 45, y: -15 },
    { x: 55, y: 10 },
    { x: 65, y: 30 },
    { x: 80, y: 35 },
  ],
  
  // Procedural spiral
  SPIRAL: generateSpiralTrack(2.5, 25),
  
  // Procedural figure-8
  FIGURE_8: generateFigure8Track(40, 70),
  
  // Hand-crafted oval
  OVAL: [
    { x: 0, y: 0 },
    { x: 40, y: -10 },
    { x: 80, y: -15 },
    { x: 120, y: -10 },
    { x: 140, y: 10 },
    { x: 120, y: 30 },
    { x: 80, y: 35 },
    { x: 40, y: 30 },
    { x: 20, y: 10 },
  ],
};
```

## Implementation Example

```javascript
export const TRACK_PRESETS = Object.freeze([
  {
    id: 'serpentine',
    name: 'Serpentine',
    controlPoints: TRACK_GEOMETRIES.TECHNICAL,
    zones: [
      { kind: 'flow', start: 0, end: 0.3 },
      { kind: 'gradient', start: 0.3, end: 0.7 },
      { kind: 'viscous', start: 0.7, end: 1.0 },
    ],
    width: 75,
    closed: false,
  },
  {
    id: 'spiral',
    name: 'Spiral Vortex',
    controlPoints: TRACK_GEOMETRIES.SPIRAL,
    zones: [
      { kind: 'viscous', start: 0, end: 0.4 },
      { kind: 'gradient', start: 0.4, end: 1.0 },
    ],
    width: 80,
    closed: false,
  },
  // ... more tracks with different geometries
]);
```

## Tips for Designing Good Tracks

1. **Variety in Curves**: Mix tight turns with sweeping curves
2. **Length**: 8-20 control points works well
3. **Challenge Progression**: Start easy, get harder, then ease up near finish
4. **Visual Interest**: Create memorable shapes (S-curves, hairpins, chicanes)
5. **Test Racing**: Make sure all geometries are raceable (not too tight/narrow)

## Zone Placement Strategy

Different geometries work better with different zone placements:

- **Flow zones**: Place on straight sections or gentle curves
- **Gradient zones**: Good for tight technical sections
- **Viscous zones**: Works well on wide sweeping turns

## Quick Start: Create 3 Unique Tracks Fast

```javascript
// 1. Technical chicane track
const CHICANE = [
  { x: 0, y: 0 }, { x: 20, y: -15 }, { x: 40, y: 15 },
  { x: 60, y: -10 }, { x: 80, y: 20 }, { x: 100, y: 0 }
];

// 2. High-speed oval
const SPEEDWAY = [
  { x: 0, y: 0 }, { x: 50, y: -5 }, { x: 100, y: 0 },
  { x: 120, y: 20 }, { x: 100, y: 40 }, { x: 50, y: 45 },
  { x: 0, y: 40 }, { x: -20, y: 20 }
];

// 3. Mountain pass (elevation simulation via y)
const MOUNTAIN = [
  { x: 0, y: 0 }, { x: 15, y: -30 }, { x: 30, y: -50 },
  { x: 50, y: -40 }, { x: 70, y: -10 }, { x: 90, y: 20 },
  { x: 110, y: 30 }, { x: 130, y: 20 }
];
```

Each creates a completely different racing experience!

