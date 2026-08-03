import "./style.css";
import { LEVELS } from "./game/levels";
import { EQUIPMENT } from "./game/equipment";
import { LineSimulator } from "./game/simulator";
import { equipmentCardHtml, heroLineHtml } from "./game/art";
import type { LevelDef, SimSnapshot } from "./game/types";

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("#app missing");

type Screen = "home" | "brief" | "play" | "result";

let screen: Screen = "home";
let levelIndex = 0;
let sim: LineSimulator | null = null;
let snap: SimSnapshot | null = null;
let raf = 0;
let lastTs = 0;
let bestScores: Record<string, number> = loadBest();

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
  return LEVELS[levelIndex];
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
  screen = "brief";
  render();
}

function startRun(): void {
  stopLoop();
  const level = currentLevel();
  sim = new LineSimulator(level);
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
  const dt = Math.min(0.05, (ts - lastTs) / 1000);
  lastTs = ts;
  snap = sim.tick(dt);
  patchPlay(snap);
  if (snap.finished && snap.result) {
    saveBest(currentLevel().id, snap.result.score);
    stopLoop();
    screen = "result";
    render();
    return;
  }
  raf = requestAnimationFrame(loop);
}

function render(): void {
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
  }
}

function renderHome(): string {
  const cards = LEVELS.map((level, i) => {
    const best = bestScores[level.id];
    return `
      <button class="level-card" data-level="${i}">
        <span class="tag">${level.id.toUpperCase()}${best != null ? ` · BEST ${best}` : ""}</span>
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
          <p>Serious game · solid-dose equipment logic</p>
        </div>
      </div>
      <a class="ext-link" href="https://sedmachines.com" target="_blank" rel="noreferrer">sedmachines.com</a>
    </div>

    <section class="hero">
      <img class="hero-photo" src="./sed-line-hero.png" alt="SED pharmaceutical packaging production line" width="960" height="540" />
      ${heroLineHtml()}
      <div class="hero-copy">
        <h2>Run a pharmaceutical line. Keep every station in window.</h2>
        <p>
          Learn how SED Machines gear works together — tablet presses, capsule fillers,
          metal detectors, counters, cappers, induction sealers, and blister packers.
          Tune real process parameters, survive disturbances, and chase OEE.
        </p>
        <div class="actions">
          <button class="btn-primary" id="btn-start">Start Level 1</button>
          <a class="btn btn-ghost" href="https://sedmachines.com/catalog" target="_blank" rel="noreferrer">Browse equipment catalog</a>
        </div>
      </div>
    </section>

    <h2 style="margin: 0 0 8px; font-size: 1.05rem;">Missions</h2>
    <div class="level-grid">${cards}</div>

    <p class="foot">
      Inspired by <a href="https://sedmachines.com" target="_blank" rel="noreferrer">SED Machines</a>
      / SED Pharma production &amp; packaging equipment. Training simulation — not a control system.
    </p>
  </div>`;
}

function bindHome(): void {
  document.getElementById("btn-start")?.addEventListener("click", () => openBrief(0));
  document.querySelectorAll<HTMLButtonElement>("[data-level]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openBrief(Number(btn.dataset.level));
    });
  });
}

function renderBrief(level: LevelDef): string {
  const gear = level.equipment
    .map((id) => {
      const e = EQUIPMENT[id];
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
      <button class="btn-ghost" id="btn-back">All missions</button>
    </div>

    <div class="panel">
      <p style="margin-top:0; line-height:1.55; color:var(--muted)">${level.briefing}</p>
      <p><strong>Target:</strong> ${level.targetUnits} good units · <strong>Shift:</strong> ${level.durationSec}s · <strong>Form:</strong> ${level.product}</p>
      <h3 style="margin-bottom:6px">Line equipment</h3>
      <ul style="margin-top:0; color:var(--muted); line-height:1.55">${gear}</ul>
      <div class="station-row">
        ${level.equipment
          .map((id) => {
            const e = EQUIPMENT[id];
            return `<div class="station">${equipmentCardHtml(id, e.name, e.model)}</div>`;
          })
          .join("")}
      </div>
      <div class="actions">
        <button class="btn-primary" id="btn-run">Start run</button>
        <button class="btn-ghost" id="btn-back-2">Back</button>
      </div>
    </div>
  </div>`;
}

function bindBrief(): void {
  document.getElementById("btn-back")?.addEventListener("click", goHome);
  document.getElementById("btn-back-2")?.addEventListener("click", goHome);
  document.getElementById("btn-run")?.addEventListener("click", startRun);
}

function renderPlay(level: LevelDef, s: SimSnapshot, tips: string[]): string {
  const pct = Math.min(100, (s.produced / s.target) * 100);
  const stations = s.stations
    .map((st) => {
      const e = EQUIPMENT[st.id];
      return `
        <div class="station ${st.status}" data-station="${st.id}">
          ${equipmentCardHtml(st.id, e.name, e.model)}
          <div class="meta">${e.name}<br/>${st.status.toUpperCase()} · health ${Math.round(st.health)}%</div>
        </div>`;
    })
    .join("");

  const controls = level.controls
    .map((c) => {
      const v = s.controls[c.key] ?? c.ideal;
      return `
        <div class="control">
          <header>
            <span>${c.label}</span>
            <span class="ideal">ideal ${c.ideal}${c.unit} ±${c.tolerance}</span>
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
          <p>Keep parameters inside process window</p>
        </div>
      </div>
      <button class="btn-warn" id="btn-abort">Abort</button>
    </div>

    <div class="hud">
      <div class="metric"><div class="label">Good units</div><div class="value" id="m-produced">${s.produced}/${s.target}</div></div>
      <div class="metric"><div class="label">Rejects</div><div class="value" id="m-reject">${s.rejected}</div></div>
      <div class="metric"><div class="label">Time left</div><div class="value" id="m-time">${Math.ceil(s.remaining)}s</div></div>
      <div class="metric ${s.alarm ? "alarm" : ""}"><div class="label">Status</div><div class="value" id="m-status">${s.alarm ? "ALARM" : "RUN"}</div></div>
    </div>

    <div class="progress"><span id="m-bar" style="width:${pct}%"></span></div>

    <div class="play-layout">
      <div class="panel">
        <div class="station-row" id="stations">${stations}</div>
        <p class="tips" id="alarm-text">${s.alarm ? `<strong>Alarm:</strong> ${s.alarm}` : "Line nominal. Watch for process disturbances."}</p>
        <div class="tips"><strong>Operator tips</strong><br/>${tips.map((t) => `• ${t}`).join("<br/>")}</div>
      </div>
      <div class="panel">
        <h3 style="margin-top:0">Process controls</h3>
        <div class="controls" id="controls">${controls}</div>
        <h3>Event log</h3>
        <ul class="log" id="log">${s.log.map((l) => `<li>${l}</li>`).join("")}</ul>
      </div>
    </div>
  </div>`;
}

function bindPlay(): void {
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
  const set = (id: string, text: string) => {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  };
  set("m-produced", `${s.produced}/${s.target}`);
  set("m-reject", String(s.rejected));
  set("m-time", `${Math.ceil(s.remaining)}s`);
  set("m-status", s.alarm ? "ALARM" : "RUN");
  const statusMetric = document.getElementById("m-status")?.parentElement;
  statusMetric?.classList.toggle("alarm", Boolean(s.alarm));
  const bar = document.getElementById("m-bar");
  if (bar) bar.style.width = `${Math.min(100, (s.produced / s.target) * 100)}%`;
  const alarm = document.getElementById("alarm-text");
  if (alarm) {
    alarm.innerHTML = s.alarm
      ? `<strong>Alarm:</strong> ${s.alarm}`
      : "Line nominal. Watch for process disturbances.";
  }
  const log = document.getElementById("log");
  if (log) log.innerHTML = s.log.map((l) => `<li>${l}</li>`).join("");
  document.querySelectorAll<HTMLElement>("[data-station]").forEach((el) => {
    const id = el.dataset.station;
    const st = s.stations.find((x) => x.id === id);
    if (!st) return;
    el.classList.toggle("running", st.status === "running");
    el.classList.toggle("alarm", st.status === "alarm");
    const meta = el.querySelector(".meta");
    const e = EQUIPMENT[st.id];
    if (meta) {
      meta.innerHTML = `${e.name}<br/>${st.status.toUpperCase()} · health ${Math.round(st.health)}%`;
    }
  });
}

function renderResult(level: LevelDef, s: SimSnapshot): string {
  const r = s.result!;
  return `
  <div class="screen">
    <div class="brand-bar">
      <div class="brand">
        <div class="brand-mark">SED</div>
        <div>
          <h1>Batch report</h1>
          <p>${level.title}</p>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="result-banner ${r.passed ? "pass" : "fail"}">
        <h2 style="margin:0 0 6px">${r.passed ? "RELEASED — process capable" : "HELD — out of window"}</h2>
        <p style="margin:0; color:var(--muted)">Score ${r.score} · Best ${bestScores[level.id] ?? r.score}</p>
        <div class="result-grid">
          <div class="metric"><div class="label">Produced</div><div class="value">${r.produced}</div></div>
          <div class="metric"><div class="label">Rejects</div><div class="value">${r.rejected}</div></div>
          <div class="metric"><div class="label">Quality</div><div class="value">${r.qualityPct}%</div></div>
          <div class="metric"><div class="label">OEE</div><div class="value">${r.oeePct}%</div></div>
          <div class="metric"><div class="label">Downtime</div><div class="value">${r.downtimeSec}s</div></div>
          <div class="metric"><div class="label">Target</div><div class="value">${level.targetUnits}</div></div>
        </div>
      </div>
      <div class="actions" style="margin-top:14px">
        <button class="btn-primary" id="btn-retry">Retry</button>
        <button class="btn-ghost" id="btn-next">${levelIndex < LEVELS.length - 1 ? "Next mission" : "Back to hub"}</button>
        <a class="btn btn-ghost" href="https://sedmachines.com" target="_blank" rel="noreferrer">Explore SED Machines</a>
      </div>
    </div>
  </div>`;
}

function bindResult(): void {
  document.getElementById("btn-retry")?.addEventListener("click", startRun);
  document.getElementById("btn-next")?.addEventListener("click", () => {
    if (levelIndex < LEVELS.length - 1) openBrief(levelIndex + 1);
    else goHome();
  });
}

function formatVal(v: number, step: number): string {
  if (step < 1) return v.toFixed(1);
  return String(Math.round(v * 100) / 100);
}

render();
