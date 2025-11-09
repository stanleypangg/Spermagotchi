'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import {
  svgPathFromGeometry,
  offsetPolylinePoints,
  sampleTrackAt,
  trackBounds,
} from '@/lib/race/geometry';
import { GOOD_HABITS_CONFIG, BAD_HABITS_CONFIG } from '@/app/data/constants';

const ZONE_COLORS = {
  flow: '#bfdbfe',
  gradient: '#fbcfe8',
  viscous: '#fde68a',
};

const SPRITE_SIZE = Object.freeze({
  width: 44,
  height: 44,
});

// Helper function to get motivational/congratulatory messages based on placement
function getPlacementMessage(position, totalRacers) {
  if (position === 1) {
    return {
      title: '🎉 VICTORY! 🎉',
      message: 'Your swimmers are absolutely champion quality! Premium motility detected!',
      emoji: '💪',
    };
  } else if (position === 2) {
    return {
      title: 'Great Job! 👏',
      message: 'So close to gold! Your boys showed excellent form and speed!',
      emoji: '🏃',
    };
  } else if (position === 3) {
    return {
      title: 'Nice! 👍',
      message: 'Solid performance! Your swimmers made it to the podium!',
      emoji: '🌟',
    };
  } else if (position === totalRacers) {
    // Last place - suggest improvements
    const suggestions = [
      `Try ${GOOD_HABITS_CONFIG[0].title} (${GOOD_HABITS_CONFIG[0].effect})`,
      `Try ${GOOD_HABITS_CONFIG[1].title} (${GOOD_HABITS_CONFIG[1].effect})`,
      `Try ${GOOD_HABITS_CONFIG[2].title} (${GOOD_HABITS_CONFIG[2].effect})`,
      `Try ${GOOD_HABITS_CONFIG[3].title} (${GOOD_HABITS_CONFIG[3].effect})`,
    ];
    const avoidSuggestions = [
      `Avoid ${BAD_HABITS_CONFIG[0].title} (${BAD_HABITS_CONFIG[0].effect})`,
      `Avoid ${BAD_HABITS_CONFIG[1].title} (${BAD_HABITS_CONFIG[1].effect})`,
      `Avoid ${BAD_HABITS_CONFIG[2].title} (${BAD_HABITS_CONFIG[2].effect})`,
      `Avoid ${BAD_HABITS_CONFIG[3].title} (${BAD_HABITS_CONFIG[3].effect})`,
    ];
    
    // Randomly choose either a good habit to try OR a bad habit to avoid (not both)
    const showGoodHabit = Math.random() > 0.5;
    const message = showGoodHabit 
      ? suggestions[Math.floor(Math.random() * suggestions.length)]
      : avoidSuggestions[Math.floor(Math.random() * avoidSuggestions.length)];
    
    return {
      title: 'Keep Swimming! 💧',
      message: message,
      emoji: '📈',
    };
  } else {
    // Middle positions - encourage improvement
    const suggestions = [
      `${GOOD_HABITS_CONFIG[0].title}`,
      `${GOOD_HABITS_CONFIG[1].title}`,
      `${GOOD_HABITS_CONFIG[2].title}`,
      `${GOOD_HABITS_CONFIG[3].title}`,
    ];
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    return {
      title: 'Good Effort! 💦',
      message: `Your swimmers showed promise! Boost your stats with ${randomSuggestion}!`,
      emoji: '🎯',
    };
  }
}

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

// Dialogue system for race interactions
const DIALOGUE = {
  collision: {
    aggressor: [
      "Outta my way, slowpoke!",
      "Move it or lose it!",
      "Watch where you're swimming!",
      "Step aside, tail dragger!",
      "Coming through!",
      "Learn to stay in your lane!",
      "Too slow, pal!",
      "Sorry, not sorry!",
      "My motility is superior!",
      "Beep beep, move aside!",
      "Can't handle my thrust!",
      "Get wiggling or get lost!",
    ],
    victim: [
      "Hey! Watch the tail!",
      "Ow! My flagellum!",
      "That's gonna leave a mark!",
      "Seriously?!",
      "Not cool, dude!",
      "I'm swimming here!",
      "Watch it!",
      "Rude!",
      "My acrosome!",
      "Tail collision!",
      "That hurt my head!",
      "I need that membrane!",
    ],
  },
  collisionResponse: [
    "My bad!",
    "Oops!",
    "Sorry!",
    "Didn't see ya!",
    "Tight quarters!",
    "Accidents happen!",
    "Lost control there!",
    "This tube is crowded!",
  ],
  hyperburst: [
    "TURBO MODE!",
    "Engaging hyperdrive!",
    "Maximum motility!",
    "Catch me if you can!",
    "Full speed ahead!",
    "Zooooom!",
    "Here we go!",
    "Flagellum ACTIVATED!",
    "Hyperspeed engaged!",
    "Prepare for thrust!",
    "Time to wiggle!",
  ],
  zoneEnter: {
    flow: [
      "Smooth sailing!",
      "Nice and easy!",
      "Love this zone!",
      "Perfect viscosity!",
      "So smooth!",
    ],
    gradient: [
      "Getting challenging!",
      "Bit harder here...",
      "Ooh, sticky!",
      "Extra resistance!",
      "Working harder now!",
    ],
    viscous: [
      "This is thick!",
      "Like swimming in syrup!",
      "So... slow...",
      "Ugh, viscous zone!",
      "Need more power!",
      "Can barely move!",
      "Heavy going!",
    ],
  },
  finish: [
    "YES! Made it!",
    "Fertilization here I come!",
    "Mission accomplished!",
    "Victory!",
    "I did it!",
    "First to the egg!",
    "Champions breed champions!",
    "Genetic superiority!",
  ],
  overtake: {
    overtaker: [
      "Later, slowpoke!",
      "Passing through!",
      "See ya!",
      "On your left!",
      "Eat my tail!",
      "Better luck next time!",
      "Too fast for you!",
      "Nice try!",
    ],
    overtaken: [
      "No way!",
      "Come back here!",
      "Not for long!",
      "I'll catch you!",
      "Dang it!",
      "This isn't over!",
      "Lucky swim!",
    ],
  },
};

function getRandomDialogue(category, subcategory = null) {
  const pool = subcategory ? DIALOGUE[category]?.[subcategory] : DIALOGUE[category];
  if (!pool || !pool.length) return null;
  return pool[Math.floor(Math.random() * pool.length)];
}

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
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [speechBubbles, setSpeechBubbles] = useState([]);
  const speechBubbleIdCounter = useRef(0);
  
  // Delay showing the end screen
  useEffect(() => {
    if (isFinished && finishOrder.length > 0) {
      const timer = setTimeout(() => {
        setShowEndScreen(true);
      }, 1500); // 1.5 second delay
      return () => clearTimeout(timer);
    } else {
      setShowEndScreen(false);
    }
  }, [isFinished, finishOrder.length]);

  // Handle race events and create speech bubbles
  useEffect(() => {
    if (!frame?.events || frame.events.length === 0) return;

    const newBubbles = [];
    const currentTime = Date.now();

    frame.events.forEach((event) => {
      let dialogue = null;
      let responseDialogue = null;
      let responseLaneId = null;
      let duration = 2500; // Default duration in ms

      switch (event.kind) {
        case 'collision':
          const isPlayer = event.racerId === 'player';
          const subcategory = event.isAggressor ? 'aggressor' : 'victim';
          dialogue = getRandomDialogue('collision', subcategory);
          
          // Sometimes add a response from the other racer
          if (Math.random() > 0.5) {
            responseDialogue = getRandomDialogue('collisionResponse');
            responseLaneId = event.otherRacerId;
          }
          duration = 3500;
          break;

        case 'overtake':
          const overtakeSubcategory = event.isOvertaker ? 'overtaker' : 'overtaken';
          dialogue = getRandomDialogue('overtake', overtakeSubcategory);
          duration = 3000;
          break;

        case 'hyperburst:start':
          // Only show dialogue 30% of the time to avoid clutter
          if (Math.random() < 0.3) {
            dialogue = getRandomDialogue('hyperburst');
            duration = 2500;
          }
          break;

        case 'zone:enter':
          // Only show zone dialogue 20% of the time and only for viscous/gradient
          if (event.zone !== 'flow' && Math.random() < 0.2) {
            dialogue = getRandomDialogue('zoneEnter', event.zone);
            duration = 3000;
          }
          break;

        case 'finish':
          // Only show finish dialogue for top 3 positions
          if (event.place <= 3) {
            dialogue = getRandomDialogue('finish');
            duration = 4000;
          }
          break;
      }

      if (dialogue) {
        const bubbleId = speechBubbleIdCounter.current++;
        newBubbles.push({
          id: bubbleId,
          laneId: event.racerId,
          text: dialogue,
          createdAt: currentTime,
          duration: duration,
        });

        // Add response bubble if applicable
        if (responseDialogue && responseLaneId) {
          const responseBubbleId = speechBubbleIdCounter.current++;
          newBubbles.push({
            id: responseBubbleId,
            laneId: responseLaneId,
            text: responseDialogue,
            createdAt: currentTime + 300, // Slight delay for response
            duration: duration - 300,
          });
        }
      }
    });

    if (newBubbles.length > 0) {
      setSpeechBubbles((prev) => {
        // Remove any existing bubbles from racers that are getting new bubbles
        const newBubbleLaneIds = new Set(newBubbles.map(b => b.laneId));
        const filtered = prev.filter(bubble => !newBubbleLaneIds.has(bubble.laneId));
        
        // Also deduplicate newBubbles - keep only the last bubble per racer
        const deduplicatedNew = [];
        const seenLaneIds = new Set();
        // Iterate backwards to keep the most recent bubble for each racer
        for (let i = newBubbles.length - 1; i >= 0; i--) {
          const bubble = newBubbles[i];
          if (!seenLaneIds.has(bubble.laneId)) {
            deduplicatedNew.unshift(bubble);
            seenLaneIds.add(bubble.laneId);
          }
        }
        
        return [...filtered, ...deduplicatedNew];
      });
    }
  }, [frame?.events]);

  // Clean up expired speech bubbles
  useEffect(() => {
    if (speechBubbles.length === 0) return;

    const interval = setInterval(() => {
      const currentTime = Date.now();
      setSpeechBubbles((prev) =>
        prev.filter((bubble) => currentTime - bubble.createdAt < bubble.duration)
      );
    }, 100);

    return () => clearInterval(interval);
  }, [speechBubbles.length]);
  
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
    
    // If the race is finished, use the actual place assigned at finish
    if (isFinished && playerLane.finished && playerLane.place) {
      return playerLane.place;
    }
    
    // During the race, calculate position based on progress
    const sortedLanes = [...frame.lanes].sort((a, b) => b.progress - a.progress);
    return sortedLanes.findIndex(lane => lane.id === 'player') + 1;
  }, [frame?.lanes, playerLane, isFinished]);

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

  const getPositionEffects = (position) => {
    if (position === 1) {
      return {
        containerClass: 'animate-[float-gentle_5s_ease-in-out_infinite] relative',
        glowClass: 'animate-[glow-pulse_4s_ease-in-out_infinite]',
        shimmerStyle: {
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 4s infinite ease-in-out',
        },
        showSparkles: true,
        borderClass: 'border-6 border-yellow-300 shadow-[0_0_60px_rgba(234,179,8,0.8),0_0_120px_rgba(234,179,8,0.5)]',
      };
    } else if (position === 2) {
      return {
        containerClass: 'animate-[float-gentle_3.5s_ease-in-out_infinite]',
        glowClass: '',
        shimmerStyle: null,
        showSparkles: false,
        borderClass: 'border-5 border-slate-300 shadow-[0_0_40px_rgba(203,213,225,0.6)]',
      };
    } else if (position === 3) {
      return {
        containerClass: '',
        glowClass: '',
        shimmerStyle: null,
        showSparkles: false,
        borderClass: 'border-4 border-orange-400 shadow-[0_0_30px_rgba(251,146,60,0.5)]',
      };
    } else {
      return {
        containerClass: '',
        glowClass: '',
        shimmerStyle: null,
        showSparkles: false,
        borderClass: 'border-4 border-white/70',
      };
    }
  };

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

  // Calculate scale factor for speech bubbles to maintain readable size
  const baseCameraSpan = 360; // Default camera span
  const bubbleScaleFactor = Math.max(1, viewBoxWidth / baseCameraSpan);

  const outerPath = useMemo(() => {
    if (!geometry) return '';
    return polylineToPath(offsetPolylinePoints(geometry, trackStroke / 2));
  }, [geometry, trackStroke]);

  const innerPath = useMemo(() => {
    if (!geometry) return '';
    return polylineToPath(offsetPolylinePoints(geometry, -trackStroke / 2));
  }, [geometry, trackStroke]);

  // Calculate parallax offset based on camera position
  const parallaxOffset = useMemo(() => {
    if (!cameraCenter || !overallBounds) return { x: 0, y: 0 };
    
    // Calculate progress through the track based on camera x position
    const trackWidth = overallBounds.width || 1;
    const trackHeight = overallBounds.height || 1;
    
    // Normalize camera position relative to track bounds
    const normalizedX = (cameraCenter.x - overallBounds.minX) / trackWidth;
    const normalizedY = (cameraCenter.y - overallBounds.minY) / trackHeight;
    
    // Parallax factors (lower = slower movement, creates depth)
    const parallaxFactorX = 0.3;
    const parallaxFactorY = 0.2;
    
    return {
      x: normalizedX * 100 * parallaxFactorX,
      y: normalizedY * 100 * parallaxFactorY,
    };
  }, [cameraCenter, overallBounds]);

  return (
    <div className="relative w-full h-screen overflow-hidden">
      {/* Parallax Background */}
      <div
        className="absolute inset-0 w-full h-full"
        style={{
          backgroundImage: 'url(/sperm_kingdom.png)',
          backgroundSize: 'cover',
          backgroundPosition: `${50 - parallaxOffset.x}% ${50 - parallaxOffset.y}%`,
          transition: 'background-position 0.1s ease-out',
        }}
      />
      
      {/* Semi-transparent overlay for better track visibility */}
      <div className="absolute inset-0 bg-linear-to-br from-indigo-100/30 via-purple-100/30 to-pink-100/30" />
      
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
          <pattern
            id="liquid-flow"
            x="0"
            y="0"
            width="80"
            height="100"
            patternUnits="userSpaceOnUse"
          >
            <animateTransform
              attributeName="patternTransform"
              type="translate"
              from="0 0"
              to="80 100"
              dur="25s"
              repeatCount="indefinite"
            />
            {/* Subtle squiggly lines for liquid effect - made more prominent with better colors */}
            <path
              d="M10,20 Q15,15 20,20 T30,20 T40,20"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M50,35 Q55,30 60,35 T70,35"
              stroke="rgba(255,255,255,0.6)"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M15,55 Q20,50 25,55 T35,55 T45,55"
              stroke="rgba(255,255,255,0.65)"
              strokeWidth="3.8"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M5,75 Q10,70 15,75 T25,75"
              stroke="rgba(255,255,255,0.62)"
              strokeWidth="3.6"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M55,85 Q60,80 65,85 T75,85"
              stroke="rgba(255,255,255,0.68)"
              strokeWidth="4.2"
              fill="none"
              strokeLinecap="round"
            />
            {/* Enhanced wavy forms with pink/purple tints */}
            <path
              d="M70,15 Q75,10 80,15"
              stroke="rgba(251,207,232,0.6)"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M30,65 Q35,60 40,65"
              stroke="rgba(251,207,232,0.55)"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
            {/* Additional flowing lines with compatible colors */}
            <path
              d="M0,10 Q5,5 10,10 T20,10"
              stroke="rgba(224,242,254,0.6)"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M40,45 Q45,40 50,45 T60,45"
              stroke="rgba(224,242,254,0.58)"
              strokeWidth="3.4"
              fill="none"
              strokeLinecap="round"
            />
            {/* Purple/lavender accents */}
            <path
              d="M25,30 Q30,25 35,30"
              stroke="rgba(233,213,255,0.55)"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
            />
            <path
              d="M60,60 Q65,55 70,60"
              stroke="rgba(233,213,255,0.52)"
              strokeWidth="3.2"
              fill="none"
              strokeLinecap="round"
            />
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

        {/* Liquid pattern overlay */}
        <path
          d={centerPath}
          stroke="url(#liquid-flow)"
          strokeWidth={trackStroke * 0.98}
          strokeLinecap="round"
          fill="none"
          opacity={0.95}
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

        {/* Speech Bubbles */}
        {speechBubbles.map((bubble) => {
          const lane = frame?.lanes?.find((l) => l.id === bubble.laneId);
          if (!lane) return null;

          // Check if lane is visible in viewport
          const isVisible = visible.some((v) => v.id === lane.id);
          if (!isVisible) return null;

          // Calculate fade based on remaining time
          const elapsed = Date.now() - bubble.createdAt;
          const remaining = bubble.duration - elapsed;
          const opacity = remaining < 800 ? remaining / 800 : 1;

          // Position above the racer (scaled with bubbleScaleFactor)
          const offsetY = -32 * bubbleScaleFactor;
          const padding = 6 * bubbleScaleFactor;
          const fontSize = 8 * bubbleScaleFactor;
          const maxCharsPerLine = 18;
          
          // Simple word wrapping
          const words = bubble.text.split(' ');
          const lines = [];
          let currentLine = '';
          
          words.forEach(word => {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            if (testLine.length <= maxCharsPerLine) {
              currentLine = testLine;
            } else {
              if (currentLine) lines.push(currentLine);
              currentLine = word;
            }
          });
          if (currentLine) lines.push(currentLine);
          
          // Limit to 2 lines max
          const displayLines = lines.slice(0, 2);
          if (lines.length > 2) {
            displayLines[1] = displayLines[1].substring(0, 15) + '...';
          }

          const lineHeight = fontSize * 1.3;
          const charWidth = fontSize * 0.6;
          const maxLineWidth = Math.max(...displayLines.map(line => line.length * charWidth));
          const bubbleWidth = maxLineWidth + padding * 2;
          const bubbleHeight = displayLines.length * lineHeight + padding * 1.5;
          const strokeWidth = 1.5 * bubbleScaleFactor;

          return (
            <g
              key={bubble.id}
              transform={`translate(${lane.x}, ${lane.y})`}
              opacity={opacity}
              className="speech-bubble"
            >
              {/* Speech bubble background */}
              <rect
                x={-bubbleWidth / 2}
                y={offsetY - bubbleHeight}
                width={bubbleWidth}
                height={bubbleHeight}
                rx={5 * bubbleScaleFactor}
                fill="white"
                stroke="#374151"
                strokeWidth={strokeWidth}
                filter="url(#tube-shadow)"
              />
              
              {/* Speech bubble tail */}
              <path
                d={`M ${-5 * bubbleScaleFactor} ${offsetY - 2 * bubbleScaleFactor} L ${0} ${offsetY + 6 * bubbleScaleFactor} L ${5 * bubbleScaleFactor} ${offsetY - 2 * bubbleScaleFactor}`}
                fill="white"
                stroke="#374151"
                strokeWidth={strokeWidth}
                strokeLinejoin="round"
              />

              {/* Text lines */}
              {displayLines.map((line, idx) => (
                <text
                  key={idx}
                  x={0}
                  y={offsetY - bubbleHeight + padding + (idx + 0.7) * lineHeight}
                  textAnchor="middle"
                  fontSize={fontSize}
                  fontWeight="600"
                  fill="#1f2937"
                  style={{ 
                    fontFamily: 'Arial, sans-serif',
                    pointerEvents: 'none',
                  }}
                >
                  {line}
                </text>
              ))}
            </g>
          );
        })}
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

      {/* End Screen */}
      {showEndScreen && (
        <div className="absolute inset-0 backdrop-blur-xl bg-black/40 flex items-center justify-center animate-[fadeIn_0.5s_ease-out]">
          <div className="max-w-2xl w-full px-8">
            {/* Title with bouncing animation */}
            <div className="text-center mb-8 animate-[bounceIn_0.8s_ease-out]">
              <h1 className="text-6xl font-black text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] mb-2" style={{ fontFamily: 'Impact, fantasy' }}>
                RACE COMPLETE!
              </h1>
              <div className="flex items-center justify-center gap-2 text-2xl font-bold text-yellow-300 drop-shadow">
                ⏱️ {frame?.t?.toFixed(2)}s
              </div>
            </div>

            {/* Player Result - Big and prominent */}
            {playerPosition && (
              <div className="mb-8 animate-[scaleIn_0.6s_ease-out_0.3s_both]">
                <div className={`bg-linear-to-br ${positionGradient} rounded-3xl p-6 shadow-2xl ${getPositionEffects(playerPosition).borderClass} ${getPositionEffects(playerPosition).containerClass} transform hover:scale-105 transition-transform overflow-hidden`}>
                  {/* Shimmer effect for 1st place */}
                  {getPositionEffects(playerPosition).shimmerStyle && (
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={getPositionEffects(playerPosition).shimmerStyle}
                    />
                  )}
                  
                  {/* Sparkles for 1st place */}
                  {getPositionEffects(playerPosition).showSparkles && (
                    <>
                      <div className="absolute top-4 left-4 text-4xl animate-[sparkle_4s_ease-in-out_infinite]">✨</div>
                      <div className="absolute top-4 right-4 text-4xl animate-[sparkle_4s_ease-in-out_infinite_1s]">✨</div>
                      <div className="absolute bottom-4 left-8 text-3xl animate-[sparkle_4s_ease-in-out_infinite_2s]">⭐</div>
                      <div className="absolute bottom-4 right-8 text-3xl animate-[sparkle_4s_ease-in-out_infinite_3s]">⭐</div>
                    </>
                  )}
                  
                  <div className={`text-center relative z-10 ${getPositionEffects(playerPosition).glowClass}`}>
                    <div className="text-sm font-bold text-white/90 uppercase tracking-widest mb-2">Your Result</div>
                    <div className="flex items-center justify-center gap-4">
                      <div className="text-7xl font-black text-white drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)]" style={{ fontFamily: 'Impact, fantasy' }}>
                        {playerPosition === 1 ? '🥇' : playerPosition === 2 ? '🥈' : playerPosition === 3 ? '🥉' : ''}
                        {playerPosition}
                      </div>
                      <div className="text-4xl font-bold text-white/90">
                        / {frame?.lanes?.length}
                      </div>
                    </div>
                    
                    {/* Placement-specific messages */}
                    {(() => {
                      const placementMsg = getPlacementMessage(playerPosition, frame?.lanes?.length);
                      return (
                        <div className="mt-4 space-y-2">
                          <div className={`font-black drop-shadow-lg ${
                            playerPosition === 1 ? 'text-2xl text-yellow-200 animate-pulse' :
                            playerPosition === 2 ? 'text-xl text-slate-200' :
                            playerPosition === 3 ? 'text-lg text-orange-200' :
                            'text-base text-white/90'
                          }`}>
                            {placementMsg.title}
                          </div>
                          <div className="text-sm font-semibold text-white/90 leading-relaxed px-2">
                            {placementMsg.message}
                          </div>
                          {placementMsg.secondaryMessage && (
                            <div className="text-xs font-medium text-white/80 italic px-2 mt-1">
                              {placementMsg.secondaryMessage}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {/* Leaderboard */}
            <div className="bg-slate-900/80 rounded-2xl p-6 shadow-2xl border-2 border-white/30 backdrop-blur">
              <h2 className="text-xl font-black text-white mb-4 text-center uppercase tracking-wider" style={{ fontFamily: 'Impact, fantasy' }}>
                Final Standings
              </h2>
              <div className="space-y-2">
                {finishOrder.map((racer, index) => {
                  const effects = getPositionEffects(racer.place);
                  const isFirst = racer.place === 1;
                  const isSecond = racer.place === 2;
                  const isThird = racer.place === 3;
                  
                  return (
                    <div
                      key={racer.id}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 transform transition-all hover:scale-102 animate-[slideInRight_0.5s_ease-out] backdrop-blur relative overflow-hidden ${
                        isFirst ? 'bg-yellow-600/40 border-2 border-yellow-400 shadow-[0_0_30px_rgba(234,179,8,0.6)]' :
                        isSecond ? 'bg-slate-700/50 border-2 border-slate-400 shadow-[0_0_20px_rgba(203,213,225,0.4)]' :
                        isThird ? 'bg-orange-700/40 border-2 border-orange-400 shadow-[0_0_15px_rgba(251,146,60,0.3)]' :
                        'bg-slate-800/60'
                      } ${effects.containerClass}`}
                      style={{ animationDelay: `${0.5 + index * 0.1}s`, animationFillMode: 'both' }}
                    >
                      {/* Shimmer for 1st place */}
                      {isFirst && effects.shimmerStyle && (
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={effects.shimmerStyle}
                        />
                      )}
                      
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full text-white font-black text-sm ${
                        isFirst ? 'bg-linear-to-br from-yellow-400 to-yellow-600 shadow-lg' :
                        isSecond ? 'bg-linear-to-br from-slate-300 to-slate-500 shadow-md' :
                        isThird ? 'bg-linear-to-br from-orange-400 to-orange-600 shadow-md' :
                        'bg-linear-to-br from-purple-500 to-pink-500'
                      }`}>
                        {racer.place}
                      </div>
                      <div
                        className={`w-10 h-10 rounded-full shadow-lg ${
                          isFirst ? 'border-3 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.5)]' :
                          isSecond ? 'border-3 border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.4)]' :
                          isThird ? 'border-3 border-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.3)]' :
                          'border-3 border-white'
                        }`}
                        style={{ backgroundColor: racer.tint }}
                      />
                      <div className="flex-1 relative z-10">
                        <div className={`font-bold text-lg ${
                          isFirst ? 'text-yellow-100' :
                          isSecond ? 'text-slate-100' :
                          'text-white'
                        }`}>
                          {racer.name}
                        </div>
                      </div>
                      {racer.place === 1 && <span className="text-3xl animate-pulse">👑</span>}
                      {racer.place === 2 && <span className="text-2xl">🥈</span>}
                      {racer.place === 3 && <span className="text-2xl">🥉</span>}
                      
                      {/* Sparkle for 1st in leaderboard */}
                      {isFirst && (
                        <div className="absolute -right-2 -top-2 text-2xl animate-[sparkle_4s_ease-in-out_infinite]">✨</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

