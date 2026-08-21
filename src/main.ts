import "./style.css";
import { LEVELS } from "./game/levels";
import { LineSimulator } from "./game/simulator";
import { equipmentCardHtml, heroLineHtml } from "./game/art";
import type { LevelDef, SimSnapshot } from "./game/types";
import {
  completeClientRecovery,
  failureCount,
  loadCampaign,
  recordOutcome,
  selectDifficulty,
  type CampaignState,
} from "./game/campaign";
import {
  applyDocumentLang,
  bindLangSwitch,
  equipT,
  getLang,
  langSwitchHtml,
  localizeLevel,
  productLabel,
  statusLabel,
  storyT,
  t,
} from "./i18n";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

type Screen =
  | "home"
  | "brief"
  | "play"
  | "result"
  | "hold"
  | "negotiate"
  | "client";

const HOLD_THRESHOLD = 3;
const NEGOTIATION_PASS = 75;

let screen: Screen = "home";
let levelIndex = 0;
let sim: LineSimulator | null = null;
let snap: SimSnapshot | null = null;
let raf = 0;
let lastTs = 0;
let bestScores: Record<string, number> = loadBest();
let campaign: CampaignState = loadCampaign();
let holdActions = new Set<number>();
let negotiationStep = 0;
let negotiationTrust = 45;
let negotiationChoice: number | null = null;
let clientRecoverySucceeded = false;

applyDocumentLang();

function loadBest(): Record<string, number> {
  try {
    return JSON.parse(localStorage.getItem("sed-line-pilot-best") ?? "{}");
  } catch {
    return {};
  }
}

function saveBest(levelId: string, score: number): void {
  const prev = bestScores[levelId] ?? 0;
  if (score > prev) {
    bestScores[levelId] = score;
    localStorage.setItem("sed-line-pilot-best", JSON.stringify(bestScores));
  }
}

function currentLevel(): LevelDef {
  return localizeLevel(LEVELS[levelIndex]);
}

function currentFailureCount(): number {
  return failureCount(campaign, LEVELS[levelIndex].id);
}

function lineIsHeld(index = levelIndex): boolean {
  return failureCount(campaign, LEVELS[index].id) >= HOLD_THRESHOLD;
}

function goHome(): void {
  stopLoop();
  sim = null;
  snap = null;
  screen = "home";
  render();
}

function openBrief(index: number): void {
  stopLoop();
  levelIndex = index;
  if (lineIsHeld(index)) {
    holdActions = new Set<number>();
    screen = "hold";
  } else {
    screen = "brief";
  }
  render();
}

function startRun(): void {
  stopLoop();
  if (lineIsHeld()) {
    holdActions = new Set<number>();
    screen = "hold";
    render();
    return;
  }
  const level = currentLevel();
  sim = new LineSimulator(level, campaign.difficulty);
  snap = sim.tick(0);
  sim.start();
  screen = "play";
  render();
  lastTs = performance.now();
  raf = requestAnimationFrame(loop);
}

function stopLoop(): void {
  if (raf) cancelAnimationFrame(raf);
  raf = 0;
}

function loop(ts: number): void {
  if (!sim) return;
  let remainingDt = Math.max(0, (ts - lastTs) / 1000);
  lastTs = ts;
  while (remainingDt > 0 && !snap?.finished) {
    const step = Math.min(0.05, remainingDt);
    snap = sim.tick(step);
    remainingDt -= step;
  }
  snap ??= sim.tick(0);
  patchPlay(snap);
  if (snap.finished && snap.result) {
    saveBest(LEVELS[levelIndex].id, snap.result.score);
    campaign = recordOutcome(
      campaign,
      LEVELS[levelIndex].id,
      snap.result.passed,
    );
    stopLoop();
    screen = "result";
    render();
    return;
  }
  raf = requestAnimationFrame(loop);
}

function render(): void {
  document.title =
    getLang() === "zh"
      ? "SED 产线飞行员 | SED Machines"
      : "SED Line Pilot | SED Machines";

  if (screen === "home") {
    app!.innerHTML = renderHome();
    bindHome();
    return;
  }
  if (screen === "brief") {
    app!.innerHTML = renderBrief(currentLevel());
    bindBrief();
    return;
  }
  if (screen === "play" && sim && snap) {
    app!.innerHTML = renderPlay(currentLevel(), snap, sim.getTips());
    bindPlay();
    return;
  }
  if (screen === "result" && snap?.result) {
    app!.innerHTML = renderResult(currentLevel(), snap);
    bindResult();
    return;
  }
  if (screen === "hold") {
    app!.innerHTML = renderHold(currentLevel());
    bindHold();
    return;
  }
  if (screen === "negotiate") {
    app!.innerHTML = renderNegotiation(currentLevel());
    bindNegotiation();
    return;
  }
  if (screen === "client") {
    app!.innerHTML = renderClientOutcome(currentLevel());
    bindClientOutcome();
  }
}

function brandActions(extra?: string): string {
  return `
  <div class="brand-actions">
    ${langSwitchHtml()}
    ${extra ?? ""}
  </div>`;
}

function difficultySelectorHtml(compact = false): string {
  const story = storyT();
  const levels = [1, 2, 3] as const;
  return `
    <div class="difficulty-select${compact ? " compact" : ""}">
      <span class="difficulty-select-label">${story.chooseDifficulty}</span>
      <div class="difficulty-options" role="group" aria-label="${story.chooseDifficulty}">
        ${levels
          .map(
            (level) => `
            <button type="button" class="difficulty-option${campaign.difficulty === level ? " active" : ""}" data-select-difficulty="${level}" aria-pressed="${campaign.difficulty === level}">
              <strong>${story.difficulty[level]}</strong>
              <small>${story.difficultyDetail[level]}</small>
            </button>`,
          )
          .join("")}
      </div>
    </div>`;
}

function bindDifficultySelector(): void {
  document
    .querySelectorAll<HTMLButtonElement>("[data-select-difficulty]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const difficulty = Number(button.dataset.selectDifficulty) as 1 | 2 | 3;
        campaign = selectDifficulty(campaign, difficulty);
        render();
      });
    });
}

function renderHome(): string {
  const ui = t();
  const story = storyT();
  const cards = LEVELS.map((raw, i) => {
    const level = localizeLevel(raw);
    const best = bestScores[raw.id];
    const failures = failureCount(campaign, raw.id);
    const holdTag = failures >= HOLD_THRESHOLD ? ` · ${story.activeHold}` : "";
    const failureTag =
      failures > 0 && failures < HOLD_THRESHOLD ? ` · ⚠ ${failures}/3` : "";
    return `
      <button class="level-card" data-level="${i}">
        <span class="tag">${raw.id.toUpperCase()}${best != null ? ` · ${ui.best} ${best}` : ""}${failureTag}${holdTag}</span>
        <h3>${level.title}</h3>
        <p>${level.subtitle}</p>
      </button>`;
  }).join("");

  return `
  <div class="screen">
    <div class="brand-bar">
      <div class="brand">
        <div class="brand-mark">SED</div>
        <div>
          <h1>SED Line Pilot</h1>
          <p>${ui.tagline}</p>
        </div>
      </div>
      ${brandActions(`<a class="ext-link" href="https://sedmachines.com" target="_blank" rel="noreferrer">sedmachines.com</a>`)}
    </div>

    <section class="hero">
      <picture class="hero-photo-wrap">
        <source media="(max-width: 700px)" srcset="./sed-line-hero-sm.jpg" type="image/jpeg" />
        <img
          class="hero-photo"
          src="./sed-line-hero.jpg"
          alt="${ui.heroAlt}"
          width="1280"
          height="853"
          decoding="async"
          fetchpriority="high"
        />
      </picture>
      <div class="hero-copy">
        <h2>${ui.heroTitle}</h2>
        <p>${ui.heroBody}</p>
        <div class="actions">
          <button class="btn-primary" id="btn-start">${ui.startLevel1}</button>
          <a class="btn btn-ghost" href="https://sedmachines.com/catalog" target="_blank" rel="noreferrer">${ui.browseCatalog}</a>
        </div>
      </div>
    </section>

    <section class="campaign-strip panel">
      <div>
        <span class="eyebrow">${story.campaignStatus}</span>
        <strong>${story.difficulty[campaign.difficulty]}</strong>
        <small>${story.difficultyDetail[campaign.difficulty]}</small>
      </div>
      ${difficultySelectorHtml()}
      <div class="campaign-count">
        <span>${story.cooperation}</span>
        <strong>${campaign.cooperations}</strong>
      </div>
    </section>

    <section class="line-stations panel">
      <h2 class="line-stations-title">${ui.lineStations}</h2>
      <p class="line-stations-lead">${ui.lineStationsLead}</p>
      ${heroLineHtml()}
    </section>

    <h2 style="margin: 18px 0 8px; font-size: 1.05rem;">${ui.missions}</h2>
    <div class="level-grid">${cards}</div>

    <p class="foot">
      ${ui.foot.replace(
        "SED Machines",
        '<a href="https://sedmachines.com" target="_blank" rel="noreferrer">SED Machines</a>',
      )}
    </p>
  </div>`;
}

function bindHome(): void {
  bindLangSwitch(render);
  bindDifficultySelector();
  document.getElementById("btn-start")?.addEventListener("click", () => openBrief(0));
  document.querySelectorAll<HTMLButtonElement>("[data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openBrief(Number(btn.dataset.level));
    });
  });
}

function renderBrief(level: LevelDef): string {
  const ui = t();
  const gear = level.equipment
    .map((id) => {
      const e = equipT(id);
      return `<li><strong>${e.name}</strong> (${e.model}) — ${e.role}</li>`;
    })
    .join("");

  return `
  <div class="screen">
    <div class="brand-bar">
      <div class="brand">
        <div class="brand-mark">SED</div>
        <div>
          <h1>${level.title}</h1>
          <p>${level.subtitle}</p>
        </div>
      </div>
      ${brandActions(`<button class="btn-ghost" id="btn-back">${ui.allMissions}</button>`)}
    </div>

    <div class="panel">
      <p style="margin-top:0; line-height:1.55; color:var(--muted)">${level.briefing}</p>
      <p><strong>${ui.target}:</strong> ${level.targetUnits} ${ui.goodUnits} · <strong>${ui.shift}:</strong> ${level.durationSec}s · <strong>${ui.form}:</strong> ${productLabel(level.product)}</p>
      ${difficultySelectorHtml(true)}
      <h3 style="margin-bottom:6px">${ui.lineEquipment}</h3>
      <ul style="margin-top:0; color:var(--muted); line-height:1.55">${gear}</ul>
      <div class="station-row">
        ${level.equipment
          .map((id) => {
            const e = equipT(id);
            return `<div class="station">${equipmentCardHtml(id, e.name, e.model)}</div>`;
          })
          .join("")}
      </div>
      <div class="actions">
        <button class="btn-primary" id="btn-run">${ui.startRun}</button>
        <button class="btn-ghost" id="btn-back-2">${ui.back}</button>
      </div>
    </div>
  </div>`;
}

function bindBrief(): void {
  bindLangSwitch(render);
  bindDifficultySelector();
  document.getElementById("btn-back")?.addEventListener("click", goHome);
  document.getElementById("btn-back-2")?.addEventListener("click", goHome);
  document.getElementById("btn-run")?.addEventListener("click", startRun);
}

function renderPlay(level: LevelDef, s: SimSnapshot, tips: string[]): string {
  const ui = t();
  const story = storyT();
  const pct = Math.min(100, (s.produced / s.target) * 100);
  const stations = s.stations
    .map((st) => {
      const e = equipT(st.id);
      return `
        <div class="station ${st.status}" data-station="${st.id}">
          ${equipmentCardHtml(st.id, e.name, e.model)}
          <div class="meta">${e.name}<br/>${statusLabel(st.status)} · ${ui.health} ${Math.round(st.health)}%</div>
        </div>`;
    })
    .join("");

  const controls = level.controls
    .map((c) => {
      const v = s.controls[c.key] ?? c.ideal;
      const needsAttention = s.attentionControls.includes(c.key);
      return `
        <div class="control${needsAttention ? " attention" : ""}" data-control-key="${c.key}">
          <header>
            <span class="control-name">${c.label}<strong class="parameter-warning" data-parameter-warning="${c.key}" ${needsAttention ? "" : "hidden"}>${ui.adjustNow}</strong></span>
          </header>
          <input type="range" data-key="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${v}" />
          <div class="ideal"><span data-val="${c.key}">${formatVal(v, c.step)}</span> ${c.unit}</div>
        </div>`;
    })
    .join("");

  return `
  <div class="screen" id="play-root">
    <div class="brand-bar">
      <div class="brand">
        <div class="brand-mark">SED</div>
        <div>
          <h1>${level.title}</h1>
          <p>${ui.keepWindow}</p>
        </div>
      </div>
      ${brandActions(`<button class="btn-warn" id="btn-abort">${ui.abort}</button>`)}
    </div>

    <div class="hud hud-five">
      <div class="metric"><div class="label">${ui.goodUnitsHud}</div><div class="value" id="m-produced">${s.produced}/${s.target}</div></div>
      <div class="metric"><div class="label">${ui.rejects}</div><div class="value" id="m-reject">${s.rejected}</div></div>
      <div class="metric"><div class="label">${ui.timeLeft}</div><div class="value" id="m-time">${Math.ceil(s.remaining)}s</div></div>
      <div class="metric ${s.alarm ? "alarm" : ""}" aria-live="polite"><div class="label">${ui.status}</div><div class="value" id="m-status">${s.alarm ? ui.alarm : ui.run}</div></div>
      <div class="metric"><div class="label">${story.campaignStatus}</div><div class="value difficulty-value">${story.difficulty[campaign.difficulty]}</div></div>
    </div>

    <div class="progress"><span id="m-bar" style="width:${pct}%"></span></div>

    <div class="play-layout">
      <div class="panel">
        <div class="station-row" id="stations">${stations}</div>
        <p class="tips" id="alarm-text" aria-live="assertive">${s.alarm ? `<strong>${ui.alarm}:</strong> ${s.alarm}` : ui.lineNominal}</p>
        <div class="tips"><strong>${ui.operatorTips}</strong><br/>${tips.map((tip) => `• ${tip}`).join("<br/>")}</div>
      </div>
      <div class="panel">
        <h3 style="margin-top:0">${ui.processControls}</h3>
        <div class="controls" id="controls">${controls}</div>
        <h3>${ui.eventLog}</h3>
        <ul class="log" id="log">${s.log.map((l) => `<li>${l}</li>`).join("")}</ul>
      </div>
    </div>
  </div>`;
}

function bindPlay(): void {
  bindLangSwitch(() => {
    // Keep run going; only re-render chrome would lose sim state mid-tick.
    // Re-render play frame with same snap.
    if (sim && snap) {
      screen = "play";
      render();
    }
  });
  document.getElementById("btn-abort")?.addEventListener("click", goHome);
  document.querySelectorAll<HTMLInputElement>("input[data-key]").forEach((input) => {
    input.addEventListener("input", () => {
      if (!sim) return;
      const key = input.dataset.key!;
      const value = Number(input.value);
      sim.setControl(key, value);
      const label = document.querySelector(`[data-val="${key}"]`);
      const def = currentLevel().controls.find((c) => c.key === key);
      if (label && def) label.textContent = formatVal(value, def.step);
    });
  });
}

function patchPlay(s: SimSnapshot): void {
  const ui = t();
  const set = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set("m-produced", `${s.produced}/${s.target}`);
  set("m-reject", String(s.rejected));
  set("m-time", `${Math.ceil(s.remaining)}s`);
  set("m-status", s.alarm ? ui.alarm : ui.run);
  const statusMetric = document.getElementById("m-status")?.parentElement;
  statusMetric?.classList.toggle("alarm", Boolean(s.alarm));
  const bar = document.getElementById("m-bar");
  if (bar) bar.style.width = `${Math.min(100, (s.produced / s.target) * 100)}%`;
  const alarm = document.getElementById("alarm-text");
  if (alarm) {
    alarm.innerHTML = s.alarm
      ? `<strong>${ui.alarm}:</strong> ${s.alarm}`
      : ui.lineNominal;
  }
  const log = document.getElementById("log");
  if (log) log.innerHTML = s.log.map((l) => `<li>${l}</li>`).join("");
  document.querySelectorAll<HTMLInputElement>("input[data-key]").forEach((input) => {
    const key = input.dataset.key;
    if (!key || s.controls[key] == null) return;
    const def = currentLevel().controls.find((control) => control.key === key);
    input.value = String(s.controls[key]);
    const value = document.querySelector<HTMLElement>(`[data-val="${key}"]`);
    if (value && def) value.textContent = formatVal(s.controls[key], def.step);
  });
  document.querySelectorAll<HTMLElement>("[data-control-key]").forEach((control) => {
    const key = control.dataset.controlKey;
    const needsAttention = Boolean(key && s.attentionControls.includes(key));
    control.classList.toggle("attention", needsAttention);
    const warning = control.querySelector<HTMLElement>("[data-parameter-warning]");
    if (warning) warning.hidden = !needsAttention;
  });
  document.querySelectorAll<HTMLElement>("[data-station]").forEach((el) => {
    const id = el.dataset.station;
    const st = s.stations.find((x) => x.id === id);
    if (!st) return;
    el.classList.toggle("running", st.status === "running");
    el.classList.toggle("alarm", st.status === "alarm");
    const meta = el.querySelector(".meta");
    const e = equipT(st.id);
    if (meta) {
      meta.innerHTML = `${e.name}<br/>${statusLabel(st.status)} · ${ui.health} ${Math.round(st.health)}%`;
    }
  });
}

function renderResult(level: LevelDef, s: SimSnapshot): string {
  const ui = t();
  const story = storyT();
  const r = s.result!;
  const failures = currentFailureCount();
  const remaining = Math.max(0, HOLD_THRESHOLD - failures);
  const failureReminder = r.passed
    ? ""
    : `<div class="failure-reminder${remaining === 0 ? " hold" : ""}" role="alert">
        <div class="reminder-icon">${remaining === 0 ? "⏸" : "!"}</div>
        <div>
          <strong>${story.failureReminder}</strong>
          <p>${story.failureBody(failures, remaining)}</p>
        </div>
      </div>`;
  return `
  <div class="screen">
    <div class="brand-bar">
      <div class="brand">
        <div class="brand-mark">SED</div>
        <div>
          <h1>${ui.batchReport}</h1>
          <p>${level.title}</p>
        </div>
      </div>
      ${brandActions()}
    </div>
    <div class="panel">
      <div class="result-banner ${r.passed ? "pass" : "fail"}">
        <div class="result-heading">
          <div>
            <h2>${r.passed ? ui.released : ui.held}</h2>
            <p>${ui.score} ${r.score} · ${ui.best} ${bestScores[LEVELS[levelIndex].id] ?? r.score}</p>
          </div>
          <div class="client-reaction ${r.passed ? "satisfied" : "disappointed"}" role="status">
            <span class="client-face" role="img" aria-label="${r.passed ? ui.clientSatisfied : ui.clientDisappointed}">${r.passed ? "😊" : "😞"}</span>
            <div>
              <strong>${r.passed ? ui.clientSatisfied : ui.clientDisappointed}</strong>
              <small>${r.passed ? ui.clientSatisfiedBody : ui.clientDisappointedBody}</small>
            </div>
          </div>
        </div>
        <div class="result-grid">
          <div class="metric"><div class="label">${ui.produced}</div><div class="value">${r.produced}</div></div>
          <div class="metric"><div class="label">${ui.rejects}</div><div class="value">${r.rejected}</div></div>
          <div class="metric"><div class="label">${ui.quality}</div><div class="value">${r.qualityPct}%</div></div>
          <div class="metric"><div class="label">${ui.oee}</div><div class="value">${r.oeePct}%</div></div>
          <div class="metric"><div class="label">${ui.downtime}</div><div class="value">${r.downtimeSec}s</div></div>
          <div class="metric"><div class="label">${story.incidentsHandled}</div><div class="value">${r.incidentsHandled}</div></div>
        </div>
      </div>
      ${failureReminder}
      <div class="actions" style="margin-top:14px">
        <button class="btn-primary" id="btn-retry">${lineIsHeld() ? story.enterHold : ui.retry}</button>
        ${lineIsHeld() ? "" : `<button class="btn-ghost" id="btn-next">${levelIndex < LEVELS.length - 1 ? ui.nextMission : ui.backToHub}</button>`}
        <a class="btn btn-ghost" href="https://sedmachines.com" target="_blank" rel="noreferrer">${ui.exploreSed}</a>
      </div>
    </div>
  </div>`;
}

function bindResult(): void {
  bindLangSwitch(render);
  document.getElementById("btn-retry")?.addEventListener("click", () => {
    if (lineIsHeld()) {
      holdActions = new Set<number>();
      screen = "hold";
      render();
    } else {
      startRun();
    }
  });
  document.getElementById("btn-next")?.addEventListener("click", () => {
    if (levelIndex < LEVELS.length - 1) openBrief(levelIndex + 1);
    else goHome();
  });
}

function renderHold(level: LevelDef): string {
  const ui = t();
  const story = storyT();
  const elapsedMinutes = holdActions.size * 20;
  const complete = holdActions.size === story.holdActions.length;
  const actions = story.holdActions
    .map((action, index) => {
      const done = holdActions.has(index);
      return `
        <button class="recovery-action${done ? " done" : ""}" data-hold-action="${index}" ${done ? "disabled" : ""}>
          <span class="recovery-check">${done ? "✓" : index + 1}</span>
          <span><strong>${action.title}</strong><small>${action.body}</small></span>
          ${done ? `<em>${story.completed}</em>` : ""}
        </button>`;
    })
    .join("");

  return `
  <div class="screen">
    <div class="brand-bar">
      <div class="brand">
        <div class="brand-mark hold-mark">II</div>
        <div>
          <h1>${story.holdTitle}</h1>
          <p>${level.title}</p>
        </div>
      </div>
      ${brandActions(`<button class="btn-ghost" id="btn-hold-home">${ui.backToHub}</button>`)}
    </div>

    <section class="hold-hero panel">
      <div class="hold-status">
        <span>${story.activeHold}</span>
        <strong>${story.holdReason}</strong>
      </div>
      <div>
        <h2>${story.holdTitle}</h2>
        <p>${story.holdBody}</p>
      </div>
      <div class="hold-clock" aria-live="polite">
        <span>${story.holdClock}</span>
        <strong>${elapsedMinutes}:00 / 60:00</strong>
        <div class="hold-progress"><span style="width:${(elapsedMinutes / 60) * 100}%"></span></div>
      </div>
    </section>

    <section class="panel recovery-panel">
      <h3>${story.recoveryPlan}</h3>
      <div class="recovery-list">${actions}</div>
      <div class="actions">
        <button class="btn-primary" id="btn-call-client" ${complete ? "" : "disabled"}>${story.callClient}</button>
      </div>
    </section>
  </div>`;
}

function bindHold(): void {
  bindLangSwitch(render);
  document.getElementById("btn-hold-home")?.addEventListener("click", goHome);
  document
    .querySelectorAll<HTMLButtonElement>("[data-hold-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        holdActions.add(Number(button.dataset.holdAction));
        render();
      });
    });
  document.getElementById("btn-call-client")?.addEventListener("click", () => {
    negotiationStep = 0;
    negotiationTrust = 45;
    negotiationChoice = null;
    screen = "negotiate";
    render();
  });
}

function renderNegotiation(level: LevelDef): string {
  const ui = t();
  const story = storyT();
  const round = story.negotiationRounds[negotiationStep];
  const answered = negotiationChoice != null;
  const selected = answered ? round.choices[negotiationChoice!] : null;
  const choices = round.choices
    .map(
      (choice, index) => `
      <button class="negotiation-choice${negotiationChoice === index ? " selected" : ""}" data-negotiation-choice="${index}" ${answered ? "disabled" : ""}>
        <span>${String.fromCharCode(65 + index)}</span>
        <strong>${choice.label}</strong>
      </button>`,
    )
    .join("");

  return `
  <div class="screen negotiation-screen">
    <div class="brand-bar">
      <div class="brand">
        <div class="brand-mark client-mark">☎</div>
        <div>
          <h1>${story.negotiationTitle}</h1>
          <p>${level.title}</p>
        </div>
      </div>
      ${brandActions(`<button class="btn-ghost" id="btn-negotiation-home">${ui.backToHub}</button>`)}
    </div>

    <div class="negotiation-layout">
      <section class="panel negotiation-card">
        <div class="round-label">${negotiationStep + 1} / ${story.negotiationRounds.length}</div>
        <h2>${round.prompt}</h2>
        <p>${story.negotiationLead}</p>
        <div class="negotiation-choices">${choices}</div>
        ${selected ? `<div class="client-feedback ${selected.trust >= 0 ? "positive" : "negative"}" role="status"><strong>${selected.trust >= 0 ? "+" : ""}${selected.trust}</strong><p>${selected.feedback}</p></div>` : ""}
        ${answered ? `<button class="btn-primary" id="btn-negotiation-next">${story.next}</button>` : ""}
      </section>
      <aside class="panel trust-card">
        <span>${story.clientTrust}</span>
        <strong>${negotiationTrust}</strong>
        <div class="trust-meter"><span style="width:${negotiationTrust}%"></span></div>
        <small>${story.cooperation}: ${campaign.cooperations}</small>
      </aside>
    </div>
  </div>`;
}

function bindNegotiation(): void {
  bindLangSwitch(render);
  document
    .getElementById("btn-negotiation-home")
    ?.addEventListener("click", goHome);
  document
    .querySelectorAll<HTMLButtonElement>("[data-negotiation-choice]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        if (negotiationChoice != null) return;
        const choiceIndex = Number(button.dataset.negotiationChoice);
        const choice = storyT().negotiationRounds[negotiationStep].choices[
          choiceIndex
        ];
        negotiationChoice = choiceIndex;
        negotiationTrust = Math.min(
          100,
          Math.max(0, negotiationTrust + choice.trust),
        );
        render();
      });
    });
  document
    .getElementById("btn-negotiation-next")
    ?.addEventListener("click", () => {
      if (negotiationStep < storyT().negotiationRounds.length - 1) {
        negotiationStep += 1;
        negotiationChoice = null;
        render();
        return;
      }
      clientRecoverySucceeded = negotiationTrust >= NEGOTIATION_PASS;
      if (clientRecoverySucceeded) {
        campaign = completeClientRecovery(
          campaign,
          LEVELS[levelIndex].id,
        );
      }
      screen = "client";
      render();
    });
}

function renderClientOutcome(level: LevelDef): string {
  const ui = t();
  const story = storyT();
  const title = clientRecoverySucceeded
    ? story.successTitle
    : story.negotiationFailed;
  const body = clientRecoverySucceeded
    ? story.successBody
    : story.negotiationFailedBody;

  return `
  <div class="screen">
    <div class="brand-bar">
      <div class="brand">
        <div class="brand-mark ${clientRecoverySucceeded ? "success-mark" : "hold-mark"}">${clientRecoverySucceeded ? "✓" : "!"}</div>
        <div>
          <h1>${title}</h1>
          <p>${level.title}</p>
        </div>
      </div>
      ${brandActions()}
    </div>

    <section class="panel client-outcome ${clientRecoverySucceeded ? "success" : "fail"}">
      <span class="eyebrow">${story.clientTrust}: ${negotiationTrust}</span>
      <h2>${title}</h2>
      ${clientRecoverySucceeded ? `<blockquote>“${story.successQuote}”</blockquote>` : ""}
      <p>${body}</p>
      ${clientRecoverySucceeded ? `<div class="difficulty-unlocked"><span>${story.campaignStatus}</span><strong>${story.difficulty[campaign.difficulty]}</strong><small>${story.difficultyDetail[campaign.difficulty]}</small></div>` : ""}
      <div class="actions">
        <button class="btn-primary" id="btn-client-primary">${clientRecoverySucceeded ? story.nextCooperation : story.retryNegotiation}</button>
        <button class="btn-ghost" id="btn-client-home">${ui.backToHub}</button>
      </div>
    </section>
  </div>`;
}

function bindClientOutcome(): void {
  bindLangSwitch(render);
  document.getElementById("btn-client-home")?.addEventListener("click", goHome);
  document
    .getElementById("btn-client-primary")
    ?.addEventListener("click", () => {
      if (clientRecoverySucceeded) {
        openBrief((levelIndex + 1) % LEVELS.length);
      } else {
        negotiationStep = 0;
        negotiationTrust = 45;
        negotiationChoice = null;
        screen = "negotiate";
        render();
      }
    });
}

function formatVal(v: number, step: number): string {
  if (step < 1) return v.toFixed(1);
  return String(Math.round(v * 100) / 100);
}

render();
