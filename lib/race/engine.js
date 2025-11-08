import { createPhysicsState, stepPhysics } from './physics.js';
import { sampleTrackAt } from './geometry.js';

export async function createRaceEngine(racers, track, cfg = {}, balance) {
  if (!track || !Array.isArray(track.controlPoints)) {
    throw new Error('track.controlPoints is required');
  }

  const seed = cfg.seed ?? 1337;
  const physicsState = await createPhysicsState({
    track,
    racers,
    seed,
    balance,
  });

  const state = {
    t: 0,
    physics: physicsState,
  };

  function step(dt) {
    state.t += dt;
    const events = [];

    const preFinishedMap = new Map();
    physicsState.racers.forEach((racerState) => {
      preFinishedMap.set(racerState.id, racerState.finished);
    });

    stepPhysics(physicsState, dt);

    physicsState.racers.forEach((racerState) => {
      if (racerState.zoneJustChanged) {
        events.push({
          t: state.t,
          racerId: racerState.id,
          kind: 'zone:enter',
          zone: racerState.zone,
        });
      }
      if (racerState.burstJustStarted) {
        events.push({
          t: state.t,
          racerId: racerState.id,
          kind: 'hyperburst:start',
        });
      }
      if (racerState.burstJustEnded) {
        events.push({
          t: state.t,
          racerId: racerState.id,
          kind: 'hyperburst:end',
        });
      }
      const wasFinished = preFinishedMap.get(racerState.id);
      if (!wasFinished && racerState.finished) {
        events.push({
          t: state.t,
          racerId: racerState.id,
          kind: 'finish',
          place: racerState.place,
        });
      }
    });

    const lanes = physicsState.racers.map((racerState) => {
      const projection = sampleTrackAt(
        physicsState.geometry,
        racerState.distance,
      );
      return {
        id: racerState.id,
        name: racerState.name,
        tint: racerState.tint,
        x: racerState.position?.x ?? projection.x,
        y: racerState.position?.y ?? projection.y,
        tangent: projection.tangent,
        curvature: projection.curvature,
        distance: racerState.distance,
        progress: racerState.progress,
        velocity: racerState.speed,
        velocityVec: racerState.velocityVec,
        zone: racerState.zone,
        hyperburst: racerState.burstActive,
        finished: racerState.finished,
        place: racerState.place,
        heading: racerState.heading,
      };
    });

    return {
      t: state.t,
      totalLength: physicsState.totalLength,
      lanes,
      events,
      isFinished: physicsState.placements.length === lanes.length,
    };
  }

  return {
    step,
    totalLength: physicsState.totalLength,
    track: physicsState.geometry,
  };
}

