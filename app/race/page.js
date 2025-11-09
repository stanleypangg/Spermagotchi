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
  const [cameraSpan, setCameraSpan] = useState(220);

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

      accRef.current += (time - lastRef.current) / 1000;
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
        if (nextFrame.isFinished && !finishTimerRef.current) {
          const ordered = [...nextFrame.lanes]
            .filter((lane) => lane.finished)
            .sort((a, b) => a.place - b.place);
          setFinishOrder(ordered);
          finishTimerRef.current = setTimeout(() => {
            finishTimerRef.current = null;
            setIsRunning(false);
            isRunningRef.current = false;
          }, FINISH_WIND_DOWN_MS);
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
  }, [isRunning]);

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
    <main className="flex min-h-screen flex-col gap-8 bg-slate-100 px-4 pb-16 pt-6 md:px-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-800">Race Lab</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Watch your swimmer take on tight bends and microlab currents. Camera
          tracks the lead racer while edge pips show anyone off-screen.
        </p>
      </header>

      <section className="flex flex-col gap-4 rounded-3xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur">
        <RaceStage
          geometry={engineBundle.geometry}
          frame={frame}
          cameraSpan={cameraSpan}
          height={500}
        />

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (finishOrder.length) {
                handleReset();
              } else {
                setIsRunning((prev) => !prev);
              }
            }}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-md transition hover:bg-slate-700"
          >
            {finishOrder.length
              ? 'Replay Race'
              : isRunning
              ? 'Pause'
              : 'Resume'}
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-200"
          >
            Reset Race
          </button>
          <label className="ml-auto flex items-center gap-2 text-xs font-semibold text-slate-500">
            Camera span
            <input
              type="range"
              min={140}
              max={360}
              step={10}
              value={cameraSpan}
              onChange={(event) => setCameraSpan(Number(event.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-3xl border border-white/50 bg-white/90 p-4 shadow-sm backdrop-blur md:grid-cols-[2fr_1fr]">
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Live Telemetry
          </h2>
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-700 md:grid-cols-3">
            <div className="rounded-xl bg-white/70 p-3 shadow-sm">
              <dt className="text-xs uppercase text-slate-400">Race Time</dt>
              <dd className="text-lg font-semibold text-slate-800">
                {frame.t.toFixed(2)} s
              </dd>
            </div>
            {leaderSnapshot && (
              <>
                <div className="rounded-xl bg-white/70 p-3 shadow-sm">
                  <dt className="text-xs uppercase text-slate-400">Leader</dt>
                  <dd className="text-lg font-semibold text-slate-800">
                    {leaderSnapshot.leader.name}
                  </dd>
                </div>
                <div className="rounded-xl bg-white/70 p-3 shadow-sm">
                  <dt className="text-xs uppercase text-slate-400">Zone</dt>
                  <dd className="text-lg font-semibold text-slate-800 capitalize">
                    {leaderSnapshot.leader.zone}
                  </dd>
                </div>
              </>
            )}
            <div className="rounded-xl bg-white/70 p-3 shadow-sm">
              <dt className="text-xs uppercase text-slate-400">Completion</dt>
              <dd className="text-lg font-semibold text-slate-800">
                {(Math.max(
                  ...frame.lanes.map((lane) => lane.progress),
                ) * 100).toFixed(1)}
                %
              </dd>
            </div>
            {leaderSnapshot && (
              <div className="rounded-xl bg-white/70 p-3 shadow-sm">
                <dt className="text-xs uppercase text-slate-400">
                  Curve Stress
                </dt>
                <dd className="text-lg font-semibold text-slate-800">
                  {(leaderSnapshot.sample.curvature * 500).toFixed(2)}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-4">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Finish Order
          </h2>
          <ol className="mt-3 space-y-2 text-sm">
            {frame.lanes
              .slice()
              .sort((a, b) => {
                if (a.finished && b.finished) return a.place - b.place;
                if (a.finished) return -1;
                if (b.finished) return 1;
                return b.distance - a.distance;
              })
              .map((lane) => (
                <li
                  key={lane.id}
                  className="flex items-center justify-between rounded-xl bg-white/80 px-3 py-2 shadow-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                      style={{ backgroundColor: lane.tint }}
                    >
                      {lane.place ?? '—'}
                    </span>
                    <span className="font-semibold text-slate-700">
                      {lane.name}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500">
                    {Math.round(lane.progress * 100)}% ·{' '}
                    {lane.zone.toUpperCase()}
                  </div>
                </li>
              ))}
          </ol>
        </div>
      </section>
    </main>
  );
}


