import {
  createTrackGeometry,
  offsetPolylinePoints,
  projectPointToTrack,
  zoneForProgress,
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
  const { restitution = 0.05, friction = 0.9 } = opts;
  const n = polyline.length;
  if (n < 2) return;
  for (let i = 0; i < n; i += 1) {
    const a = polyline[i];
    const b = polyline[(i + 1) % n];
    const collider = Rapier.ColliderDesc.segment(a.x, a.y, b.x, b.y)
      .setRestitution(restitution)
      .setFriction(friction);
    world.createCollider(collider);
  }
}

function computeControlParams(stats) {
  const motility = eff(stats.MI);
  const linearity = clamp(eff(stats.LQ) / 100, 0.2, 0.95);
  const flow = eff(stats.RE) / 100;
  const signals = eff(stats.CS) / 100;

  const maxSpeed = 24 + motility * 0.22;
  const thrust = 60 + motility * 0.45;
  const steerGain = 24 * linearity;
  const steerDamp = 5 + linearity * 3;
  const lateralGrip = 9 + flow * 3.2;
  const drag = 0.18 - Math.min(0.12, flow * 0.012);
  const wallFriction = 0.65 + flow * 0.05;
  const burstBonus = 1 + Math.min(0.45, signals * 0.0045);
  const burstDuration = 0.9 + signals * 0.014;
  const burstChance = 0.025 + signals * 0.0019;

  return {
    maxSpeed,
    thrust,
    steerGain,
    steerDamp,
    lateralGrip,
    drag,
    wallFriction,
    burstBonus,
    burstDuration,
    burstChance,
  };
}

export async function createPhysicsState({ track, racers, seed, balance }) {
  const Rapier = await initRapier();
  const world = new Rapier.World({ x: 0, y: 0 });
  const geometry = createTrackGeometry(track, { resolution: 32 });
  const halfWidth = (geometry.width ?? 80) / 2;
  const outer = offsetPolylinePoints(geometry, halfWidth);
  const inner = offsetPolylinePoints(geometry, -halfWidth);

  buildWallColliders(Rapier, world, outer, {
    friction: 0.95,
    restitution: 0.05,
  });
  buildWallColliders(Rapier, world, inner, {
    friction: 0.95,
    restitution: 0.05,
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
      .setAngularDamping(6)
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
      zone: 'flow',
      distance: 0,
      progress: 0,
      finished: false,
      place: null,
      lastZone: 'flow',
      burstActive: false,
    };
  });

  return {
    Rapier,
    world,
    geometry,
    racers: racerStates,
    rng,
    placements: [],
    totalLength: geometry.totalLength,
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
  const { Rapier, world, geometry, rng, balance } = state;
  const body = world.getRigidBody(racerState.bodyHandle);
  if (!body) return;

  const translation = body.translation();
  const velocity = body.linvel();
  const angle = body.rotation();

  const projection = projectPointToTrack(geometry, translation);
  racerState.distance = projection.distance;
  racerState.progress = projection.distance / state.totalLength;

  let zone = zoneForProgress(geometry, racerState.progress);
  if (!zone) zone = 'flow';
  if (zone !== racerState.zone) {
    racerState.lastZone = racerState.zone;
    racerState.zone = zone;
    racerState.zoneChanged = true;
  } else {
    racerState.zoneChanged = false;
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

  const zoneModifier =
    zone === 'flow'
      ? 1 + Math.min(0.25, eff(racerState.stats.RE) / 220)
      : zone === 'gradient'
        ? 1 + Math.min(0.18, eff(racerState.stats.CS) / 260)
        : 1 - Math.min(0.2, (1 - eff(racerState.stats.RE) / 120));

  const maxSpeed = params.maxSpeed * zoneModifier;
  const thrust = params.thrust * zoneModifier;

  const burstReady = racerState.hyperburstTimer <= 0;
  if (burstReady) {
    racerState.nextBurstCheck -= dt;
    if (racerState.nextBurstCheck <= 0) {
      racerState.nextBurstCheck = 0.35;
      if (rng() < params.burstChance) {
        racerState.hyperburstTimer = params.burstDuration;
        racerState.burstActive = true;
        racerState.burstJustStarted = true;
      }
    }
  } else {
    racerState.hyperburstTimer -= dt;
    if (racerState.hyperburstTimer <= 0 && racerState.burstActive) {
      racerState.burstActive = false;
      racerState.burstJustEnded = true;
    }
  }

  const burstMultiplier = racerState.burstActive ? params.burstBonus : 1;

  const forwardImpulse = Math.min(thrust * burstMultiplier, thrust + Math.max(0, maxSpeed - speedForward) * 8);
  const forwardForce = {
    x: tangent.x * forwardImpulse,
    y: tangent.y * forwardImpulse,
  };

  const lateralCorrection = -lateralSpeed * params.lateralGrip;
  const lateralForce = {
    x: normal.x * lateralCorrection,
    y: normal.y * lateralCorrection,
  };

  const torque = clamp(
    angleError * params.steerGain - body.angvel() * params.steerDamp,
    -params.steerGain * 1.2,
    params.steerGain * 1.2,
  );

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
    racerState.distance = projection.distance;
    racerState.progress = projection.distance / state.totalLength;
    racerState.position = { x: translation.x, y: translation.y };
    racerState.velocityVec = { x: velocity.x, y: velocity.y };
    racerState.speed = Math.hypot(velocity.x, velocity.y);
    racerState.heading = body.rotation();
    racerState.tangent = projection.sample.tangent;
    racerState.normal = { x: -projection.sample.tangent.y, y: projection.sample.tangent.x };
    racerState.curvature = projection.sample.curvature;
    const zone = zoneForProgress(state.geometry, racerState.progress);
    if (zone !== racerState.zone) {
      racerState.lastZone = racerState.zone;
      racerState.zone = zone;
      racerState.zoneJustChanged = true;
    }

    if (!racerState.finished && racerState.distance >= state.totalLength - 1.5) {
      racerState.finished = true;
      racerState.place = state.placements.length + 1;
      state.placements.push(racerState.id);
    }
  });
}


