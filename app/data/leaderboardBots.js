/**
 * Generate realistic leaderboard bots for demonstration.
 * Creates bots with ELO following a bell curve distribution.
 */

const BOT_NAMES = [
  'SwiftCell', 'TurboSwimmer', 'NitroRacer', 'BlitzMaster', 'RapidFire',
  'VelocityKing', 'DashLegend', 'QuickStrike', 'FastLane', 'SpeedDemon',
  'ThunderBolt', 'LightningFast', 'StormRider', 'WindRunner', 'FlashPoint',
  'SonicBoom', 'HyperDrive', 'TurboCharge', 'RocketMan', 'JetStream',
  'AceRacer', 'ProSwimmer', 'EliteCell', 'ChampionCell', 'MasterRacer',
  'ApexSwimmer', 'ViperSpeed', 'CobraRush', 'FalconDive', 'EagleEye',
  'PhoenixRise', 'DragonRush', 'TitanForce', 'ZeusCell', 'AthenaPower',
  'HerculesStrong', 'OdinSwift', 'ThorRush', 'LokiTrick', 'AresWar',
  'CyberRacer', 'NeonSpeed', 'PixelPush', 'DigitalDash', 'ByteBlitz',
  'CodeRacer', 'DataDrive', 'CloudNine', 'SkyHigh', 'StarStruck',
  'CosmicRush', 'GalaxyGlide', 'NebulaSpeed', 'PlanetRacer', 'SolarFlare',
  'LunarWave', 'MeteorStrike', 'CometTail', 'AstroSpeed', 'OrbitRacer',
  'QuantumLeap', 'NuclearSpeed', 'FusionForce', 'IonBlast', 'PlasmaRush',
  'VortexSpin', 'CycloneForce', 'TornadoTwist', 'HurricaneHit', 'TyphoonPower',
  'GaleForce', 'BreezeRunner', 'ZephyrSpeed', 'WhirlwindRush', 'TempestRage',
  'FrostBite', 'IceBreaker', 'BlazeRunner', 'InfernoRush', 'PyroSpeed',
  'AquaGlide', 'WaveRider', 'TideRacer', 'OceanSwift', 'SeaSurge',
  'RiverRush', 'StreamSpeed', 'FlowMaster', 'CurrentKing', 'RapidsRacer',
  'MountainHigh', 'ValleyLow', 'PeakPerformer', 'SummitRush', 'CliffDiver',
  'CanyonSpeed', 'MesaRunner', 'DesertStorm', 'SavannaSwift', 'JungleRush',
  'ForestGlide', 'WoodlandRacer', 'GroveMaster', 'ThicketSpeed', 'ShadowRun',
  'DarkKnight', 'NightRacer', 'TwiLight', 'DawnBreaker', 'DuskRunner',
  'EclipseMaster', 'SolarisSpeed', 'LunaticRacer', 'StardustRush', 'MoonBeam',
  'SunBurst', 'DayBreak', 'NoonRacer', 'MidnightRun', 'EveningSwift',
  'MorningGlory', 'AfternoonSpeed', 'PrimeTime', 'RushHour', 'SpeedZone',
  'FastTrack', 'QuickLap', 'RapidRace', 'SwiftCircuit', 'TurboLoop',
  'NitroLap', 'BlitzCircuit', 'DashTrack', 'SprintLane', 'VelocityZone',
  'AccelForce', 'BoostMaster', 'ThrottleMax', 'GearHead', 'RevUpRacer',
  'PitStopPro', 'CheckeredFlag', 'PolePosition', 'GridMaster', 'StartLine',
  'FinishFirst', 'LapLeader', 'CircuitKing', 'TrackStar', 'RaceLegend',
  'SpeedMerchant', 'VelocityVendor', 'RapidRetailer', 'QuickDealer', 'FastSeller',
  'TurboTrader', 'NitroNegotiator', 'BlitzBroker', 'DashDealer', 'SwiftSeller',
  'ExpressRacer', 'InstantSpeed', 'QuickDraw', 'FastSnap', 'RapidResponse',
  'SwiftReply', 'QuickAction', 'SpeedyService', 'RapidRescue', 'FastAid',
  'TurboAssist', 'NitroHelper', 'BlitzBackup', 'DashSupport', 'SwiftSaver',
  'UltraSpeed', 'MegaRacer', 'SuperSwift', 'HyperRush', 'ExtremeSpeed',
  'MaxVelocity', 'ProMax', 'ElitePro', 'ChampMax', 'AceElite',
];

const USED_NAMES = new Set();

/**
 * Generate a random name that hasn't been used
 */
function generateUniqueName() {
  let attempts = 0;
  while (attempts < 1000) {
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    if (!USED_NAMES.has(name)) {
      USED_NAMES.add(name);
      return name;
    }
    attempts++;
  }
  // Fallback if all names are used
  const fallback = `Racer${Math.floor(Math.random() * 10000)}`;
  USED_NAMES.add(fallback);
  return fallback;
}

/**
 * Generate ELO following a bell curve centered around mean
 */
function generateBellCurveELO(mean = 1100, stdDev = 200) {
  // Box-Muller transform for normal distribution
  const u1 = Math.random();
  const u2 = Math.random();
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return Math.round(mean + stdDev * z0);
}

/**
 * Generate stats that correlate with ELO
 */
function generateStatsFromELO(elo) {
  // Base level from ELO (higher ELO = higher stats)
  const baseLevel = Math.min(95, Math.max(30, (elo - 500) / 15));
  
  // Add some variance to make it realistic
  const variance = 8;
  const stats = {
    motility: Math.max(20, Math.min(100, baseLevel + (Math.random() - 0.5) * variance * 2)),
    linearity: Math.max(20, Math.min(100, baseLevel + (Math.random() - 0.5) * variance * 2)),
    flow: Math.max(20, Math.min(100, baseLevel + (Math.random() - 0.5) * variance * 2)),
    signals: Math.max(20, Math.min(100, baseLevel + (Math.random() - 0.5) * variance * 2)),
  };
  
  return stats;
}

/**
 * Generate win/loss record that correlates with ELO
 */
function generateRecordFromELO(elo) {
  // Higher ELO should have better win rate
  const expectedWinRate = Math.min(0.8, Math.max(0.2, (elo - 500) / 1500));
  
  // Generate realistic number of games (between 10 and 200)
  const totalGames = Math.floor(20 + Math.random() * 180);
  
  // Calculate wins with some variance
  const variance = 0.1;
  const actualWinRate = Math.max(0, Math.min(1, expectedWinRate + (Math.random() - 0.5) * variance));
  const wins = Math.round(totalGames * actualWinRate);
  const losses = totalGames - wins;
  
  return { wins, losses, totalGames };
}

/**
 * Generate a single bot profile
 */
function generateBotProfile(rank) {
  const name = generateUniqueName();
  const elo = generateBellCurveELO(1100, 250);
  const stats = generateStatsFromELO(elo);
  const record = generateRecordFromELO(elo);
  
  return {
    rank,
    name,
    elo,
    wins: record.wins,
    losses: record.losses,
    winRate: record.totalGames > 0 ? Math.round((record.wins / record.totalGames) * 100) : 0,
    stats,
    isBot: true,
  };
}

/**
 * Generate leaderboard with bots
 */
export function generateLeaderboardBots(count = 150) {
  USED_NAMES.clear();
  
  const bots = [];
  for (let i = 0; i < count; i++) {
    bots.push(generateBotProfile(i + 1));
  }
  
  // Sort by ELO descending
  bots.sort((a, b) => b.elo - a.elo);
  
  // Update ranks after sorting
  bots.forEach((bot, idx) => {
    bot.rank = idx + 1;
  });
  
  return bots;
}

/**
 * Insert player into leaderboard at correct position
 */
export function insertPlayerIntoLeaderboard(bots, playerData) {
  const playerElo = playerData?.elo ?? 1000;
  const playerStats = playerData?.stats ?? { motility: 50, linearity: 50, flow: 50, signals: 50 };
  const raceHistory = playerData?.raceHistory ?? [];
  
  const wins = raceHistory.filter(r => r.place === 1).length;
  const losses = raceHistory.filter(r => r.place > 1).length;
  const totalGames = wins + losses;
  
  const playerEntry = {
    rank: 1,
    name: playerData?.name ?? 'You',
    elo: playerElo,
    wins,
    losses,
    winRate: totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0,
    stats: playerStats,
    isBot: false,
    isPlayer: true,
  };
  
  // Insert player at correct position
  const combined = [...bots, playerEntry];
  combined.sort((a, b) => b.elo - a.elo);
  
  // Update ranks
  combined.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });
  
  return combined;
}

/**
 * Get cached or generate leaderboard bots
 */
let cachedBots = null;

export function getLeaderboardBots() {
  if (!cachedBots) {
    cachedBots = generateLeaderboardBots(150);
  }
  return cachedBots;
}

