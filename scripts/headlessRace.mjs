import { createRaceEngine } from '../lib/race/engine.js';
import {
  MOCK_BALANCE,
  MOCK_RACERS,
  MOCK_TRACK,
  MOCK_SEED,
} from '../app/data/mockRace.js';
import { initRapier } from '../lib/race/physics.js';

await initRapier();

const engine = await createRaceEngine(
  MOCK_RACERS,
  MOCK_TRACK,
  { seed: MOCK_SEED },
  MOCK_BALANCE,
);

let frame = engine.step(0);
for (let i = 0; i < 12000; i += 1) {
  frame = engine.step(1 / 120);
  if (frame.isFinished) {
    break;
  }
}

const summary = {
  time: Number(frame.t.toFixed(2)),
  placements: frame.lanes
    .filter((lane) => lane.finished)
    .sort((a, b) => a.place - b.place)
    .map((lane) => ({
      id: lane.id,
      name: lane.name,
      place: lane.place,
      progress: Number((lane.progress * 100).toFixed(1)),
    })),
  events: frame.events
    .filter((event) => event.kind.startsWith('hyperburst'))
    .map((event) => ({
      kind: event.kind,
      racerId: event.racerId,
      t: Number(event.t.toFixed(3)),
    })),
};

console.log(JSON.stringify(summary, null, 2));

const placeSet = new Set(summary.placements.map((entry) => entry.place));
if (placeSet.size !== summary.placements.length) {
  throw new Error('Duplicate placement detected in headless race.');
}

if (summary.placements.length !== MOCK_RACERS.length) {
  throw new Error('Not all racers reached the finish.');
}

if (summary.time < 5 || summary.time > 120) {
  throw new Error(`Unexpected race duration (${summary.time}s).`);
}

if (!frame.isFinished) {
  const topProgress = Math.max(...frame.lanes.map((lane) => lane.progress));
  console.error('Top progress at timeout:', topProgress.toFixed(3));
  throw new Error('Race did not finish within allotted steps.');
}

summary.events.forEach((event) => {
  if (Number.isNaN(event.t)) {
    throw new Error('Encountered NaN timestamp in event log.');
  }
});

const laneOrder = frame.lanes
  .filter((lane) => lane.finished)
  .sort((a, b) => a.place - b.place)
  .map((lane) => lane.id);

const summaryOrder = summary.placements
  .slice()
  .sort((a, b) => a.place - b.place)
  .map((entry) => entry.id);

if (JSON.stringify(laneOrder) !== JSON.stringify(summaryOrder)) {
  throw new Error('Finish order mismatch between frame and summary.');
}

if (!frame.lanes.every((lane) => lane.finished && lane.progress >= 0.99)) {
  throw new Error('One or more racers did not complete the lap.');
}




