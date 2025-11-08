'use client';

import { useMemo } from 'react';
import {
  svgPathFromGeometry,
  offsetPolylinePoints,
  sampleTrackAt,
  trackBounds,
} from '@/lib/race/geometry';

const ZONE_COLORS = {
  flow: '#bfdbfe',
  gradient: '#fbcfe8',
  viscous: '#fde68a',
};

function polylineToPath(points) {
  if (!points?.length) return '';
  return points
    .map((point, index) =>
      `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)} ${point.y.toFixed(2)}`,
    )
    .join(' ');
}

function computeIndicators(lanes, bounds, leadDistance) {
  const indicators = [];
  const visible = [];
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const halfW = (bounds.maxX - bounds.minX) / 2;
  const halfH = (bounds.maxY - bounds.minY) / 2;
  const eps = 1e-3;

  lanes?.forEach((lane) => {
    const inside =
      lane.x >= bounds.minX - eps &&
      lane.x <= bounds.maxX + eps &&
      lane.y >= bounds.minY - eps &&
      lane.y <= bounds.maxY + eps;
    if (inside) {
      visible.push({ ...lane });
      return;
    }

    const dx = lane.x - cx;
    const dy = lane.y - cy;
    const scale = Math.max(
      Math.abs(dx) / Math.max(halfW, eps),
      Math.abs(dy) / Math.max(halfH, eps),
      1,
    );
    const edgeX = cx + dx / scale;
    const edgeY = cy + dy / scale;

    const gap = leadDistance - lane.distance;
    indicators.push({
      ...lane,
      edgeX,
      edgeY,
      gap,
    });
  });

  return { visible, indicators };
}

export default function RaceStage({
  geometry,
  frame,
  width = 900,
  height = 520,
  cameraSpan = 260,
}) {
  const centerPath = useMemo(
    () => svgPathFromGeometry(geometry),
    [geometry],
  );
  const trackStroke = geometry.width ?? 80;

  const leadDistance =
    frame?.lanes?.reduce(
      (acc, lane) => (lane.distance > acc ? lane.distance : acc),
      0,
    ) ?? 0;

  const leader = frame?.lanes
    ?.slice()
    .sort((a, b) => b.distance - a.distance)[0];

  const leadSample = useMemo(() => {
    if (!geometry) {
      return { x: 0, y: 0 };
    }
    return sampleTrackAt(geometry, leadDistance);
  }, [geometry, leadDistance]);

  const isBursting = leader?.hyperburst ?? false;

  const aspect = height / width;
  const dynamicSpan = cameraSpan * (isBursting ? 0.85 : 1);
  const halfW = dynamicSpan;
  const halfH = dynamicSpan * aspect;

  const bounds = useMemo(() => {
    const cx = leadSample.x;
    const cy = leadSample.y;
    return {
      minX: cx - halfW,
      maxX: cx + halfW,
      minY: cy - halfH,
      maxY: cy + halfH,
    };
  }, [halfW, halfH, leadSample]);

  const overallBounds = useMemo(
    () => (geometry ? trackBounds(geometry) : null),
    [geometry],
  );

  const { visible, indicators } = useMemo(() => {
    if (!frame?.lanes) {
      return { visible: [], indicators: [] };
    }
    return computeIndicators(frame.lanes, bounds, leadDistance);
  }, [frame?.lanes, bounds, leadDistance]);

  const viewBoxWidth = bounds.maxX - bounds.minX || halfW * 2 || 400;
  const viewBoxHeight = bounds.maxY - bounds.minY || halfH * 2 || 300;

  const outerPath = useMemo(() => {
    if (!geometry) return '';
    return polylineToPath(offsetPolylinePoints(geometry, trackStroke / 2));
  }, [geometry, trackStroke]);

  const innerPath = useMemo(() => {
    if (!geometry) return '';
    return polylineToPath(offsetPolylinePoints(geometry, -trackStroke / 2));
  }, [geometry, trackStroke]);

  return (
    <div className="relative w-full">
      <svg
        width="100%"
        style={{ maxWidth: width, height }}
        viewBox={`${bounds.minX} ${bounds.minY} ${viewBoxWidth} ${viewBoxHeight}`}
        className="rounded-3xl bg-slate-50 shadow-[0_40px_90px_rgba(15,23,42,0.25)] ring-1 ring-slate-200"
      >
        <defs>
          <radialGradient id="lane-glow" r="65%" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id="track-texture" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(148,163,184,0.25)" />
            <stop offset="50%" stopColor="rgba(226,232,240,0.85)" />
            <stop offset="100%" stopColor="rgba(148,163,184,0.25)" />
          </linearGradient>
          <filter id="thruster-glow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
          </filter>
        </defs>

        {overallBounds && (
          <rect
            x={overallBounds.minX - 140}
            y={overallBounds.minY - 140}
            width={overallBounds.width + 280}
            height={overallBounds.height + 280}
            fill="url(#track-texture)"
            opacity={0.25}
          />
        )}

        <path
          d={outerPath}
          stroke="#cbd5f5"
          strokeWidth={6}
          fill="none"
          opacity={0.75}
        />

        <path
          d={innerPath}
          stroke="#cbd5f5"
          strokeWidth={6}
          fill="none"
          opacity={0.75}
        />

        <path
          d={centerPath}
          stroke="url(#track-texture)"
          strokeWidth={trackStroke}
          strokeLinecap="round"
          fill="none"
        />

        {geometry.zones.map((zone) => {
          const total = geometry.totalLength;
          const len = (zone.end - zone.start) * total;
          const offset = total - zone.start * total - len;
          return (
            <path
              key={zone.kind}
              d={centerPath}
              stroke={ZONE_COLORS[zone.kind] ?? '#bae6fd'}
              strokeWidth={(geometry.width ?? 80) - 14}
              strokeLinecap="round"
              fill="none"
              strokeDasharray={`${len} ${total}`}
              strokeDashoffset={offset}
              opacity={0.5}
            />
          );
        })}

        {visible.map((lane) => (
          <g
            key={lane.id}
            transform={`translate(${lane.x}, ${lane.y}) rotate(${(lane.heading * 180) / Math.PI})`}
          >
            <rect
              x={-4.6}
              y={-14}
              width={9.2}
              height={28}
              rx={4}
              fill={lane.tint ?? '#38bdf8'}
              stroke="#0f172a"
              strokeWidth={1.6}
            />
            <rect
              x={-3.8}
              y={6}
              width={7.6}
              height={6.5}
              rx={2.5}
              fill="rgba(255,255,255,0.65)"
            />
            {lane.hyperburst && (
              <ellipse
                cx={0}
                cy={16}
                rx={6}
                ry={12}
                fill={lane.tint}
                opacity={0.4}
                filter="url(#thruster-glow)"
              />
            )}
            <path
              d="M0 -16 L2 -6 L-2 -6 Z"
              fill="rgba(15,23,42,0.65)"
            />
          </g>
        ))}

        {indicators.map((lane) => (
          <g key={`${lane.id}-indicator`} transform={`translate(${lane.edgeX}, ${lane.edgeY})`}>
            <circle
              r={12}
              fill={lane.tint ?? '#38bdf8'}
              stroke="#0f172a"
              strokeWidth={2}
            />
            <text
              x={0}
              y={4}
              textAnchor="middle"
              fontSize="7"
              fontWeight="bold"
              fill="#fff"
            >
              {lane.place ?? lane.name[0]}
            </text>
            <text x={0} y={23} textAnchor="middle" fontSize="8" fill="#1e293b">
              {lane.gap >= 0
                ? `-${Math.round(lane.gap)}u`
                : `+${Math.round(Math.abs(lane.gap))}u`}
            </text>
          </g>
        ))}
      </svg>

      <div className="pointer-events-none absolute left-6 top-6 flex flex-col gap-2 text-xs font-semibold text-slate-100 drop-shadow">
        {frame?.lanes?.slice(0, 3).map((lane) => (
          <div
            key={`hud-${lane.id}`}
            className="flex items-center gap-3 rounded-full bg-slate-900/65 px-4 py-2 backdrop-blur"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: lane.tint ?? '#38bdf8' }}
            />
            <span>{lane.name}</span>
            <span className="text-slate-300">
              {Math.round((lane.velocity ?? 0) * 10)} cm/s
            </span>
            {lane.hyperburst && <span className="text-amber-300">BURST!</span>}
          </div>
        ))}
      </div>

      <div className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-2 rounded-2xl bg-slate-900/80 px-4 py-3 text-xs font-semibold text-slate-200 backdrop-blur">
        <div className="relative h-12 w-12 rounded-full border border-slate-500">
          <div
            className="absolute inset-1 rounded-full"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.35), transparent)',
            }}
          />
          {frame?.lanes?.map((lane) => (
            <div
              key={`dot-${lane.id}`}
              className="absolute h-2 w-2 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.45)]"
              style={{
                backgroundColor: lane.tint ?? '#38bdf8',
                left: `${50 + Math.cos(lane.heading ?? 0) * 22}%`,
                top: `${50 + Math.sin(lane.heading ?? 0) * 22}%`,
              }}
            />
          ))}
        </div>
        <div className="flex flex-col text-[10px] leading-tight">
          <span>Speed</span>
          <span className="text-base font-bold text-white">
            {Math.round((leader?.velocity ?? 0) * 10)} cm/s
          </span>
          <span className="text-slate-400">
            Zone {leader?.zone ?? '--'}
          </span>
        </div>
      </div>
    </div>
  );
}

