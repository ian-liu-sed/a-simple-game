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
  const {
    completeClientRecovery,
    failureCount,
    recordOutcome,
    selectDifficulty,
  } =
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

  campaign = selectDifficulty(campaign, 1);
  assert.equal(campaign.difficulty, 1);

  const lowRun = new LineSimulator(LEVELS[0], 1);
  lowRun.start();
  let lowSnapshot;
  for (let elapsed = 0; elapsed < 13.4; elapsed += 0.1) {
    lowSnapshot = lowRun.tick(0.1);
  }
  assert.match(lowSnapshot.alarm, /Human error/);
  const force = LEVELS[0].controls.find((control) => control.key === "force");
  assert.ok(force);
  assert.notEqual(lowSnapshot.controls.force, force.ideal);
  assert.ok(lowSnapshot.attentionControls.includes("force"));
  for (let elapsed = 0; elapsed < 3.6; elapsed += 0.1) {
    lowSnapshot = lowRun.tick(0.1);
  }
  assert.equal(lowSnapshot.controls.force, force.ideal);
  assert.ok(!lowSnapshot.attentionControls.includes("force"));
  assert.ok(lowSnapshot.log.some((message) => message.includes("Auto Assist restored")));

  const lowDisturbanceRun = new LineSimulator(LEVELS[1], 1);
  lowDisturbanceRun.start();
  let lowDisturbanceSnapshot;
  for (let elapsed = 0; elapsed < 24.2; elapsed += 0.1) {
    lowDisturbanceSnapshot = lowDisturbanceRun.tick(0.1);
  }
  const tamp = LEVELS[1].controls.find((control) => control.key === "tamp");
  assert.ok(tamp);
  assert.equal(lowDisturbanceSnapshot.controls.tamp, tamp.ideal);
  assert.ok(!lowDisturbanceSnapshot.attentionControls.includes("tamp"));

  const humanRun = new LineSimulator(LEVELS[0], 2);
  humanRun.start();
  let humanSnapshot;
  for (let elapsed = 0; elapsed < 21.4; elapsed += 0.1) {
    humanSnapshot = humanRun.tick(0.1);
  }
  assert.notEqual(humanSnapshot.controls.force, force.ideal);
  assert.equal(
    Math.round((humanSnapshot.controls.force - force.min) / force.step),
    (humanSnapshot.controls.force - force.min) / force.step,
  );
  assert.ok(
    humanSnapshot.log.some((message) =>
      message.includes("Manually restore Main compression"),
    ),
  );
  assert.ok(humanSnapshot.attentionControls.includes("force"));
  humanRun.setControl("force", force.ideal);
  humanSnapshot = humanRun.tick(0.1);
  assert.ok(!humanSnapshot.attentionControls.includes("force"));
  while (humanSnapshot.elapsed < LEVELS[0].durationSec * 0.49) {
    humanSnapshot = humanRun.tick(0.1);
  }
  assert.ok(humanSnapshot.attentionControls.includes("rpm"));
  const rpm = LEVELS[0].controls.find((control) => control.key === "rpm");
  assert.ok(rpm);
  humanRun.setControl("rpm", rpm.ideal);
  while (!humanSnapshot.finished) {
    humanSnapshot = humanRun.tick(0.1);
  }
  assert.equal(humanSnapshot.result.incidentsHandled, 3);

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
  assert.equal(resilienceSnapshot.result.incidentsHandled, 4);

  console.log(
    "Smoke tests passed: Assistant auto-recovery, Expert warnings and manual recovery, Legend power outage and frequent errors.",
  );
} finally {
  await vite.close();
}
