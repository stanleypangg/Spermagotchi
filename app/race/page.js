'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import RaceStage from '@/app/components/RaceStage';
import { createRaceEngine } from '@/lib/race/engine';
import { sampleTrackAt, trackBounds } from '@/lib/race/geometry';
import { initRapier } from '@/lib/race/physics';
import {
  MOCK_BALANCE,
  MOCK_RACERS,
  MOCK_TRACK,
  MOCK_SEED,
} from '@/app/data/mockRace';

const DT = 1 / 60;
const FINISH_WIND_DOWN_MS = 1500;

export default function RacePage() {
  const [engineBundle, setEngineBundle] = useState(null);
  const [frame, setFrame] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [finishOrder, setFinishOrder] = useState([]);
  const [cameraSpan, setCameraSpan] = useState(400);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);

  const engineRef = useRef(null);
  const rafRef = useRef(null);
  const accRef = useRef(0);
  const lastRef = useRef(0);
  const isRunningRef = useRef(false);
  const frameRef = useRef(null);
  const finishTimerRef = useRef(null);

  const clearFinishTimer = () => {
    if (finishTimerRef.current) {
      clearTimeout(finishTimerRef.current);
      finishTimerRef.current = null;
    }
  };

  const bootEngine = useMemo(
    () => async () =>
      createRaceEngine(
        MOCK_RACERS,
        MOCK_TRACK,
        { seed: MOCK_SEED },
        MOCK_BALANCE,
      ),
    [],
  );

  useEffect(() => {
    let cancelled = false;
    async function prepareEngine() {
      await initRapier();
      if (cancelled) return;
      const engine = await bootEngine();
      if (cancelled) return;
      engineRef.current = engine;
      setEngineBundle({
        engine,
        geometry: engine.track,
        trackMeta: trackBounds(engine.track),
      });
      const initial = engine.step(0);
      frameRef.current = initial;
      setFrame(initial);
      setIsRunning(true);
      isRunningRef.current = true;
    }
    prepareEngine();
    return () => {
      cancelled = true;
    };
  }, [bootEngine]);

  useEffect(
    () => () => {
      clearFinishTimer();
    },
    [],
  );

  useEffect(() => {
    if (!isRunning) {
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
          
          // Start wind-down timer only once
          if (!finishTimerRef.current) {
            finishTimerRef.current = setTimeout(() => {
              finishTimerRef.current = null;
              setIsRunning(false);
              isRunningRef.current = false;
            }, FINISH_WIND_DOWN_MS);
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
  }, [isRunning, speedMultiplier]);

  const handleReset = async () => {
    setIsRunning(false);
    isRunningRef.current = false;
    clearFinishTimer();
    await initRapier();
    const engine = await bootEngine();
    engineRef.current = engine;
    accRef.current = 0;
    lastRef.current = 0;
    const startFrame = engine.step(0);
    frameRef.current = startFrame;
    setFrame(startFrame);
    setFinishOrder([]);
    setEngineBundle({
      engine,
      geometry: engine.track,
      trackMeta: trackBounds(engine.track),
    });
    setIsRunning(true);
    isRunningRef.current = true;
  };

  const leaderSnapshot = useMemo(() => {
    if (!frame || !engineBundle) return null;
    const leader = frame.lanes.reduce(
      (acc, lane) => (lane.distance > acc.distance ? lane : acc),
      frame.lanes[0],
    );
    const sample = sampleTrackAt(engineBundle.geometry, leader.distance);
    return { leader, sample };
  }, [frame, engineBundle]);

  if (!engineBundle || !frame) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-600">
        <span className="text-sm font-medium">Loading race simulation…</span>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-white p-4">
      <div className="relative flex-1 rounded-3xl overflow-hidden shadow-2xl border-4 border-slate-200">
        <RaceStage
          geometry={engineBundle.geometry}
          frame={frame}
          cameraSpan={cameraSpan}
          isFinished={frame.isFinished && finishOrder.length > 0}
          finishOrder={finishOrder}
        />
        
        {/* Return to Main button - only show when race is finished */}
        {frame.isFinished && finishOrder.length > 0 && (
          <div className="pointer-events-auto absolute top-4 left-4 z-50">
            <a
              href="/"
              className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-md border-2 border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 shadow-lg transition hover:bg-slate-50"
            >
              <span>←</span>
              <span>Return to Main</span>
            </a>
          </div>
        )}
        
        <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-wrap items-center justify-center gap-2 bg-white/90 backdrop-blur-md px-4 py-2 rounded-full shadow-lg border-2 border-slate-200">
          <button
            type="button"
            onClick={() => {
              if (finishOrder.length) {
                handleReset();
              } else {
                setIsRunning((prev) => !prev);
              }
            }}
            className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-1.5 text-xs font-bold text-white shadow-md transition hover:from-purple-600 hover:to-pink-600"
          >
            {finishOrder.length
              ? 'Replay'
              : isRunning
              ? 'Pause'
              : 'Resume'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border-2 border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setSpeedMultiplier(prev => prev === 1 ? 2 : 1)}
            className={`rounded-full px-4 py-1.5 text-xs font-bold text-white shadow-md transition ${
              speedMultiplier === 2
                ? 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
            }`}
          >
            {speedMultiplier}x
          </button>
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
      </div>
    </main>
  );
}


