import { EPS, clamp } from './math.js';

const DEFAULT_RESOLUTION = 16;

const catmullRom = (p0, p1, p2, p3, t) => {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x:
      0.5 *
      ((2 * p1.x) +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
    y:
      0.5 *
      ((2 * p1.y) +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3),
  };
};

const catmullRomDerivative = (p0, p1, p2, p3, t) => {
  const t2 = t * t;
  return {
    x:
      0.5 *
      ((-p0.x + p2.x) +
        2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t +
        3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t2),
    y:
      0.5 *
      ((-p0.y + p2.y) +
        2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t +
        3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t2),
  };
};

const catmullRomSecondDerivative = (p0, p1, p2, p3, t) => {
  return {
    x:
      0.5 *
      (2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) +
        6 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t),
    y:
      0.5 *
      (2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) +
        6 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t),
  };
};

const magnitude = (v) => Math.sqrt(v.x * v.x + v.y * v.y);

const normalize = (v) => {
  const mag = magnitude(v);
  if (mag < EPS) {
    return { x: 0, y: 0 };
  }
  return { x: v.x / mag, y: v.y / mag };
};

const curvatureFromDerivatives = (d1, d2) => {
  const speed = magnitude(d1);
  if (speed < EPS) return 0;
  const cross = d1.x * d2.y - d1.y * d2.x;
  return Math.abs(cross) / Math.pow(speed, 3);
};

function generateSamples(points, resolution = DEFAULT_RESOLUTION) {
  const samples = [];
  let prevPoint = null;
  let totalLength = 0;

  const count = points.length;
  for (let i = 0; i < count - 1; i += 1) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(i + 2, count - 1)];

    for (let step = 0; step <= resolution; step += 1) {
      const t = step / resolution;
      if (i > 0 && step === 0) {
        continue;
      }
      const pos = catmullRom(p0, p1, p2, p3, t);
      const d1 = catmullRomDerivative(p0, p1, p2, p3, t);
      const d2 = catmullRomSecondDerivative(p0, p1, p2, p3, t);
      const tangent = normalize(d1);
      const normal = { x: -tangent.y, y: tangent.x };
      const curvature = curvatureFromDerivatives(d1, d2);

      if (prevPoint) {
        const dx = pos.x - prevPoint.x;
        const dy = pos.y - prevPoint.y;
        totalLength += Math.sqrt(dx * dx + dy * dy);
      }

      samples.push({
        x: pos.x,
        y: pos.y,
        tangent,
        normal,
        curvature,
        s: totalLength,
      });
      prevPoint = pos;
    }
  }

  return { samples, totalLength };
}

export function createTrackGeometry(track, options = {}) {
  const { resolution = DEFAULT_RESOLUTION } = options;
  const { samples, totalLength } = generateSamples(track.controlPoints, resolution);

  return {
    samples,
    totalLength,
    zones: track.zones ?? [],
    width: track.width ?? 80,
    name: track.name,
    id: track.id,
  };
}

export function sampleTrackAt(geometry, distance) {
  if (!geometry.samples || geometry.samples.length === 0) {
    throw new Error('geometry.samples is empty');
  }

  const clampedDistance = clamp(distance, 0, geometry.totalLength);

  const samples = geometry.samples;
  let low = 0;
  let high = samples.length - 1;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (samples[mid].s < clampedDistance) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  const idx = Math.max(1, low);
  const prev = samples[idx - 1];
  const next = samples[idx];
  const segLen = Math.max(next.s - prev.s, EPS);
  const factor = (clampedDistance - prev.s) / segLen;

  const x = prev.x + (next.x - prev.x) * factor;
  const y = prev.y + (next.y - prev.y) * factor;
  const tangent = normalize({
    x: prev.tangent.x + (next.tangent.x - prev.tangent.x) * factor,
    y: prev.tangent.y + (next.tangent.y - prev.tangent.y) * factor,
  });
  const normal = { x: -tangent.y, y: tangent.x };
  const curvature = prev.curvature + (next.curvature - prev.curvature) * factor;

  return { x, y, tangent, normal, curvature };
}

export function zoneForProgress(trackOrGeometry, progress) {
  const zones = trackOrGeometry.zones ?? [];
  const value = clamp(progress, 0, 0.999999);
  for (let i = 0; i < zones.length; i += 1) {
    const zone = zones[i];
    if (value >= zone.start && value < zone.end) {
      return zone.kind;
    }
  }
  return zones[zones.length - 1]?.kind ?? 'flow';
}

export function svgPathFromGeometry(geometry) {
  const { samples } = geometry;
  if (!samples.length) {
    return '';
  }
  return samples
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(' ');
}

export function offsetPath(geometry, offset) {
  const { samples } = geometry;
  if (!samples.length) {
    return '';
  }
  return samples
    .map((point, index) => {
      const x = point.x + point.normal.x * offset;
      const y = point.y + point.normal.y * offset;
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

export function offsetPolylinePoints(geometry, offset) {
  const { samples } = geometry;
  if (!samples.length) return [];
  return samples.map((point) => ({
    x: point.x + point.normal.x * offset,
    y: point.y + point.normal.y * offset,
  }));
}

export function trackBounds(geometry) {
  const { samples } = geometry;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  samples.forEach((p) => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

export function windowBounds(geometry, distance, span) {
  const start = clamp(distance - span / 2, 0, geometry.totalLength);
  const end = clamp(distance + span / 2, 0, geometry.totalLength);
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const { samples } = geometry;
  for (let i = 0; i < samples.length; i += 1) {
    const s = samples[i].s;
    if (s >= start && s <= end) {
      minX = Math.min(minX, samples[i].x);
      minY = Math.min(minY, samples[i].y);
      maxX = Math.max(maxX, samples[i].x);
      maxY = Math.max(maxY, samples[i].y);
    }
  }

  if (minX === Infinity) {
    const sample = sampleTrackAt(geometry, distance);
    minX = sample.x;
    maxX = sample.x;
    minY = sample.y;
    maxY = sample.y;
  }

  const padding = geometry.width ?? 80;
  return {
    minX: minX - padding,
    maxX: maxX + padding,
    minY: minY - padding,
    maxY: maxY + padding,
  };
}

export function projectPointToTrack(geometry, point) {
  const { samples } = geometry;
  if (!samples.length) {
    return {
      sample: { x: point.x, y: point.y, tangent: { x: 1, y: 0 }, curvature: 0, s: 0 },
      distance: 0,
      index: 0,
    };
  }
  let bestIdx = 0;
  let bestDist = Infinity;
  for (let i = 0; i < samples.length; i += 1) {
    const dx = point.x - samples[i].x;
    const dy = point.y - samples[i].y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDist) {
      bestDist = d2;
      bestIdx = i;
    }
  }
  const sample = samples[bestIdx];
  return { sample, distance: sample.s, index: bestIdx };
}



