const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export const EPS = 1e-6;

export const baseEasing = (dt, tau) => (1 - Math.exp(-dt / Math.max(tau, EPS)));

export function eff(x) {
  return Math.sqrt(Math.max(0, x)) * 10;
}

export function baseKinematics(stats) {
  const vcl = eff(stats.MI);
  const lin = clamp(eff(stats.LQ) / 100, 0.2, 0.95);
  const vsl = vcl * lin;
  return { vcl, lin, vsl };
}

export function curvaturePenalty(curvature, stats) {
  const flowEff = eff(stats.RE) / 100; // 0-10ish
  const lin = clamp(eff(stats.LQ) / 100, 0.2, 0.95);
  const intensity = clamp(curvature * 250, 0, 1.2); // 0 (straight) to ~1.2 (tight turn)
  const mitigation = 0.55 + flowEff * 0.03 + lin * 0.25;
  return clamp(1 - intensity * (0.85 - mitigation * 0.35), 0.35, 1.05);
}

export function flowForward({ stats, balance, base, env }) {
  const { vsl } = base;
  const { alignBase, alignPerFlow, boostMax } = balance.race.rheo;
  const flowEff = eff(stats.RE);
  const align = alignBase + alignPerFlow * flowEff;
  const boost =
    1 + Math.min(boostMax, align * (base.vcl / (env.flowSpeed + 30)) * 0.2);
  return vsl * boost;
}

export function gradientForward({ stats, balance, base, rng, state, dt }) {
  const { proc } = balance.race;
  if (!state.hyperburstTimer) {
    const chance = proc.base + proc.sigScale * eff(stats.CS);
    const attempt = 1 - Math.pow(1 - chance, dt); // scaled by dt
    if (rng() < attempt) {
      state.hyperburstTimer = 1.2; // seconds
      state.hyperburstActive = true;
      state.onHyperburst?.();
    }
  }

  let vcl = base.vcl;
  let lin = base.lin;
  if (state.hyperburstTimer > 0) {
    vcl *= balance.race.proc.vclBoost;
    lin *= balance.race.proc.linNerf;
    state.hyperburstTimer = Math.max(0, state.hyperburstTimer - dt);
    if (state.hyperburstTimer === 0 && state.hyperburstActive) {
      state.hyperburstActive = false;
      state.onHyperburstEnd?.();
    }
  }

  const chemoBonus =
    1 + balance.race.proc.chemoMax * (eff(stats.CS) / 100);
  return vcl * lin * chemoBonus;
}

export function viscousForward({ stats, balance, base }) {
  const viscosity = balance.race.env.viscosity;
  const flowEff = eff(stats.RE);
  const penalty =
    1 - 0.45 * viscosity * (1 - flowEff / 120);
  return base.vsl * penalty;
}

export function zoneForwardSpeed({
  zone,
  stats,
  balance,
  base,
  rng,
  zoneState,
  dt,
}) {
  switch (zone) {
    case 'flow':
      return flowForward({ stats, balance, base, env: balance.race.env });
    case 'gradient':
      return gradientForward({
        stats,
        balance,
        base,
        rng,
        state: zoneState,
        dt,
      });
    case 'viscous':
    default:
      return viscousForward({ stats, balance, base });
  }
}

export function deterministicRng(seed) {
  let t = seed >>> 0;
  return function rand() {
    t += 0x6d2b79f5;
    let r = t;
    r = Math.imul(r ^ (r >>> 15), r | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export { clamp };

