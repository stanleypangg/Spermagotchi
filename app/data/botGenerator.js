/**
 * Bot generator for realistic race opponents.
 * Creates bots with varied stat distributions based on player level.
 */

import { calculatePlayerPower, generateBotStatsAtLevel, normalizeStatsForRace, normalizeStatForRace } from '../utils/statSystem.js';

const BOT_NAMES = [
  'Dash', 'Glide', 'Vector', 'Swift', 'Turbo', 'Flash', 'Zoom',
  'Bolt', 'Sprint', 'Rocket', 'Nitro', 'Blitz', 'Surge', 'Wave',
  'Streak', 'Comet', 'Jet', 'Pulse', 'Apex', 'Viper', 'Sonic',
  'Nova', 'Storm', 'Echo', 'Drift', 'Racer', 'Ace', 'Blaze',
  'Cyclone', 'Gale', 'Hurricane', 'Phoenix', 'Thunder', 'Titan',
  'Zephyr', 'Atlas', 'Cosmo', 'Drake', 'Falcon', 'Griffin',
  'Hawk', 'Icarus', 'Jolt', 'Kai', 'Leo', 'Meteor', 'Nero',
  'Orion', 'Phantom', 'Quasar', 'Rex', 'Saber', 'Tempest',
];

const TINT_COLORS = [
  '#f9a8d4', // pink
  '#bef264', // lime
  '#c4b5fd', // purple
  '#7dd3fc', // sky blue
  '#fca5a5', // red
  '#fdba74', // orange
  '#fde68a', // yellow
  '#86efac', // green
  '#67e8f9', // cyan
  '#c084fc', // violet
  '#fb923c', // orange-400
  '#a78bfa', // purple-400
];

const SPRITE_POOL = [
  '/67.png',
  '/amongus.png',
  '/drunk.png',
  '/fat.png',
  '/happier.png',
  '/happy.png',
  '/laptop hot.png',
  '/matcha.png',
  '/neutral.png',
  '/petri.png',
  '/plug.png',
  '/sad.png',
  '/sadder.png',
  '/smoking.png',
  '/speed.png',
];

/**
 * Calculate overall player level from stats (can be >100 now).
 * Uses weighted average similar to health score calculation.
 */
export function calculatePlayerLevel(stats) {
  return calculatePlayerPower(stats);
}

/**
 * Generate a single bot with stats at a target level.
 * Stat distribution can be specialized or balanced.
 * Now uses the new stat system with no 100 cap!
 */
function generateBotStats(targetLevel, specialized = false, seed = Math.random()) {
  // Generate raw stats using the new system
  const rawStats = generateBotStatsAtLevel(targetLevel, specialized, seed);
  
  // Return in race format (will be normalized when passed to race engine)
  const stats = {
    MI: rawStats.motility,
    LQ: rawStats.linearity,
    RE: rawStats.flow,
    CS: rawStats.signals,
  };
  
  return stats;
}

/**
 * Generate N bot opponents based on player level.
 * Uses leaderboard bots if available for realism.
 * Returns array of bot racer objects ready for race engine.
 */
export function generateBots(playerStats, count = 3, difficulty = 1.0, leaderboardBots = null) {
  const playerLevel = calculatePlayerLevel(playerStats);
  const bots = [];
  
  // If leaderboard bots are provided, try to match similar ELO opponents
  if (leaderboardBots && leaderboardBots.length > 0) {
    const playerElo = playerStats.elo || 1000;
    const eloRange = 150; // Match bots within ±150 ELO
    
    // Find bots with similar ELO
    const similarBots = leaderboardBots.filter(bot => {
      const eloDiff = Math.abs(bot.elo - playerElo);
      return eloDiff <= eloRange;
    });
    
    // If we have enough similar bots, use them
    if (similarBots.length >= count) {
      const shuffled = [...similarBots].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, count);
      
      return selected.map((bot, i) => {
        const sprite = SPRITE_POOL[Math.floor(Math.random() * SPRITE_POOL.length)];
        const tint = TINT_COLORS[Math.floor(Math.random() * TINT_COLORS.length)];
        
        // Normalize bot stats for race engine
        const normalizedStats = normalizeStatsForRace(bot.stats);
        
        return {
          id: `bot_${i}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          name: bot.name,
          tint,
          stats: normalizedStats,
          sprite,
          isBot: true,
        };
      });
    }
  }
  
  // Fallback: Generate random bots
  const usedNames = new Set();
  for (let i = 0; i < count; i++) {
    const seed = Math.random();
    const levelVariance = playerLevel * 0.1 * (seed - 0.5) * 2;
    const targetLevel = Math.max(30, playerLevel + levelVariance * difficulty); // NO CAP!
    
    const specialized = Math.random() > 0.4;
    const stats = generateBotStats(targetLevel, specialized, seed + i * 0.123);
    
    // Normalize stats for race engine
    const normalizedStats = {
      MI: normalizeStatForRace(stats.MI),
      LQ: normalizeStatForRace(stats.LQ),
      RE: normalizeStatForRace(stats.RE),
      CS: normalizeStatForRace(stats.CS),
    };
    
    let name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    let attempts = 0;
    while (usedNames.has(name) && attempts < 50) {
      name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
      attempts++;
    }
    usedNames.add(name);
    
    const sprite = SPRITE_POOL[Math.floor(Math.random() * SPRITE_POOL.length)];
    const tint = TINT_COLORS[Math.floor(Math.random() * TINT_COLORS.length)];
    
    bots.push({
      id: `bot_${i}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      name,
      tint,
      stats: normalizedStats,
      sprite,
      isBot: true,
    });
  }
  
  return bots;
}

/**
 * Convert player stats from habit system to race system format.
 */
export function playerStatsToRaceFormat(playerStats, playerName = 'You', playerSprite = '/67.png') {
  const { motility = 50, linearity = 50, flow = 50, signals = 50 } = playerStats;
  
  // Normalize stats to 0-100 scale for race engine
  const normalizedStats = normalizeStatsForRace(playerStats);
  
  return {
    id: 'player',
    name: playerName,
    tint: '#7dd3fc',
    stats: normalizedStats,
    sprite: playerSprite,
    isBot: false,
  };
}

/**
 * Determine player tier/rank based on ELO.
 */
export function getPlayerTier(elo) {
  if (elo >= 1800) return { name: 'Diamond', color: '#60a5fa', icon: '💎' };
  if (elo >= 1500) return { name: 'Platinum', color: '#a78bfa', icon: '🏆' };
  if (elo >= 1200) return { name: 'Gold', color: '#fbbf24', icon: '🥇' };
  if (elo >= 900) return { name: 'Silver', color: '#d1d5db', icon: '🥈' };
  return { name: 'Bronze', color: '#d97706', icon: '🥉' };
}

