'use client';

import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import RaceStage from '@/app/components/RaceStage';
import RaceMatchmaking from '@/app/components/RaceMatchmaking';
import { createRaceEngine } from '@/lib/race/engine';
import { sampleTrackAt, trackBounds } from '@/lib/race/geometry';
import { initRapier } from '@/lib/race/physics';
import { MOCK_BALANCE, TRACK_PRESETS } from '@/app/data/mockRace';
import { generateBots, playerStatsToRaceFormat } from '@/app/data/botGenerator';
import { getLeaderboardBots } from '@/app/data/leaderboardBots';
import { usePlayerData } from '@/app/hooks/usePlayerData';

const DT = 1 / 60;
const FINISH_WIND_DOWN_MS = 1500;

export default function RacePage() {
  const { playerData, loading, submitRace } = usePlayerData();
  const [phase, setPhase] = useState('loading'); // loading, matchmaking, racing, finished
  const [selectedTrack, setSelectedTrack] = useState(null);
  const [racers, setRacers] = useState([]);
  const [engineBundle, setEngineBundle] = useState(null);
  const [frame, setFrame] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [finishOrder, setFinishOrder] = useState([]);
  const [cameraSpan, setCameraSpan] = useState(400);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const [eloGained, setEloGained] = useState(null);
  const [pointsEarned, setPointsEarned] = useState(null);
  const [countdown, setCountdown] = useState(null);

  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const accRef = useRef(0);
  const lastRef = useRef(0);
  const isRunningRef = useRef(false);
  const frameRef = useRef(null);
  const finishTimerRef = useRef(null);

  // Set phase based on player data loading (only on initial load)
  useEffect(() => {
    if (loading) {
      setPhase('loading');
    } else if (!playerData) {
      setPhase('error');
    } else if (phase === 'loading' || phase === 'error') {
      // Only set to matchmaking from loading/error states, not from racing/finished
      setPhase('matchmaking');
    }
  }, [loading, playerData, phase]);

  const clearFinishTimer = () => {
    finishTimerRef.current = null;
  };

  const handleRaceStart = useCallback(async () => {
    if (!playerData) return;

    // Select random track
    const track = TRACK_PRESETS[Math.floor(Math.random() * TRACK_PRESETS.length)];
    setSelectedTrack(track);

    // Convert player stats to race format
    const playerRacer = playerStatsToRaceFormat(
      playerData.stats,
      playerData.name,
      '/67.png'
    );

    // Generate 3 bot opponents using leaderboard bots for realism
    const leaderboardBots = getLeaderboardBots();
    const bots = generateBots(playerData, 3, 1.0, leaderboardBots);

    // Combine player and bots
    const allRacers = [playerRacer, ...bots];
    setRacers(allRacers);

    // Initialize race engine
    await initRapier();
    const engine = await createRaceEngine(
      allRacers,
      track,
      { seed: Date.now() },
      MOCK_BALANCE
    );

    engineRef.current = engine;
    setEngineBundle({
      engine,
      geometry: engine.track,
      trackMeta: trackBounds(engine.track),
    });

    const initial = engine.step(0);
    frameRef.current = initial;
    setFrame(initial);
    setPhase('racing');
    
    // Start countdown before racing
    setCountdown(3);
    let count = 3;
    const countdownInterval = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
      } else {
        setCountdown(null);
        clearInterval(countdownInterval);
        // Start the race after countdown
        setIsRunning(true);
        isRunningRef.current = true;
      }
    }, 1000);
  }, [playerData]);

  useEffect(() => {
    return () => {
      clearFinishTimer();
    };
  }, []);

  useEffect(() => {
    if (!isRunning || phase !== 'racing') {
      isRunningRef.current = false;
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    isRunningRef.current = true;
    const loop = (time) => {
      if (!engineRef.current) return;
      if (!lastRef.current) lastRef.current = time;

      accRef.current += ((time - lastRef.current) / 1000) * speedMultiplier;
      lastRef.current = time;
      accRef.current = Math.min(accRef.current, 0.25);

      let nextFrame = frameRef.current;
      while (accRef.current >= DT) {
        nextFrame = engineRef.current.step(DT);
        accRef.current -= DT;
      }

      if (nextFrame) {
        frameRef.current = nextFrame;
        setFrame(nextFrame);

        // Update finish order continuously as racers finish
        if (nextFrame.isFinished) {
          const ordered = [...nextFrame.lanes]
            .filter((lane) => lane.finished)
            .sort((a, b) => a.place - b.place);
          setFinishOrder(ordered);

          // Stop race and show results immediately
          if (!finishTimerRef.current) {
            finishTimerRef.current = true; // Mark as finished to prevent re-triggering
            setIsRunning(false);
            isRunningRef.current = false;
            handleRaceFinish(ordered);
          }
        }
      }

      if (isRunningRef.current) {
        rafRef.current = requestAnimationFrame(loop);
      }
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [isRunning, speedMultiplier, phase]);

  const handleRaceFinish = async (finishOrder) => {
    if (!playerData || !selectedTrack || !frameRef.current) return;

    // Find player's placement
    const playerFinish = finishOrder.find(racer => racer.id === 'player');
    if (!playerFinish) return;

    const place = playerFinish.place;
    const raceTime = frameRef.current.t; // Get race time from frame

    // Build opponents data
    const opponents = finishOrder
      .filter(racer => racer.id !== 'player')
      .map(racer => ({
        name: racer.name,
        place: racer.place,
      }));

    // Submit race result using hook
    try {
      const result = await submitRace({
        place,
        totalRacers: finishOrder.length,
        trackId: selectedTrack.id,
        raceTime,
        opponents,
      });

      if (result) {
        setEloGained(result.eloChange);
        setPointsEarned(result.pointsEarned);
      }
      setPhase('finished');
    } catch (error) {
      console.error('Failed to submit race result:', error);
      setPhase('finished');
    }
  };

  const handleRaceAgain = useCallback(() => {
    setPhase('matchmaking');
    setEngineBundle(null);
    setFrame(null);
    setFinishOrder([]);
    setEloGained(null);
    setPointsEarned(null);
    setCountdown(null);
    setIsRunning(false);
    isRunningRef.current = false;
    clearFinishTimer();
    accRef.current = 0;
    lastRef.current = 0;
    engineRef.current = null;
  }, []);

  const handleReturnHome = useCallback(() => {
    window.location.href = '/';
  }, []);

  const leaderSnapshot = useMemo(() => {
    if (!frame || !engineBundle) return null;
    const leader = frame.lanes.reduce(
      (acc, lane) => (lane.distance > acc.distance ? lane : acc),
      frame.lanes[0]
    );
    const sample = sampleTrackAt(engineBundle.geometry, leader.distance);
    return { leader, sample };
  }, [frame, engineBundle]);

  if (phase === 'loading') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        <span className="text-sm font-medium">Loading...</span>
      </main>
    );
  }

  if (phase === 'error') {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="w-full max-w-md space-y-6 text-center">
          <div className="rounded-3xl border-2 border-red-200 bg-white p-8 shadow-lg">
            <div className="mb-4 text-6xl">😕</div>
            <h2 className="text-2xl font-bold text-slate-800">Unable to Load Race</h2>
            <p className="mt-3 text-sm text-slate-600">
              You need to create a character first before racing.
            </p>
          </div>
          <a
            href="/"
            className="block w-full rounded-3xl border-2 border-slate-200 bg-white px-8 py-4 text-center text-lg font-bold text-slate-600 shadow-md transition hover:bg-slate-50"
          >
            ← Go to Home
          </a>
        </div>
      </main>
    );
  }

  if (phase === 'matchmaking') {
    return (
      <RaceMatchmaking
        playerData={playerData}
        onRaceStart={handleRaceStart}
        selectedTrackData={selectedTrack}
      />
    );
  }

  if ((phase === 'racing' || phase === 'finished') && engineBundle && frame) {
    return (
      <main className="flex h-screen w-screen flex-col overflow-hidden bg-white p-4">
        <div className="relative flex-1 overflow-hidden rounded-3xl border-4 border-slate-200 shadow-2xl">
          <RaceStage
            geometry={engineBundle.geometry}
            frame={frame}
            cameraSpan={cameraSpan}
            isFinished={frame.isFinished && finishOrder.length > 0}
            finishOrder={finishOrder}
            eloGained={eloGained}
            pointsEarned={pointsEarned}
            onReturnHome={handleReturnHome}
            onRaceAgain={handleRaceAgain}
          />

          {/* Countdown Overlay */}
          {countdown !== null && (
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-center">
                <div className="animate-[scale_1s_ease-out] text-[12rem] font-black text-white drop-shadow-2xl" style={{ textShadow: '0 0 40px rgba(168, 85, 247, 0.8)' }}>
                  {countdown}
                </div>
                <p className="mt-4 text-4xl font-bold text-white drop-shadow-lg">
                  Get Ready!
                </p>
              </div>
            </div>
          )}

          {/* Race Controls - Hide when finished */}
          {!finishOrder.length && (
            <div className="pointer-events-auto absolute bottom-4 left-1/2 z-40 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full border-2 border-slate-200 bg-white/90 px-4 py-2 shadow-lg backdrop-blur-md">
              <button
                type="button"
                onClick={() => setIsRunning((prev) => !prev)}
                className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:from-purple-600 hover:to-pink-600"
              >
                {isRunning ? 'Pause' : 'Resume'}
              </button>
              <button
                type="button"
                onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : 1))}
                className={`rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-md transition ${
                  speedMultiplier === 2
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                    : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                }`}
              >
                {speedMultiplier}x
              </button>
              <a
                href="/"
                className="rounded-full bg-gradient-to-r from-red-500 to-rose-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:from-red-600 hover:to-rose-600"
              >
                Forfeit
              </a>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                Zoom
                <input
                  type="range"
                  min={300}
                  max={800}
                  step={20}
                  value={cameraSpan}
                  onChange={(event) => setCameraSpan(Number(event.target.value))}
                  className="w-20"
                />
              </label>
            </div>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
      <span className="text-sm font-medium">Initializing race...</span>
    </main>
  );
}
