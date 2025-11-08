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
  const { restitution = 0.05, friction = 0.9, closed = true } = opts;
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
  if (!closed) {
    const startA = polyline[0];
    const startB = { x: polyline[0].x, y: polyline[0].y + 60 };
    const endA = polyline[n - 1];
    const endB = { x: polyline[n - 1].x, y: polyline[n - 1].y - 60 };
    world.createCollider(
      Rapier.ColliderDesc.segment(startA.x, startA.y, startB.x, startB.y)
        .setRestitution(restitution)
        .setFriction(friction),
    );
    world.createCollider(
      Rapier.ColliderDesc.segment(endA.x, endA.y, endB.x, endB.y)
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

  const maxSpeed = 140 + motility * 1.2; // units/s (~5–8 m/s)
  const thrust = 28 + motility * 0.22;
  const throttleGain = 2.8 + motNorm * 1.8;
  const brakeForce = thrust * 1.35;

  const steerGain = 14 + linearityNorm * 36;
  const steerDamp = 4 + linearityNorm * 6;
  const torqueLimit = steerGain * 0.65;

  const lateralGrip = 8 + flowNorm * 16;
  const slipDamp = 2.4 + flowNorm * 3.2;

  const drag = 0.75 - flowNorm * 0.12;
  const angularDamping = 6 + linearityNorm * 5;
  const wallAssist = 0.09 + flowNorm * 0.1;

  const burstSpeedBonus = 55 + sigNorm * 35;
  const burstDuration = 0.38 + sigNorm * 0.2;
  const burstChance = 0.018 + sigNorm * 0.02;
  const burstCooldown = 1.1 - sigNorm * 0.32;

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
  const geometry = createTrackGeometry(track, { resolution: 32 });
  const halfWidth = (geometry.width ?? 80) / 2;
  const outer = offsetPolylinePoints(geometry, halfWidth);
  const inner = offsetPolylinePoints(geometry, -halfWidth);

  const checkpointSpacing = Math.max(220, geometry.totalLength / 24);
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
    restitution: 0.05,
    closed,
  });
  buildWallColliders(Rapier, world, inner, {
    friction: 0.95,
    restitution: 0.05,
    closed,
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
    finishBuffer: Math.max(80, geometry.totalLength * 0.02),
    balance,
  };
}

function normalizeAngle(angle) {
  let a = angle;
  while (a > Math.PI) a -= Math.PI * 2;
  while (a < -Math.PI) a += Math.PI * 2;
  return a;
}

function applyControls(state, racerState, dt) {
  const { world, geometry, rng } = state;
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

  if (racerState.finished) {
    body.setLinvel({ x: 0, y: 0 }, true);
    body.setAngvel(0, true);
    return;
  }

  const params = racerState.params;
  const tangent = projection.sample.tangent ?? { x: 1, y: 0 };
  const normal = { x: -tangent.y, y: tangent.x };
  const forwardVec = { x: Math.cos(angle), y: Math.sin(angle) };

  const speedForward = velocity.x * forwardVec.x + velocity.y * forwardVec.y;
  const lateralSpeed = velocity.x * normal.x + velocity.y * normal.y;
  const desiredHeading = Math.atan2(tangent.y, tangent.x);
  const angleError = normalizeAngle(desiredHeading - angle);

  let zoneSpeedFactor = 1;
  if (zone === 'flow') {
    zoneSpeedFactor += 0.1 * params.flowNorm;
  } else if (zone === 'gradient') {
    zoneSpeedFactor += 0.08 * params.sigNorm;
  } else if (zone === 'viscous') {
    zoneSpeedFactor -= 0.18 * (1 - params.flowNorm);
  }
  zoneSpeedFactor = Math.max(0.7, zoneSpeedFactor);

  let zoneGripFactor = 1;
  if (zone === 'viscous') {
    zoneGripFactor += 0.28 * params.flowNorm;
  }

  const targetMaxSpeed =
    Math.max(10, params.maxSpeed * zoneSpeedFactor) +
    (racerState.burstActive ? params.burstSpeedBonus : 0);

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

  const laneHalfWidth = (state.geometry.width ?? 80) * 0.52;
  const deltaX = translation.x - projection.sample.x;
  const deltaY = translation.y - projection.sample.y;
  const offsetFromCenter = deltaX * normal.x + deltaY * normal.y;
  if (Math.abs(offsetFromCenter) > laneHalfWidth) {
    const correction =
      -Math.sign(offsetFromCenter) *
      (Math.abs(offsetFromCenter) - laneHalfWidth) *
      params.wallAssist;
    forwardForce.x += normal.x * correction;
    forwardForce.y += normal.y * correction;
  }

  body.addForce(forwardForce, true);
  body.addForce(lateralForce, true);
  body.addTorque(torque, true);
}

export function stepPhysics(state, dt) {
  state.world.integrationParameters.dt = dt;
  state.racers.forEach((racerState) => {
    racerState.burstJustStarted = false;
    racerState.burstJustEnded = false;
    racerState.zoneJustChanged = false;
    applyControls(state, racerState, dt);
  });
  state.world.step();

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
    racerState.distance = clamp(
      racerState.distance + forwardAdvance,
      0,
      state.totalLength,
    );
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
    racerState.position = { x: translation.x, y: translation.y };
    racerState.velocityVec = { x: velocity.x, y: velocity.y };
    racerState.speed = Math.hypot(velocity.x, velocity.y);
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

    if (
      !racerState.finished &&
      racerState.checkpointIndex >= checkpoints.length - 1 &&
      racerState.distance >= state.totalLength - state.finishBuffer
    ) {
      racerState.finishHold += dt;
      if (racerState.finishHold >= 0.25) {
        racerState.finished = true;
        racerState.place = state.placements.length + 1;
        state.placements.push(racerState.id);
      }
    } else if (!racerState.finished) {
      racerState.finishHold = 0;
    }
  });
}


