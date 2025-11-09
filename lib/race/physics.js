import {
  createTrackGeometry,
  offsetPolylinePoints,
  projectPointToTrack,
  zoneForProgress,
  sampleTrackAt,
} from './geometry.js';
import {
  baseKinematics,
  clamp,
  deterministicRng,
  eff,
} from './math.js';

let rapierReadyPromise = null;
let RapierModule = null;

export function initRapier() {
  if (RapierModule) {
    return Promise.resolve(RapierModule);
  }
  if (!rapierReadyPromise) {
    rapierReadyPromise = import('@dimforge/rapier2d-compat').then(async (mod) => {
      if (typeof mod.default === 'function') {
        await mod.default();
      } else if (typeof mod.init === 'function') {
        await mod.init();
      }
      RapierModule = mod;
      return RapierModule;
    });
  }
  return rapierReadyPromise;
}

const laneOffsets = [-12, -4, 4, 12];

function buildWallColliders(Rapier, world, polyline, opts = {}) {
  const {
    restitution = 0.05,
    friction = 0.9,
    closed = true,
    runout = 0,
  } = opts;
  const n = polyline.length;
  if (n < 2) return;
  const limit = closed ? n : n - 1;
  for (let i = 0; i < limit; i += 1) {
    const a = polyline[i];
    const b = polyline[(i + 1) % n];
    const collider = Rapier.ColliderDesc.segment(a.x, a.y, b.x, b.y)
      .setRestitution(restitution)
      .setFriction(friction);
    world.createCollider(collider);
  }
  if (!closed && runout > 0 && n >= 2) {
    const normalize = (vx, vy) => {
      const len = Math.hypot(vx, vy) || 1;
      return { x: vx / len, y: vy / len };
    };
    const start = polyline[0];
    const next = polyline[Math.min(1, n - 1)];
    const startDir = normalize(start.x - next.x, start.y - next.y);
    const startFar = {
      x: start.x + startDir.x * runout,
      y: start.y + startDir.y * runout,
    };
    world.createCollider(
      Rapier.ColliderDesc.segment(startFar.x, startFar.y, start.x, start.y)
        .setRestitution(restitution)
        .setFriction(friction),
    );

    const end = polyline[n - 1];
    const prev = polyline[Math.max(n - 2, 0)];
    const endDir = normalize(end.x - prev.x, end.y - prev.y);
    const endFar = {
      x: end.x + endDir.x * runout,
      y: end.y + endDir.y * runout,
    };
    world.createCollider(
      Rapier.ColliderDesc.segment(end.x, end.y, endFar.x, endFar.y)
        .setRestitution(restitution)
        .setFriction(friction),
    );
  }
}

function computeControlParams(stats) {
  const motility = eff(stats.MI);
  const motNorm = motility / 100;
  const linearityNorm = clamp(eff(stats.LQ) / 100, 0.2, 0.95);
  const flow = eff(stats.RE);
  const flowNorm = flow / 100;
  const signals = eff(stats.CS);
  const sigNorm = signals / 100;

  const maxSpeed = 520 + motility * 3.2;
  const thrust = 70 + motility * 0.45;
  const throttleGain = 4.6 + motNorm * 2.4;
  const brakeForce = thrust * 1.22;

  const steerGain = 18 + linearityNorm * 30;
  const steerDamp = 4.5 + linearityNorm * 5;
  const torqueLimit = steerGain * 0.6;

  const lateralGrip = 9 + flowNorm * 8;
  const slipDamp = 2.6 + flowNorm * 2.0;

  const drag = 0.55 - flowNorm * 0.08;
  const angularDamping = 6 + linearityNorm * 4.5;
  const wallAssist = 0.08 + flowNorm * 0.08;

  const burstSpeedBonus = 70 + sigNorm * 18;
  const burstDuration = 0.32 + sigNorm * 0.16;
  const burstChance = 0.015 + sigNorm * 0.015;
  const burstCooldown = 0.95 - sigNorm * 0.22;

  return {
    maxSpeed,
    thrust,
    throttleGain,
    brakeForce,
    steerGain,
    steerDamp,
    torqueLimit,
    lateralGrip,
    slipDamp,
    drag,
    angularDamping,
    wallAssist,
    wallFriction: 0.6 + flowNorm * 0.1,
    burstSpeedBonus,
    burstDuration,
    burstChance,
    burstCooldown: Math.max(0.35, burstCooldown),
    flowNorm,
    sigNorm,
    linearityNorm,
  };
}

export async function createPhysicsState({ track, racers, seed, balance }) {
  const Rapier = await initRapier();
  const world = new Rapier.World({ x: 0, y: 0 });
  const geometry = createTrackGeometry(track, { resolution: 24 });
  const halfWidth = (geometry.width ?? 80) / 2;
  const outer = offsetPolylinePoints(geometry, halfWidth);
  const inner = offsetPolylinePoints(geometry, -halfWidth);
  const baseWidth = Math.max(geometry.width ?? 80, 80);
  const wallRunout = (geometry.closed !== false) ? 0 : baseWidth * 3.2;

  const checkpointSpacing = Math.max(180, geometry.totalLength / 30);
  const checkpoints = [];
  for (let dist = 0; dist < geometry.totalLength; dist += checkpointSpacing) {
    checkpoints.push({ distance: dist });
  }
  if (checkpoints[checkpoints.length - 1]?.distance !== geometry.totalLength) {
    checkpoints.push({ distance: geometry.totalLength });
  }

  const closed = geometry.closed !== false;

  buildWallColliders(Rapier, world, outer, {
    friction: 0.95,
    restitution: 0,
    closed,
    runout: closed ? 0 : wallRunout,
  });
  buildWallColliders(Rapier, world, inner, {
    friction: 0.95,
    restitution: 0,
    closed,
    runout: closed ? 0 : wallRunout,
  });

  const spawnSample = geometry.samples[2] ?? geometry.samples[0];
  const spawnNormal = spawnSample?.normal ?? { x: 0, y: -1 };
  const spawnTangent = spawnSample?.tangent ?? { x: 1, y: 0 };

  const rng = deterministicRng(seed ?? 1337);

  const racerStates = racers.map((racer, idx) => {
    const params = computeControlParams(racer.stats);
    const base = baseKinematics(racer.stats);
    const offset = laneOffsets[idx % laneOffsets.length] ?? 0;
    const spawnX = (spawnSample?.x ?? 0) + spawnNormal.x * offset;
    const spawnY = (spawnSample?.y ?? 0) + spawnNormal.y * offset;
    const bodyDesc = Rapier.RigidBodyDesc.dynamic()
      .setTranslation(spawnX, spawnY)
      .setRotation(Math.atan2(spawnTangent.y, spawnTangent.x))
      .setLinearDamping(params.drag)
      .setAngularDamping(params.angularDamping)
      .setCcdEnabled(true)
      .setCanSleep(false);
    const body = world.createRigidBody(bodyDesc);
    const colliderDesc = Rapier.ColliderDesc.capsule(0.5, 1.8)
      .setDensity(0.45)
      .setFriction(params.wallFriction)
      .setRestitution(0.05);
    world.createCollider(colliderDesc, body);

    return {
      id: racer.id,
      name: racer.name,
      tint: racer.tint,
      sprite: racer.sprite ?? '/neutral.png',
      stats: racer.stats,
      params,
      base,
      bodyHandle: body.handle,
      hyperburstTimer: 0,
      nextBurstCheck: 0,
      burstCooldownTimer: 0,
      zone: 'flow',
      distance: 0,
      progress: 0,
      finished: false,
      place: null,
      lastZone: 'flow',
      burstActive: false,
      checkpointIndex: 0,
      finishHold: 0,
      finishingTimer: 0,
      parked: false,
      offsetFromCenter: 0,
      maxDistance: 0,
      finishGlide: null,
      finishOffset: 0,
      finishParked: false,
      finishAnimationDone: false,
    };
  });

  return {
    Rapier,
    world,
    geometry,
    checkpoints,
    racers: racerStates,
    rng,
    placements: [],
    totalLength: geometry.totalLength,
    finishBuffer: Math.max(42, (geometry.width ?? 80) * 0.7),
    balance,
    finishRunout: wallRunout || baseWidth * 2.4,
    postFinishHold: 1.2,
  };
}

function normalizeAngle(angle) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function applyControls(state, racerState, dt, context) {
  const { world, geometry, rng } = state;
  const { leaderDistance, catchupThreshold, leaderFinished } = context;
  const body = world.getRigidBody(racerState.bodyHandle);
  if (!body) return;

  const translation = body.translation();
  const velocity = body.linvel();
  const angle = body.rotation();

  const projection = projectPointToTrack(geometry, translation);
  const progressForZone = clamp(
    racerState.distance / state.totalLength,
    0,
    0.9999,
  );

  let zone = zoneForProgress(geometry, progressForZone);
  if (!zone) zone = 'flow';
  if (zone !== racerState.zone) {
    racerState.lastZone = racerState.zone;
    racerState.zone = zone;
    racerState.zoneJustChanged = true;
  }

  const params = racerState.params;
  const tangent = projection.sample.tangent ?? { x: 1, y: 0 };
  const normal = { x: -tangent.y, y: tangent.x };
  const forwardVec = { x: Math.cos(angle), y: Math.sin(angle) };
  const laneHalfWidth = Math.max(6, (state.geometry.width ?? 80) * 0.5 - 3.5);
  const deltaX = translation.x - projection.sample.x;
  const deltaY = translation.y - projection.sample.y;
  const offsetFromCenter = deltaX * normal.x + deltaY * normal.y;
  const clampedOffset = clamp(
    offsetFromCenter,
    -laneHalfWidth * 0.9,
    laneHalfWidth * 0.9,
  );
  racerState.offsetFromCenter = clampedOffset;

  if (racerState.finished) {
    const glide = racerState.finishGlide;
    const origin = glide?.origin ?? sampleTrackAt(geometry, state.totalLength);
    const finishTangent = glide?.tangent ?? { x: 1, y: 0 };
    const finishNormal = glide?.normal ?? { x: -finishTangent.y, y: finishTangent.x };
    const totalDistance = Math.max(
      1,
      glide?.distance ?? state.finishRunout ?? 180,
    );
    const finishOffset =
      racerState.finishOffset ?? racerState.offsetFromCenter ?? clampedOffset;
    const prevDistance = clamp(glide?.distanceTravelled ?? 0, 0, totalDistance);
    const progress = totalDistance > 0 ? prevDistance / totalDistance : 1;
    const baseSpeed = Math.max(glide?.initialSpeed ?? 0, 0);
    const minSpeed = Math.max(glide?.minSpeed ?? 0, 0);
    const lastSpeed = Math.max(glide?.lastSpeed ?? baseSpeed, 0);
    const smoothFactor = Math.pow(Math.max(0, 1 - progress), 1.75);
    const targetSpeed = Math.max(minSpeed, baseSpeed * smoothFactor);
    const blend = 1 - Math.exp(-dt * 2.4);
    const desiredSpeed = lastSpeed + (targetSpeed - lastSpeed) * blend;
    const stepDistance = Math.max(0, desiredSpeed * dt);
    const remaining = Math.max(0, totalDistance - prevDistance);
    const actualStep = Math.min(remaining, stepDistance);
    const newDistance = prevDistance + actualStep;
    const newProgress = totalDistance > 0 ? newDistance / totalDistance : 1;

    body.setTranslation(
      {
        x:
          origin.x +
          finishNormal.x * finishOffset +
          finishTangent.x * newDistance,
        y:
          origin.y +
          finishNormal.y * finishOffset +
          finishTangent.y * newDistance,
      },
      true,
    );

    const actualSpeed = dt > 0 ? actualStep / dt : 0;
    body.setLinvel(
      {
        x: finishTangent.x * actualSpeed,
        y: finishTangent.y * actualSpeed,
      },
      true,
    );
    body.setAngvel(0, true);

    const duration = glide?.duration ?? 1.4;
    racerState.finishingTimer = Math.min(
      duration,
      newProgress * duration,
    );

    if (!racerState.parked && newProgress >= 0.999) {
      racerState.parked = true;
      body.setLinvel({ x: 0, y: 0 }, true);
      body.setAngvel(0, true);
    }
    if (newProgress >= 1) {
      racerState.finishAnimationDone = true;
    }

    racerState.finishGlide = {
      ...glide,
      distanceTravelled: newDistance,
      lastSpeed: actualSpeed,
    };
    return;
  }

  const speedForward = velocity.x * forwardVec.x + velocity.y * forwardVec.y;
  const lateralSpeed = velocity.x * normal.x + velocity.y * normal.y;
  const desiredHeading = Math.atan2(tangent.y, tangent.x);
  const angleError = normalizeAngle(desiredHeading - angle);

  let zoneSpeedFactor = 1;
  if (zone === 'flow') {
    zoneSpeedFactor += 0.04 * params.flowNorm;
  } else if (zone === 'gradient') {
    zoneSpeedFactor += 0.03 * params.sigNorm;
  } else if (zone === 'viscous') {
    zoneSpeedFactor -= 0.08 * (1 - params.flowNorm);
  }
  zoneSpeedFactor = Math.max(0.82, zoneSpeedFactor);

  let zoneGripFactor = 1;
  if (zone === 'viscous') {
    zoneGripFactor += 0.12 * params.flowNorm;
  }

  let targetMaxSpeed =
    Math.max(10, params.maxSpeed * zoneSpeedFactor) +
    (racerState.burstActive ? params.burstSpeedBonus : 0);
  const remainingDistance = Math.max(0, state.totalLength - racerState.distance);
  const slowdownRange = Math.max(state.finishBuffer * 3.2, 80);
  const finishEaseZone = Math.max(state.finishBuffer * 1.5, 90);
  if (remainingDistance < slowdownRange) {
    const ramp = clamp(remainingDistance / slowdownRange, 0, 1);
    const slowFloor = params.maxSpeed * 0.55;
    const capped =
      slowFloor + ramp * (params.maxSpeed - slowFloor);
    targetMaxSpeed = Math.min(targetMaxSpeed, capped);
  }

  if (racerState.burstActive) {
    racerState.hyperburstTimer -= dt;
    if (racerState.hyperburstTimer <= 0) {
      racerState.burstActive = false;
      racerState.burstJustEnded = true;
      racerState.burstCooldownTimer = params.burstCooldown;
    }
  } else {
    if (racerState.burstCooldownTimer > 0) {
      racerState.burstCooldownTimer = Math.max(
        0,
        racerState.burstCooldownTimer - dt,
      );
    } else {
      racerState.nextBurstCheck -= dt;
      if (racerState.nextBurstCheck <= 0) {
        racerState.nextBurstCheck = params.burstCooldown * 0.6;
        if (rng() < params.burstChance) {
          racerState.hyperburstTimer = params.burstDuration;
          racerState.burstActive = true;
          racerState.burstJustStarted = true;
        }
      }
    }
  }

  const severeAngle = Math.abs(angleError) > Math.PI / 2;
  let throttleError = targetMaxSpeed - speedForward;
  if (severeAngle) {
    throttleError = Math.min(throttleError, params.thrust * 0.25);
  }
  let forwardAccel = throttleError * params.throttleGain;
  forwardAccel = clamp(forwardAccel, -params.brakeForce, params.thrust);

  if (speedForward < -6) {
    forwardAccel += params.thrust * 1.6;
  } else if (speedForward < -2) {
    forwardAccel += params.thrust * 0.7;
  } else if (speedForward < 1) {
    forwardAccel += params.thrust * 0.4;
  }

  const gapToLeader = leaderDistance - racerState.distance;
  if (gapToLeader > catchupThreshold && remainingDistance > finishEaseZone) {
    const gain =
      params.thrust * 0.4 + Math.min(300, gapToLeader) * 0.03;
    forwardAccel += gain;
  }

  const assistReach = Math.max(state.finishRunout ?? 0, 280);
  if (
    !racerState.finished &&
    leaderFinished &&
    remainingDistance < assistReach &&
    remainingDistance > state.finishBuffer * 0.6
  ) {
    const urgency = clamp((assistReach - remainingDistance) / assistReach, 0, 1);
    const taper = clamp(
      (remainingDistance - state.finishBuffer * 0.6) /
        Math.max(assistReach - state.finishBuffer * 0.6, 1),
      0,
      1,
    );
    if (speedForward < targetMaxSpeed * 0.4 && taper > 0) {
      forwardAccel += params.thrust * (0.25 + 0.55 * urgency * taper);
    }
  }

  const forwardForce = {
    x: tangent.x * forwardAccel,
    y: tangent.y * forwardAccel,
  };

  if (speedForward > targetMaxSpeed * 1.15) {
    const brake = (speedForward - targetMaxSpeed) * params.brakeForce * 0.35;
    forwardForce.x -= forwardVec.x * brake;
    forwardForce.y -= forwardVec.y * brake;
  }

  const lateralForceMag =
    (-lateralSpeed * params.lateralGrip - lateralSpeed * params.slipDamp) *
    zoneGripFactor;
  const lateralForce = {
    x: normal.x * lateralForceMag,
    y: normal.y * lateralForceMag,
  };

  const torque = clamp(
    angleError * params.steerGain - body.angvel() * params.steerDamp,
    -params.torqueLimit,
    params.torqueLimit,
  );

  if (Math.abs(offsetFromCenter) > laneHalfWidth) {
    const correction =
      -Math.sign(offsetFromCenter) *
      (Math.abs(offsetFromCenter) - laneHalfWidth) *
      params.wallAssist;
    forwardForce.x += normal.x * correction;
    forwardForce.y += normal.y * correction;

    if (Math.abs(offsetFromCenter) > laneHalfWidth * 1.15) {
      const clamped = sampleTrackAt(geometry, racerState.distance);
      body.setTranslation(
        {
          x: clamped.x + normal.x * clampedOffset,
          y: clamped.y + normal.y * clampedOffset,
        },
        true,
      );
      const clippedVel = body.linvel();
      body.setLinvel({ x: clippedVel.x * 0.25, y: clippedVel.y * 0.25 }, true);
    }
  }

  body.addForce(forwardForce, true);
  body.addForce(lateralForce, true);
  body.addTorque(torque, true);
}

export function stepPhysics(state, dt) {
  state.world.integrationParameters.dt = dt;
  const leaderDistance = state.racers.reduce(
    (max, racer) => Math.max(max, racer.distance),
    0,
  );
  const catchupThreshold = Math.max(140, state.totalLength * 0.04);
  const leaderFinished = state.placements.length > 0;
  state.racers.forEach((racerState) => {
    racerState.burstJustStarted = false;
    racerState.burstJustEnded = false;
    racerState.zoneJustChanged = false;
    racerState.collisionEvents = [];
    racerState.overtakeEvents = [];
    racerState.lastDistance = racerState.distance || 0;
    applyControls(state, racerState, dt, {
      leaderDistance,
      catchupThreshold,
      leaderFinished,
    });
  });
  state.world.step();

  // Detect collisions between racers
  const collisionThreshold = 12; // Distance threshold for collision detection
  for (let i = 0; i < state.racers.length; i++) {
    for (let j = i + 1; j < state.racers.length; j++) {
      const racer1 = state.racers[i];
      const racer2 = state.racers[j];
      
      if (racer1.finished || racer2.finished) continue;
      
      const body1 = state.world.getRigidBody(racer1.bodyHandle);
      const body2 = state.world.getRigidBody(racer2.bodyHandle);
      
      if (!body1 || !body2) continue;
      
      const pos1 = body1.translation();
      const pos2 = body2.translation();
      
      const dx = pos2.x - pos1.x;
      const dy = pos2.y - pos1.y;
      const distance = Math.hypot(dx, dy);
      
      if (distance < collisionThreshold) {
        // Check if this collision is new (wasn't happening last frame)
        const lastCollisionKey = `${racer1.id}-${racer2.id}`;
        const wasColliding = state.recentCollisions?.has(lastCollisionKey);
        
        if (!wasColliding) {
          racer1.collisionEvents.push({ 
            otherRacer: racer2,
            isAggressor: racer1.distance > racer2.distance,
          });
          racer2.collisionEvents.push({ 
            otherRacer: racer1,
            isAggressor: racer2.distance > racer1.distance,
          });
          
          // Track this collision
          if (!state.recentCollisions) state.recentCollisions = new Set();
          state.recentCollisions.add(lastCollisionKey);
          
          // Clear it after a short delay
          setTimeout(() => {
            state.recentCollisions?.delete(lastCollisionKey);
          }, 500);
        }
      }
    }
  }

  state.racers.forEach((racerState) => {
    const body = state.world.getRigidBody(racerState.bodyHandle);
    if (!body) {
      return;
    }
    const translation = body.translation();
    const velocity = body.linvel();
    const projection = projectPointToTrack(state.geometry, translation);
    const forwardAdvance =
      (velocity.x * projection.sample.tangent.x +
        velocity.y * projection.sample.tangent.y) *
      dt;
    const prevMaxDistance = racerState.maxDistance ?? 0;
    let nextDistance = clamp(
      racerState.distance + forwardAdvance,
      0,
      state.totalLength,
    );
    const fallbackWindow = Math.max(120, state.totalLength * 0.01);
    if (nextDistance < prevMaxDistance - fallbackWindow) {
      nextDistance = Math.max(0, prevMaxDistance - fallbackWindow);
      const snapSample = sampleTrackAt(
        state.geometry,
        nextDistance,
      );
      const snapNormal = {
        x: -snapSample.tangent.y,
        y: snapSample.tangent.x,
      };
      body.setTranslation(
        {
          x: snapSample.x + snapNormal.x * racerState.offsetFromCenter,
          y: snapSample.y + snapNormal.y * racerState.offsetFromCenter,
        },
        true,
      );
      const vel = body.linvel();
      body.setLinvel({ x: vel.x * 0.5, y: vel.y * 0.5 }, true);
    }
    racerState.distance = nextDistance;
    racerState.maxDistance = Math.max(prevMaxDistance, nextDistance);
    const assistWindow = Math.max(
      state.finishBuffer * 8,
      state.totalLength * 0.012,
      160,
    );
    if (
      !racerState.finished &&
      state.placements.length > 0 &&
      racerState.distance > state.totalLength - assistWindow
    ) {
      const remaining = state.totalLength - racerState.distance;
      if (remaining > 0) {
        const normalized = clamp(remaining / assistWindow, 0, 1);
        const assistGain = clamp(
          dt * 3.2 * normalized * normalized,
          0,
          0.45 * normalized,
        );
        const assist = remaining * assistGain;
        if (assist > 0.01) {
          racerState.distance = Math.min(
            state.totalLength,
            racerState.distance + assist,
          );
          racerState.maxDistance = Math.max(
            racerState.maxDistance,
            racerState.distance,
          );
          const assistSample = sampleTrackAt(
            state.geometry,
            racerState.distance,
          );
          const assistNormal = {
            x: -assistSample.tangent.y,
            y: assistSample.tangent.x,
          };
          body.setTranslation(
            {
              x:
                assistSample.x +
                assistNormal.x * racerState.offsetFromCenter,
              y:
                assistSample.y +
                assistNormal.y * racerState.offsetFromCenter,
            },
            true,
          );
        }
      }
    }
    const trackSample = sampleTrackAt(state.geometry, racerState.distance);
    const checkpoints = state.checkpoints;
    while (
      racerState.checkpointIndex < checkpoints.length - 1 &&
      racerState.distance >=
        checkpoints[racerState.checkpointIndex + 1].distance
    ) {
      racerState.checkpointIndex += 1;
    }
    const prevCheckpoint = checkpoints[racerState.checkpointIndex];
    const nextCheckpoint =
      checkpoints[Math.min(racerState.checkpointIndex + 1, checkpoints.length - 1)];
    const segmentSpan = Math.max(
      1,
      nextCheckpoint.distance - prevCheckpoint.distance,
    );
    const segmentProgress = clamp(
      (racerState.distance - prevCheckpoint.distance) / segmentSpan,
      0,
      1,
    );
    racerState.progress = clamp(
      (racerState.checkpointIndex + segmentProgress) /
        Math.max(1, checkpoints.length - 1),
      0,
      1,
    );
    const finalTranslation = body.translation();
    const finalVelocity = body.linvel();

    racerState.position = { x: finalTranslation.x, y: finalTranslation.y };
    racerState.velocityVec = { x: finalVelocity.x, y: finalVelocity.y };
    racerState.speed = racerState.finished
      ? 0
      : Math.hypot(finalVelocity.x, finalVelocity.y);
    racerState.heading = body.rotation();
    racerState.tangent = trackSample.tangent;
    racerState.normal = { x: -trackSample.tangent.y, y: trackSample.tangent.x };
    racerState.curvature = trackSample.curvature;
    const zone = zoneForProgress(state.geometry, racerState.progress);
    if (zone !== racerState.zone) {
      racerState.lastZone = racerState.zone;
      racerState.zone = zone;
      racerState.zoneJustChanged = true;
    }

    if (racerState.finished) {
      racerState.distance = state.totalLength;
    } else if (
      !racerState.finished &&
      racerState.distance >= state.totalLength - state.finishBuffer
    ) {
      racerState.finishHold += dt;
      if (racerState.finishHold >= 0.25) {
        racerState.finished = true;
        racerState.place = state.placements.length + 1;
        state.placements.push(racerState.id);
        racerState.progress = 1;
        racerState.finishingTimer = 0;
        racerState.parked = false;
        racerState.finishAnimationDone = false;
        racerState.finishOffset = racerState.offsetFromCenter;
        const finishSample = sampleTrackAt(state.geometry, state.totalLength);
        const finishTangent = finishSample.tangent ?? { x: 1, y: 0 };
        const finishNormal = { x: -finishTangent.y, y: finishTangent.x };
        const glideDistance =
          state.finishRunout ?? Math.max(state.geometry.width ?? 80, 80) * 2;
        const duration = 1.2;
        const settleBody = state.world.getRigidBody(racerState.bodyHandle);
        const anchorBase = {
          x: finishSample.x + finishNormal.x * racerState.finishOffset,
          y: finishSample.y + finishNormal.y * racerState.finishOffset,
        };
        const diffX = translation.x - anchorBase.x;
        const diffY = translation.y - anchorBase.y;
        let startDistance = diffX * finishTangent.x + diffY * finishTangent.y;
        if (!Number.isFinite(startDistance)) {
          startDistance = 0;
        }
        startDistance = clamp(startDistance, 0, Math.max(glideDistance, 1));
        let initialForward = 0;
        let initialVelocity = {
          x: finishTangent.x * initialForward,
          y: finishTangent.y * initialForward,
        };
        if (settleBody) {
          const lv = settleBody.linvel();
          initialForward = lv.x * finishTangent.x + lv.y * finishTangent.y;
          if (!Number.isFinite(initialForward)) {
            initialForward = 0;
          }
          initialForward = Math.max(0, initialForward);
          const speedMag = Math.hypot(lv.x, lv.y);
          if (speedMag > 0.05) {
            initialVelocity = { x: lv.x, y: lv.y };
          } else {
            initialVelocity = {
              x: finishTangent.x * initialForward,
              y: finishTangent.y * initialForward,
            };
          }
          settleBody.setLinvel(initialVelocity, true);
          settleBody.setAngvel(0, true);
        }
        const initialSpeed = Math.min(
          Math.max(Math.hypot(initialVelocity.x, initialVelocity.y), 0),
          80,
        );
        const rawMinSpeed = Math.min(initialSpeed * 0.35, 6);
        const minSpeed = Math.min(initialSpeed, Math.max(0.2, rawMinSpeed));
        racerState.finishGlide = {
          origin: finishSample,
          tangent: finishTangent,
          normal: finishNormal,
          distance: glideDistance,
          duration,
          initialSpeed,
          minSpeed,
          initialVelocity,
          distanceTravelled: startDistance,
          lastSpeed: initialSpeed,
          sprite: racerState.sprite,
        };
      }
    } else if (!racerState.finished) {
      racerState.finishHold = 0;
    }
  });
}


