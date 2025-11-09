import { useState, useEffect, useCallback } from 'react';

const PLAYER_NAME_KEY = 'player-name';

export function usePlayerData() {
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get player name from localStorage
  const getPlayerName = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(PLAYER_NAME_KEY);
  }, []);

  // Load player data
  const loadPlayer = useCallback(async (name) => {
    if (!name) {
      setLoading(false);
      return null;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/player?name=${encodeURIComponent(name)}`);
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load player');
      }
      
      setPlayerData(data.player);
      setError(null);
      return data.player;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Save player data
  const savePlayer = useCallback(async (name, updates) => {
    if (!name) return null;

    try {
      const res = await fetch('/api/player', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, data: updates }),
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save player');
      }
      
      setPlayerData(data.player);
      return data.player;
    } catch (err) {
      setError(err.message);
      return null;
    }
  }, []);

  // Update stats (for habit tracking)
  const updateStats = useCallback(async (stats) => {
    const name = getPlayerName();
    if (!name) return null;
    return savePlayer(name, { stats });
  }, [getPlayerName, savePlayer]);

  // Submit race result
  const submitRace = useCallback(async (raceResult) => {
    const name = getPlayerName();
    if (!name || !playerData) return null;

    const { place, raceTime } = raceResult;
    let eloChange = 0;
    let pointsEarned = 0;
    
    // ELO calculation
    if (place === 1) eloChange = 20;
    else if (place === 2) eloChange = 10;
    else if (place === 3) eloChange = 5;

    // Points calculation based on placement
    if (place === 1) pointsEarned = 100;
    else if (place === 2) pointsEarned = 50;
    else if (place === 3) pointsEarned = 25;
    else pointsEarned = 10; // Participation points
    
    // Time bonus: faster races get bonus points (max 50 bonus)
    if (raceTime && raceTime > 0) {
      const timeBonus = Math.max(0, Math.min(50, Math.floor(60 / raceTime * 10)));
      pointsEarned += timeBonus;
    }

    const newElo = (playerData.elo || 1000) + eloChange;
    const newPoints = (playerData.spermPoints || 0) + pointsEarned;
    const newHistory = [...(playerData.raceHistory || []), {
      ...raceResult,
      timestamp: new Date().toISOString(),
      eloChange,
      eloAfter: newElo,
      pointsEarned,
    }].slice(-50); // Keep last 50 races

    const result = await savePlayer(name, {
      elo: newElo,
      spermPoints: newPoints,
      raceHistory: newHistory,
    });
    
    // Return the rewards for display
    return {
      ...result,
      eloChange,
      pointsEarned,
    };
  }, [getPlayerName, playerData, savePlayer]);

  // Load on mount
  useEffect(() => {
    const name = getPlayerName();
    if (name) {
      loadPlayer(name);
    } else {
      setLoading(false);
    }
  }, [getPlayerName, loadPlayer]);

  return {
    playerData,
    loading,
    error,
    loadPlayer,
    savePlayer,
    updateStats,
    submitRace,
    getPlayerName,
  };
}

