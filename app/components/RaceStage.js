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
  cameraSpan = 360,
  isFinished = false,
  finishOrder = [],
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

  const playerPosition = useMemo(() => {
    if (!frame?.lanes || !playerLane) return null;
    const sortedLanes = [...frame.lanes].sort((a, b) => b.progress - a.progress);
    return sortedLanes.findIndex(lane => lane.id === 'player') + 1;
  }, [frame?.lanes, playerLane]);

  const positionGradient = useMemo(() => {
    if (!playerPosition || !frame?.lanes) return 'from-yellow-400 via-orange-400 to-red-500';
    const totalRacers = frame.lanes.length;
    if (playerPosition === 1) {
      return 'from-yellow-300 via-amber-400 to-yellow-500';
    } else if (playerPosition === 2) {
      return 'from-slate-300 via-gray-400 to-slate-500';
    } else if (playerPosition === 3) {
      return 'from-orange-400 via-amber-600 to-orange-700';
    } else if (playerPosition <= totalRacers / 2) {
      return 'from-green-400 via-emerald-500 to-green-600';
    } else {
      return 'from-red-500 via-rose-600 to-red-700';
    }
  }, [playerPosition, frame?.lanes]);

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
    <div className="relative w-full h-screen bg-linear-to-br from-indigo-200 via-purple-200 to-pink-200 overflow-hidden">
      <svg
        width="100%"
        height="100%"
        viewBox={`${bounds.minX} ${bounds.minY} ${viewBoxWidth} ${viewBoxHeight}`}
        className="absolute inset-0"
        preserveAspectRatio="xMidYMid meet"
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
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
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
              r={SPRITE_SIZE.width / 2 + 6}
              fill={lane.tint ?? '#38bdf8'}
              opacity={0.75}
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

      {/* Top Progress Bar */}
      <div className="pointer-events-none absolute top-0 left-0 right-0 px-4 pt-3">
        <div className="relative h-6 bg-linear-to-r from-purple-900/40 via-pink-900/40 to-orange-900/40 rounded-full backdrop-blur-md shadow-2xl border-2 border-white/30 overflow-hidden">
          <div
            className="absolute inset-0 bg-linear-to-r from-cyan-400 via-pink-400 to-yellow-400 transition-all duration-300 ease-out shadow-[0_0_20px_rgba(251,146,60,0.6)]"
            style={{ width: `${Math.max(...(frame?.lanes?.map(l => l.progress) ?? [0])) * 100}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] tracking-wider">
              {(Math.max(...(frame?.lanes?.map(l => l.progress) ?? [0])) * 100).toFixed(1)}% COMPLETE
            </span>
          </div>
        </div>
      </div>

      {/* Top Left: Position & Timer */}
      <div className="pointer-events-none absolute top-12 left-4 flex flex-col gap-2">
        <div className={`bg-linear-to-br ${positionGradient} rounded-2xl px-4 py-2 shadow-2xl border-3 border-white/50 -rotate-2 transition-all duration-300`}>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" style={{ fontFamily: 'Impact, fantasy' }}>
              {playerPosition ?? '—'}
            </span>
            <span className="text-lg font-bold text-white/90">/{frame?.lanes?.length ?? 4}</span>
          </div>
          <div className="text-[9px] font-bold text-white/80 uppercase tracking-wider mt-0.5">Position</div>
        </div>
        
        <div className="bg-linear-to-br from-cyan-400 via-blue-400 to-indigo-500 rounded-xl px-3 py-2 shadow-xl border-2 border-white/40 rotate-1">
          <div className="flex items-center gap-1.5">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
            </svg>
            <span className="text-lg font-black text-white drop-shadow" style={{ fontFamily: 'Impact, fantasy' }}>
              {frame?.t?.toFixed(1) ?? '0.0'}s
            </span>
          </div>
        </div>
      </div>

      {/* Top Right: Mini Map */}
      <div className="pointer-events-none absolute top-12 right-4">
        <div className="bg-linear-to-br from-purple-500/90 via-pink-500/90 to-rose-500/90 rounded-2xl p-2 shadow-2xl border-3 border-white/50 backdrop-blur-md">
          <div className="text-[9px] font-bold text-white/90 uppercase tracking-wider mb-1">Track Map</div>
          <svg width="120" height="120" viewBox={`${overallBounds?.minX ?? 0} ${overallBounds?.minY ?? 0} ${overallBounds?.width ?? 100} ${overallBounds?.height ?? 100}`} className="bg-white/20 rounded-lg">
            <path
              d={centerPath}
              stroke="rgba(255,255,255,0.4)"
              strokeWidth={(geometry.width ?? 80) * 0.3}
              fill="none"
            />
            {frame?.lanes?.map((lane) => (
              <circle
                key={`map-${lane.id}`}
                cx={lane.x}
                cy={lane.y}
                r={(geometry.width ?? 80) * 0.15}
                fill={lane.tint ?? '#38bdf8'}
                stroke="white"
                strokeWidth={(geometry.width ?? 80) * 0.05}
              />
            ))}
            <rect
              x={bounds.minX}
              y={bounds.minY}
              width={viewBoxWidth}
              height={viewBoxHeight}
              fill="none"
              stroke="yellow"
              strokeWidth={(geometry.width ?? 80) * 0.08}
              strokeDasharray="5,5"
              opacity={0.8}
            />
          </svg>
        </div>
      </div>

      {/* Bottom Right: Speedometer */}
      <div className="pointer-events-none absolute bottom-16 right-4">
        <div className="bg-linear-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full p-4 shadow-2xl border-3 border-white/60 rotate-3">
          <div className="flex flex-col items-center">
            <div className="text-[9px] font-bold text-white/80 uppercase tracking-widest">Speed</div>
            <div className="flex items-baseline">
              <span className="text-3xl font-black text-white drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]" style={{ fontFamily: 'Impact, fantasy' }}>
                {((leader?.velocity ?? 0) / 100).toFixed(1)}
              </span>
            </div>
            <div className="text-[10px] font-bold text-white/90">m/s</div>
          </div>
        </div>
      </div>
    </div>
  );
}

