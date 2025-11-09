/**
 * Stat System Utilities
 * Handles stat normalization, ranking, and scaling across the game.
 * 
 * CORE CONCEPT:
 * - Raw stats can grow infinitely (50 → 100 → 150 → 200+)
 * - For race simulation, stats are normalized to 0-100 scale
 * - Ranking system scales intelligently with progression
 */

/**
 * Normalize a stat value to 0-100 scale for race engine
 * Uses soft cap formula to prevent extreme values
 */
export function normalizeStatForRace(rawValue) {
  // Soft cap using logarithmic scaling
  // 50 → 50, 100 → 75, 150 → 87, 200 → 93, 300 → 97
  const softCap = 100 * (1 - Math.exp(-rawValue / 100));
  return Math.round(Math.max(0, Math.min(100, softCap)));
}

/**
 * Get stat rank based on raw value
 * Scales intelligently with progression
 */
export function getStatRank(rawValue) {
  // Rank thresholds scale with progression
  if (rawValue >= 300) return { 
    rank: 'SSS+', 
    color: 'from-yellow-400 to-orange-400', 
    textColor: 'text-yellow-600', 
    glow: 'shadow-yellow-500/50' 
  };
  if (rawValue >= 250) return { 
    rank: 'SSS', 
    color: 'from-purple-400 to-pink-400', 
    textColor: 'text-purple-600', 
    glow: 'shadow-purple-500/50' 
  };
  if (rawValue >= 200) return { 
    rank: 'SS+', 
    color: 'from-red-500 to-rose-500', 
    textColor: 'text-red-600', 
    glow: 'shadow-red-500/40' 
  };
  if (rawValue >= 150) return { 
    rank: 'SS', 
    color: 'from-red-400 to-rose-400', 
    textColor: 'text-red-600', 
    glow: 'shadow-red-500/30' 
  };
  if (rawValue >= 120) return { 
    rank: 'S+', 
    color: 'from-orange-500 to-amber-500', 
    textColor: 'text-orange-600', 
    glow: 'shadow-orange-500/40' 
  };
  if (rawValue >= 100) return { 
    rank: 'S', 
    color: 'from-orange-400 to-amber-400', 
    textColor: 'text-orange-600', 
    glow: 'shadow-orange-500/30' 
  };
  if (rawValue >= 85) return { 
    rank: 'A+', 
    color: 'from-emerald-500 to-teal-500', 
    textColor: 'text-emerald-600', 
    glow: 'shadow-emerald-500/30' 
  };
  if (rawValue >= 70) return { 
    rank: 'A', 
    color: 'from-emerald-400 to-teal-400', 
    textColor: 'text-emerald-600', 
    glow: 'shadow-emerald-500/20' 
  };
  if (rawValue >= 60) return { 
    rank: 'B+', 
    color: 'from-blue-500 to-cyan-500', 
    textColor: 'text-blue-600', 
    glow: 'shadow-blue-500/30' 
  };
  if (rawValue >= 50) return { 
    rank: 'B', 
    color: 'from-blue-400 to-cyan-400', 
    textColor: 'text-blue-600', 
    glow: 'shadow-blue-500/20' 
  };
  if (rawValue >= 40) return { 
    rank: 'C+', 
    color: 'from-slate-500 to-slate-600', 
    textColor: 'text-slate-600', 
    glow: '' 
  };
  return { 
    rank: 'C', 
    color: 'from-slate-400 to-slate-500', 
    textColor: 'text-slate-600', 
    glow: '' 
  };
}

/**
 * Calculate overall player power level from raw stats
 * Used for matchmaking and difficulty scaling
 */
export function calculatePlayerPower(stats) {
  const { motility = 50, linearity = 50, flow = 50, signals = 50 } = stats;
  return (
    0.35 * motility +
    0.30 * linearity +
    0.20 * flow +
    0.15 * signals
  );
}

/**
 * Normalize all stats for race engine
 */
export function normalizeStatsForRace(stats) {
  return {
    MI: normalizeStatForRace(stats.motility || 50),
    LQ: normalizeStatForRace(stats.linearity || 50),
    RE: normalizeStatForRace(stats.flow || 50),
    CS: normalizeStatForRace(stats.signals || 50),
  };
}

/**
 * Generate bot stats at target power level
 * Bots can also have stats beyond 100
 */
export function generateBotStatsAtLevel(targetPower, specialized = false, seed = Math.random()) {
  const baseStats = { motility: 50, linearity: 50, flow: 50, signals: 50 };
  
  if (specialized) {
    // Bot specializes in 1-2 stats
    const statKeys = ['motility', 'linearity', 'flow', 'signals'];
    const primaryStat = statKeys[Math.floor(seed * 4)];
    const secondaryStat = statKeys[Math.floor((seed * 7) % 4)];
    
    const variance = targetPower * 0.2; // ±20% variance
    
    baseStats[primaryStat] = Math.max(30, targetPower + variance * (seed - 0.5) * 2);
    baseStats[secondaryStat] = Math.max(30, targetPower * 0.8 + variance * (seed - 0.3));
    
    // Others slightly below average
    statKeys.forEach(key => {
      if (key !== primaryStat && key !== secondaryStat) {
        baseStats[key] = Math.max(30, targetPower * 0.6 + variance * (Math.random() - 0.5));
      }
    });
  } else {
    // Balanced bot - all stats around target level
    const variance = targetPower * 0.15;
    baseStats.motility = Math.max(30, targetPower + variance * (seed - 0.5) * 2);
    baseStats.linearity = Math.max(30, targetPower + variance * (seed * 2 - 0.5) * 2);
    baseStats.flow = Math.max(30, targetPower + variance * (seed * 3 - 0.5) * 2);
    baseStats.signals = Math.max(30, targetPower + variance * (seed * 4 - 0.5) * 2);
  }
  
  return {
    motility: Math.round(baseStats.motility),
    linearity: Math.round(baseStats.linearity),
    flow: Math.round(baseStats.flow),
    signals: Math.round(baseStats.signals),
  };
}

