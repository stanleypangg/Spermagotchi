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

const SPRITE_SIZE = Object.freeze({
  width: 44,
  height: 44,
});

const DEFAULT_SPRITE = '/neutral.png';
const SPRITE_OVERRIDES = Object.freeze({
  hyperburst: '/speed.png',
  winner: '/happier.png',
  finished: '/happy.png',
  parked: '/petri.png',
  viscous: '/fat.png',
  gradient: '/matcha.png',
  tired: '/sad.png',
});

function resolveSpermSprite(lane) {
  if (!lane) return DEFAULT_SPRITE;
  if (lane.hyperburst) {
    return SPRITE_OVERRIDES.hyperburst;
  }
  if (lane.finished) {
    return lane.place === 1
      ? SPRITE_OVERRIDES.winner
      : SPRITE_OVERRIDES.finished;
  }
  if (lane.parked) {
    return SPRITE_OVERRIDES.parked;
  }
  if (lane.zone === 'viscous') {
    return SPRITE_OVERRIDES.viscous;
  }
  if (lane.zone === 'gradient') {
    return SPRITE_OVERRIDES.gradient;
  }
  const velocity = Math.max(0, lane.velocity ?? 0);
  if (velocity < 120) {
    return SPRITE_OVERRIDES.tired;
  }
  return lane.sprite ?? DEFAULT_SPRITE;
}

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

  const leader = useMemo(() => {
    if (!frame?.lanes?.length) {
      return null;
    }
    if (playerLane && !playerLane.finished) {
      return playerLane;
    }
    if (unfinishedLeaderboard.length > 0) {
      return unfinishedLeaderboard[0];
    }
    return playerLane ?? frame.lanes[0];
  }, [frame?.lanes, playerLane, unfinishedLeaderboard]);

  const cameraRef = useRef({
    x: leader?.x ?? 0,
    y: leader?.y ?? 0,
    t: frame?.t ?? 0,
    initialized: false,
    leaderId: leader?.id ?? null,
    lookahead: 90,
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
    const baseLookahead = Math.min(120, speed * 1.6);
    const desiredLookahead =
      leader.finished && geometry
        ? Math.max(baseLookahead, (geometry.width ?? 80) * 0.6)
        : baseLookahead;
    const dt = Math.max(1 / 120, frame.t - (prev.t ?? frame.t));
    const leaderChanged = prev.leaderId && prev.leaderId !== leader.id;
    const smoothingRate = leaderChanged ? 6.2 : 3.5;
    const smoothing = 1 - Math.exp(-dt * smoothingRate);
    const prevLookahead = prev.lookahead ?? baseLookahead;
    const lookahead = prevLookahead + (desiredLookahead - prevLookahead) * smoothing;
    const targetX = leader.x + tangent.x * lookahead;
    const targetY = leader.y + tangent.y * lookahead;
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
      lookahead,
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
        className="rounded-[36px] bg-linear-to-br from-sky-100 via-purple-100 to-pink-100 shadow-[0_40px_90px_rgba(88,28,135,0.25)] ring-2 ring-sky-200"
      >
        <defs>
          <linearGradient id="playground-track" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#bae6fd" />
            <stop offset="50%" stopColor="#fce7f3" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
          <radialGradient id="playground-glow" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.85)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <pattern
            id="bubble-pattern"
            x="0"
            y="0"
            width="60"
            height="60"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="20" cy="20" r="6" fill="rgba(255,255,255,0.18)" />
            <circle cx="45" cy="35" r="4" fill="rgba(255,255,255,0.12)" />
            <circle cx="15" cy="50" r="3" fill="rgba(255,255,255,0.1)" />
          </pattern>
          <radialGradient id="lane-glow" r="65%" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.8)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </radialGradient>
          <linearGradient id="tube-outer-wall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0a4c9" />
            <stop offset="25%" stopColor="#f0c6dd" />
            <stop offset="75%" stopColor="#e0a4c9" />
            <stop offset="100%" stopColor="#c78eb2" />
          </linearGradient>
          <linearGradient id="tube-inner-wall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#b87ca3" />
            <stop offset="25%" stopColor="#d4a1c6" />
            <stop offset="75%" stopColor="#b87ca3" />
            <stop offset="100%" stopColor="#a56890" />
          </linearGradient>
          <linearGradient id="tube-floor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e3f2fd" />
            <stop offset="50%" stopColor="#f8d7e8" />
            <stop offset="100%" stopColor="#ede7f6" />
          </linearGradient>
          <linearGradient id="tube-highlight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(255,255,255,0.5)" />
            <stop offset="100%" stopColor="rgba(255,255,255,0)" />
          </linearGradient>
          <linearGradient id="serration-stripe" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="rgba(136,71,120,0.15)" />
            <stop offset="50%" stopColor="rgba(136,71,120,0.08)" />
            <stop offset="100%" stopColor="rgba(136,71,120,0.15)" />
          </linearGradient>
          <linearGradient id="connection-piece" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#9b5a82" />
            <stop offset="50%" stopColor="#b87ca3" />
            <stop offset="100%" stopColor="#9b5a82" />
          </linearGradient>
          <filter id="thruster-glow">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
          </filter>
          <filter id="tube-shadow" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="rgba(136,71,120,0.35)" />
          </filter>
          <filter id="player-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {overallBounds && (
          <rect
            x={overallBounds.minX - 140}
            y={overallBounds.minY - 140}
            width={overallBounds.width + 280}
            height={overallBounds.height + 280}
            fill="url(#playground-track)"
            opacity={0.55}
          />
        )}

        {overallBounds && (
          <rect
            x={overallBounds.minX - 200}
            y={overallBounds.minY - 200}
            width={overallBounds.width + 400}
            height={overallBounds.height + 400}
            fill="url(#bubble-pattern)"
            opacity={0.65}
          />
        )}

        <path
          d={outerPath}
          stroke="url(#tube-outer-wall)"
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#tube-shadow)"
        />

        <path
          d={outerPath}
          stroke="url(#tube-highlight)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />

        <path
          d={innerPath}
          stroke="url(#tube-inner-wall)"
          strokeWidth={12}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#tube-shadow)"
        />

        <path
          d={innerPath}
          stroke="url(#tube-highlight)"
          strokeWidth={6}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.5}
        />

        <path
          d={centerPath}
          stroke="url(#tube-floor)"
          strokeWidth={trackStroke}
          strokeLinecap="round"
          fill="none"
        />

        {geometry.controlPoints && (() => {
          const serrations = [];
          const numSegments = Math.floor(geometry.totalLength / 25);
          for (let i = 0; i <= numSegments; i++) {
            const progress = i / numSegments;
            const sample = sampleTrackAt(geometry, progress * geometry.totalLength);
            const normal = { x: -sample.tangent.y, y: sample.tangent.x };
            const outerRadius = (geometry.width ?? 80) / 2 + 6;
            const innerRadius = -(geometry.width ?? 80) / 2 - 6;
            serrations.push(
              <line
                key={`serration-${i}`}
                x1={sample.x + normal.x * outerRadius}
                y1={sample.y + normal.y * outerRadius}
                x2={sample.x + normal.x * innerRadius}
                y2={sample.y + normal.y * innerRadius}
                stroke="url(#serration-stripe)"
                strokeWidth={3}
                opacity={0.6}
              />
            );
          }
          return serrations;
        })()}

        {geometry.controlPoints && (() => {
          const connections = [];
          const step = Math.floor(geometry.controlPoints.length / 5);
          for (let i = 0; i < geometry.controlPoints.length; i += step) {
            const pt = geometry.controlPoints[i];
            const sample = sampleTrackAt(geometry, (i / geometry.controlPoints.length) * geometry.totalLength);
            const normal = { x: -sample.tangent.y, y: sample.tangent.x };
            const outerRadius = (geometry.width ?? 80) / 2 + 6;
            const innerRadius = (geometry.width ?? 80) / 2 - 6;
            connections.push(
              <g key={`connection-${i}`}>
                <path
                  d={`M ${pt.x + normal.x * outerRadius} ${pt.y + normal.y * outerRadius} L ${pt.x + normal.x * innerRadius} ${pt.y + normal.y * innerRadius}`}
                  stroke="url(#connection-piece)"
                  strokeWidth={16}
                  strokeLinecap="round"
                />
                <path
                  d={`M ${pt.x - normal.x * outerRadius} ${pt.y - normal.y * outerRadius} L ${pt.x - normal.x * innerRadius} ${pt.y - normal.y * innerRadius}`}
                  stroke="url(#connection-piece)"
                  strokeWidth={16}
                  strokeLinecap="round"
                />
              </g>
            );
          }
          return connections;
        })()}

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
            <defs>
              <clipPath id={`clip-${lane.id}`}>
                <circle cx={0} cy={0} r={SPRITE_SIZE.width / 2} />
              </clipPath>
            </defs>
            <circle
              cx={0}
              cy={0}
              r={SPRITE_SIZE.width / 2 + 4}
              fill={lane.tint ?? '#38bdf8'}
              opacity={0.6}
              filter="url(#player-glow)"
            />
            <circle
              cx={0}
              cy={0}
              r={SPRITE_SIZE.width / 2}
              fill="white"
              stroke={lane.tint ?? '#38bdf8'}
              strokeWidth={3}
              filter="url(#tube-shadow)"
            />
            <image
              href={resolveSpermSprite(lane)}
              x={-SPRITE_SIZE.width * 1.1}
              y={-SPRITE_SIZE.height * 0.8}
              width={SPRITE_SIZE.width * 2.2}
              height={SPRITE_SIZE.height * 2.2}
              preserveAspectRatio="xMidYMid slice"
              clipPath={`url(#clip-${lane.id})`}
            />
            {lane.hyperburst && (
              <ellipse
                cx={0}
                cy={SPRITE_SIZE.width / 2 + 8}
                rx={16}
                ry={22}
                fill={lane.tint}
                opacity={0.4}
                filter="url(#thruster-glow)"
              />
            )}
          </g>
        ))}

        {indicators.map((lane) => (
          <g key={`${lane.id}-indicator`} transform={`translate(${lane.edgeX}, ${lane.edgeY})`}>
            <circle
              r={14}
              fill="white"
              stroke={lane.tint ?? '#38bdf8'}
              strokeWidth={2.5}
              filter="url(#bubble-shadow)"
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

      <div className="pointer-events-none absolute left-6 top-6 flex flex-col gap-3 text-xs font-semibold text-white drop-shadow-lg">
        {leaderboard.slice(0, 3).map((lane) => (
          <div
            key={`hud-${lane.id}`}
            className="flex items-center gap-3 rounded-full bg-linear-to-r from-sky-500/90 via-fuchsia-500/80 to-rose-500/80 px-4 py-2 backdrop-blur-md shadow-lg"
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

      <div className="pointer-events-none absolute bottom-5 right-5 flex items-center gap-3 rounded-2xl bg-linear-to-r from-indigo-500/90 via-violet-500/80 to-sky-500/90 px-5 py-3 text-xs font-semibold text-white backdrop-blur-md shadow-2xl">
        <div className="relative h-14 w-14 rounded-full border border-white/40 bg-white/15 shadow-inner">
          <div
            className="absolute inset-[6px] rounded-full"
            style={{
              background:
                'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.55), transparent)',
            }}
          />
          {frame?.lanes?.map((lane) => (
            <div
              key={`dot-${lane.id}`}
              className="absolute h-2.5 w-2.5 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.55)]"
              style={{
                backgroundColor: lane.tint ?? '#38bdf8',
                left: `${50 + Math.cos(lane.heading ?? 0) * 30}%`,
                top: `${50 + Math.sin(lane.heading ?? 0) * 30}%`,
              }}
            />
          ))}
        </div>
        <div className="flex flex-col text-[11px] leading-tight">
          <span className="uppercase tracking-[0.15em] text-[10px] text-white/80">
            Speed
          </span>
          <span className="text-lg font-black text-white drop-shadow">
            {((leader?.velocity ?? 0) / 100).toFixed(1)} m/s
          </span>
          <span className="text-white/75">
            Zone {leader?.zone ?? '--'}
          </span>
        </div>
      </div>
    </div>
  );
}

