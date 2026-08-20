import assert from "node:assert/strict";
import { createServer } from "vite";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: { language: "en-US" },
});

const vite = await createServer({
  appType: "custom",
  logLevel: "silent",
  server: { middlewareMode: true },
});

try {
  const { LineSimulator } = await vite.ssrLoadModule("/src/game/simulator.ts");
  const { LEVELS } = await vite.ssrLoadModule("/src/game/levels.ts");
  const { completeClientRecovery, failureCount, recordOutcome } =
    await vite.ssrLoadModule("/src/game/campaign.ts");

  let campaign = { failures: {}, cooperations: 0, difficulty: 1 };
  campaign = recordOutcome(campaign, LEVELS[0].id, false);
  campaign = recordOutcome(campaign, LEVELS[0].id, false);
  campaign = recordOutcome(campaign, LEVELS[0].id, false);
  assert.equal(failureCount(campaign, LEVELS[0].id), 3);

  campaign = completeClientRecovery(campaign, LEVELS[0].id);
  assert.equal(failureCount(campaign, LEVELS[0].id), 0);
  assert.equal(campaign.cooperations, 1);
  assert.equal(campaign.difficulty, 2);

  campaign = completeClientRecovery(campaign, LEVELS[1].id);
  assert.equal(campaign.difficulty, 3);

  const humanRun = new LineSimulator(LEVELS[1], 2);
  humanRun.start();
  let humanSnapshot;
  for (let elapsed = 0; elapsed < 19.5; elapsed += 0.1) {
    humanSnapshot = humanRun.tick(0.1);
  }
  assert.match(humanSnapshot.alarm, /Human error/);
  const tamp = LEVELS[1].controls.find((control) => control.key === "tamp");
  assert.ok(tamp);
  assert.equal(
    Math.round((humanSnapshot.controls.tamp - tamp.min) / tamp.step),
    (humanSnapshot.controls.tamp - tamp.min) / tamp.step,
  );

  const resilienceRun = new LineSimulator(LEVELS[0], 3);
  resilienceRun.start();
  let resilienceSnapshot;
  for (let elapsed = 0; elapsed < 34.2; elapsed += 0.1) {
    resilienceSnapshot = resilienceRun.tick(0.1);
  }
  assert.match(resilienceSnapshot.alarm, /Power outage/);
  const producedAtOutage = resilienceSnapshot.produced;
  for (let elapsed = 0; elapsed < 3; elapsed += 0.1) {
    resilienceSnapshot = resilienceRun.tick(0.1);
  }
  assert.equal(resilienceSnapshot.produced, producedAtOutage);

  while (!resilienceSnapshot.finished) {
    resilienceSnapshot = resilienceRun.tick(0.1);
  }
  assert.equal(resilienceSnapshot.result.incidentsHandled, 2);

  console.log("Smoke tests passed: campaign hold, client recovery, human error, power outage.");
} finally {
  await vite.close();
}
