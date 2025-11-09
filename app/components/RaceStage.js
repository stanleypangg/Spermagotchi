'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
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

const clampValue = (value, min, max) => Math.min(max, Math.max(min, value));

function computeIndicators(lanes, bounds, leader, totalLength) {
  const indicators = [];
  const visible = [];
  const cx = (bounds.minX + bounds.maxX) / 2;
  const cy = (bounds.minY + bounds.maxY) / 2;
  const halfW = (bounds.maxX - bounds.minX) / 2;
  const halfH = (bounds.maxY - bounds.minY) / 2;
  const eps = 1e-3;
  const leaderProgress = leader?.progress ?? 0;

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

    const gap = (lane.progress - leaderProgress) * totalLength;
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

  const unfinishedLeaderboard = useMemo(() => {
    if (!frame?.lanes) return [];
    return frame.lanes
      .filter((lane) => !lane.finished)
      .sort((a, b) => b.progress - a.progress);
  }, [frame?.lanes]);

  const playerLane = useMemo(
    () => frame?.lanes?.find((lane) => lane.id === 'player'),
    [frame?.lanes],
  );

  const leader =
    (playerLane && (!playerLane.finished || !playerLane.parked)
      ? playerLane
      : unfinishedLeaderboard[0]) ??
    frame?.lanes?.reduce(
      (best, lane) => (lane.progress > (best?.progress ?? -Infinity) ? lane : best),
      frame?.lanes?.[0],
    );

  const cameraRef = useRef({
    x: leader?.x ?? 0,
    y: leader?.y ?? 0,
    t: frame?.t ?? 0,
    initialized: false,
    leaderId: leader?.id ?? null,
  });
  const [cameraCenter, setCameraCenter] = useState({
    x: leader?.x ?? 0,
    y: leader?.y ?? 0,
  });

  useEffect(() => {
    if (!frame || !leader) {
      return;
    }
    const prev = cameraRef.current;
    const tangent = leader.tangent ?? { x: 1, y: 0 };
    const speed = leader.velocity ?? 0;
    const baseLookahead = Math.min(120, speed * 1.5);
    const finishBias =
      leader.finished && geometry
        ? Math.max(baseLookahead, (geometry.width ?? 80) * 0.6)
        : baseLookahead;
    const filteredTangent = prev.tangent
      ? {
          x: prev.tangent.x + (tangent.x - prev.tangent.x) * 0.35,
          y: prev.tangent.y + (tangent.y - prev.tangent.y) * 0.35,
        }
      : tangent;
    const targetX = leader.x + filteredTangent.x * finishBias;
    const targetY = leader.y + filteredTangent.y * finishBias;
    const dt = Math.max(1 / 120, frame.t - (prev.t ?? frame.t));
    const leaderChanged = prev.leaderId && prev.leaderId !== leader.id;
    const smoothingRate = leaderChanged ? 4.2 : 2.4;
    const smoothing = 1 - Math.exp(-dt * smoothingRate);
    const baseX = prev.initialized ? prev.x : targetX;
    const baseY = prev.initialized ? prev.y : targetY;
    const nextX = baseX + (targetX - baseX) * smoothing;
    const nextY = baseY + (targetY - baseY) * smoothing;
    cameraRef.current = {
      x: nextX,
      y: nextY,
      t: frame.t,
      initialized: true,
      leaderId: leader.id,
      tangent: filteredTangent,
    };
    setCameraCenter({ x: nextX, y: nextY });
  }, [frame, leader, geometry]);

  const overallBounds = useMemo(
    () => (geometry ? trackBounds(geometry) : null),
    [geometry],
  );

  const aspect = height / width;
  const halfW = cameraSpan;
  const halfH = cameraSpan * aspect;

  const bounds = useMemo(() => {
    const trackWidth = geometry?.width ?? 80;
    const pad = trackWidth * 2.1;
    const allFinished = frame?.lanes?.every((lane) => lane.finished);
    const finishPad = allFinished ? trackWidth * 6.5 : trackWidth * 1.6;
    const leaderPad = leader?.finished ? trackWidth * 2.6 : 0;
    let minX = cameraCenter.x - halfW;
    let maxX = cameraCenter.x + halfW;
    let minY = cameraCenter.y - halfH;
    let maxY = cameraCenter.y + halfH;

    if (overallBounds) {
      const minLimitX = overallBounds.minX - pad;
      const maxLimitX = overallBounds.maxX + pad + finishPad + leaderPad;
      const minLimitY = overallBounds.minY - pad;
      const maxLimitY = overallBounds.maxY + pad;
      const viewWidth = halfW * 2;
      const viewHeight = halfH * 2;
      minX = clampValue(minX, minLimitX, maxLimitX - viewWidth);
      maxX = minX + viewWidth;
      minY = clampValue(minY, minLimitY, maxLimitY - viewHeight);
      maxY = minY + viewHeight;
    }

    return { minX, maxX, minY, maxY };
  }, [cameraCenter, halfW, halfH, overallBounds, geometry?.width, frame?.lanes, leader]);

  const leaderboard = useMemo(() => {
    if (!frame?.lanes) return [];
    return [...frame.lanes].sort((a, b) => b.progress - a.progress);
  }, [frame?.lanes]);

  const { visible, indicators } = useMemo(() => {
    if (!frame?.lanes) {
      return { visible: [], indicators: [] };
    }
    return computeIndicators(
      frame.lanes,
      bounds,
      leader,
      frame?.totalLength ?? geometry?.totalLength ?? 1,
    );
  }, [frame?.lanes, bounds, leader, geometry, frame?.totalLength]);

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
            transform={`translate(${lane.x}, ${lane.y}) rotate(${((lane.heading ?? 0) * 180) / Math.PI})`}
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
                ? `+${(lane.gap / 100).toFixed(1)}m`
                : `${(lane.gap / 100).toFixed(1)}m`}
            </text>
          </g>
        ))}
      </svg>

      <div className="pointer-events-none absolute left-6 top-6 flex flex-col gap-2 text-xs font-semibold text-slate-100 drop-shadow">
        {leaderboard.slice(0, 3).map((lane) => (
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
              {((lane.velocity ?? 0) / 100).toFixed(1)} m/s
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
            {((leader?.velocity ?? 0) / 100).toFixed(1)} m/s
          </span>
          <span className="text-slate-400">
            Zone {leader?.zone ?? '--'}
          </span>
        </div>
      </div>
    </div>
  );
}

