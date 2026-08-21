import assert from "node:assert/strict";
import { createServer } from "vite";

const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, String(value)),
  removeItem: (key) => storage.delete(key),
};
const cookies = new Map();
globalThis.document = {};
Object.defineProperty(globalThis.document, "cookie", {
  configurable: true,
  get: () =>
    [...cookies.entries()]
      .map(([key, value]) => `${key}=${value}`)
      .join("; "),
  set: (serialized) => {
    const [pair] = String(serialized).split(";");
    const separator = pair.indexOf("=");
    cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
  },
});
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
    HOLD_DURATION_MS,
    completeClientRecovery,
    failureCount,
    holdRemainingMs,
    loadCampaign,
    recordOutcome,
    selectDifficulty,
  } =
    await vite.ssrLoadModule("/src/game/campaign.ts");

  const holdStartedAt = 1_800_000_000_000;
  let campaign = { failures: {}, holds: {}, cooperations: 0, difficulty: 1 };
  campaign = recordOutcome(campaign, LEVELS[0].id, false, holdStartedAt);
  campaign = recordOutcome(campaign, LEVELS[0].id, false, holdStartedAt);
  campaign = recordOutcome(campaign, LEVELS[0].id, false, holdStartedAt);
  assert.equal(failureCount(campaign, LEVELS[0].id), 3);
  assert.equal(
    holdRemainingMs(campaign, LEVELS[0].id, holdStartedAt),
    HOLD_DURATION_MS,
  );
  assert.match(document.cookie, /sed_line_pilot_campaign_v2=/);
  const reloadedCampaign = loadCampaign();
  assert.equal(
    holdRemainingMs(reloadedCampaign, LEVELS[0].id, holdStartedAt),
    HOLD_DURATION_MS,
  );
  assert.equal(
    holdRemainingMs(
      reloadedCampaign,
      LEVELS[0].id,
      holdStartedAt + HOLD_DURATION_MS,
    ),
    0,
  );

  campaign = completeClientRecovery(campaign, LEVELS[0].id);
  assert.equal(failureCount(campaign, LEVELS[0].id), 0);
  assert.equal(holdRemainingMs(campaign, LEVELS[0].id, holdStartedAt), 0);
  assert.equal(campaign.cooperations, 1);
  assert.equal(campaign.difficulty, 2);

  campaign = completeClientRecovery(campaign, LEVELS[1].id);
  assert.equal(campaign.difficulty, 3);

  campaign = selectDifficulty(campaign, 1);
  assert.equal(campaign.difficulty, 1);

  const midpointRandom = () => 0.5;

  const lowRun = new LineSimulator(LEVELS[0], 1, midpointRandom);
  lowRun.start();
  let lowSnapshot = lowRun.tick(0);
  while (lowSnapshot.elapsed < 20 && lowSnapshot.attentionControls.length === 0) {
    lowSnapshot = lowRun.tick(0.1);
  }
  assert.match(lowSnapshot.alarm, /Human error/);
  const assistedKey = lowSnapshot.attentionControls[0];
  const assistedControl = LEVELS[0].controls.find(
    (control) => control.key === assistedKey,
  );
  assert.ok(assistedControl);
  assert.notEqual(lowSnapshot.controls[assistedKey], assistedControl.ideal);
  for (let elapsed = 0; elapsed < 3.6; elapsed += 0.1) {
    lowSnapshot = lowRun.tick(0.1);
  }
  assert.equal(lowSnapshot.controls[assistedKey], assistedControl.ideal);
  assert.ok(!lowSnapshot.attentionControls.includes(assistedKey));
  assert.ok(lowSnapshot.log.some((message) => message.includes("Auto Assist restored")));

  const lowDisturbanceRun = new LineSimulator(LEVELS[1], 1, () => 0.999);
  lowDisturbanceRun.start();
  let lowDisturbanceSnapshot;
  for (let elapsed = 0; elapsed < 24.2; elapsed += 0.1) {
    lowDisturbanceSnapshot = lowDisturbanceRun.tick(0.1);
  }
  const tamp = LEVELS[1].controls.find((control) => control.key === "tamp");
  assert.ok(tamp);
  assert.equal(lowDisturbanceSnapshot.controls.tamp, tamp.ideal);
  assert.ok(!lowDisturbanceSnapshot.attentionControls.includes("tamp"));

  const humanRun = new LineSimulator(LEVELS[0], 2, midpointRandom);
  humanRun.start();
  let humanSnapshot = humanRun.tick(0);
  while (humanSnapshot.elapsed < 20 && humanSnapshot.attentionControls.length === 0) {
    humanSnapshot = humanRun.tick(0.1);
  }
  const firstExpertKeys = [...humanSnapshot.attentionControls];
  assert.equal(firstExpertKeys.length, 2);
  const firstExpertControl = LEVELS[0].controls.find(
    (control) => control.key === firstExpertKeys[0],
  );
  assert.ok(firstExpertControl);
  assert.notEqual(
    humanSnapshot.controls[firstExpertControl.key],
    firstExpertControl.ideal,
  );
  assert.ok(
    humanSnapshot.log.some((message) =>
      message.includes("Human error"),
    ),
  );
  for (let elapsed = 0; elapsed < 3.6; elapsed += 0.1) {
    humanSnapshot = humanRun.tick(0.1);
  }
  humanRun.setControl(
    firstExpertControl.key,
    firstExpertControl.ideal + firstExpertControl.tolerance * 0.75,
  );
  humanSnapshot = humanRun.tick(0.1);
  assert.ok(humanSnapshot.attentionControls.includes(firstExpertControl.key));
  for (const key of firstExpertKeys) {
    const control = LEVELS[0].controls.find((item) => item.key === key);
    assert.ok(control);
    humanRun.setControl(key, control.ideal);
  }
  humanSnapshot = humanRun.tick(0.1);
  assert.equal(humanSnapshot.attentionControls.length, 0);
  while (humanSnapshot.elapsed < LEVELS[0].durationSec * 0.55) {
    humanSnapshot = humanRun.tick(0.1);
  }
  assert.ok(humanSnapshot.attentionControls.length > 0);
  while (!humanSnapshot.finished) {
    humanSnapshot = humanRun.tick(0.1);
  }
  assert.equal(humanSnapshot.result.incidentsHandled, 3);

  const minimumExpertRun = new LineSimulator(LEVELS[0], 2, () => 0);
  minimumExpertRun.start();
  let minimumExpertSnapshot = minimumExpertRun.tick(0);
  while (!minimumExpertSnapshot.finished) {
    minimumExpertSnapshot = minimumExpertRun.tick(0.1);
  }
  assert.equal(minimumExpertSnapshot.result.incidentsHandled, 2);

  const maximumExpertRun = new LineSimulator(LEVELS[0], 2, () => 0.999);
  maximumExpertRun.start();
  let maximumExpertSnapshot = maximumExpertRun.tick(0);
  while (!maximumExpertSnapshot.finished) {
    maximumExpertSnapshot = maximumExpertRun.tick(0.1);
  }
  assert.equal(maximumExpertSnapshot.result.incidentsHandled, 4);

  const resilienceRun = new LineSimulator(LEVELS[0], 3, midpointRandom);
  resilienceRun.start();
  let resilienceSnapshot = resilienceRun.tick(0);
  while (
    resilienceSnapshot.elapsed < 15 &&
    resilienceSnapshot.attentionControls.length === 0
  ) {
    resilienceSnapshot = resilienceRun.tick(0.1);
  }
  assert.equal(resilienceSnapshot.attentionControls.length, 3);
  const legendControl = LEVELS[0].controls.find(
    (control) => control.key === resilienceSnapshot.attentionControls[0],
  );
  assert.ok(legendControl);
  resilienceRun.setControl(
    legendControl.key,
    legendControl.ideal + legendControl.tolerance * 0.4,
  );
  resilienceSnapshot = resilienceRun.tick(0.1);
  assert.ok(resilienceSnapshot.attentionControls.includes(legendControl.key));
  resilienceRun.setControl(legendControl.key, legendControl.ideal);
  resilienceSnapshot = resilienceRun.tick(0.1);
  assert.ok(!resilienceSnapshot.attentionControls.includes(legendControl.key));
  while (resilienceSnapshot.elapsed < 34.2) {
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
  assert.equal(resilienceSnapshot.result.incidentsHandled, 6);

  console.log(
    "Smoke tests passed: cookie-backed one-hour holds, randomized incidents, precision recovery, Auto Assist, and Legend outage.",
  );
} finally {
  await vite.close();
}
