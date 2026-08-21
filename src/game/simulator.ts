import type {
  ControlDef,
  DifficultyTier,
  LevelDef,
  RunStats,
  SimSnapshot,
  StationState,
} from "./types";
import { equipT, simT } from "../i18n";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function deviation(value: number, control: ControlDef): number {
  const d = Math.abs(value - control.ideal) / control.tolerance;
  return d;
}

function alignToStep(value: number, control: ControlDef): number {
  const steps = Math.round((value - control.min) / control.step);
  return Number((control.min + steps * control.step).toFixed(4));
}

function qualityFromControls(
  controls: Record<string, number>,
  defs: ControlDef[],
): number {
  if (defs.length === 0) return 1;
  let score = 0;
  for (const def of defs) {
    const d = deviation(controls[def.key] ?? def.ideal, def);
    score += d <= 1 ? 1 - d * 0.18 : Math.max(0.15, 1.15 - d * 0.55);
  }
  return clamp(score / defs.length, 0.12, 1);
}

function throughputFactor(
  controls: Record<string, number>,
  defs: ControlDef[],
): number {
  const speedKeys = ["rpm", "countSpeed", "cycle", "feed"];
  const speedDef = defs.find((d) => speedKeys.includes(d.key));
  if (!speedDef) return 0.85;
  const v = controls[speedDef.key] ?? speedDef.ideal;
  const ratio = v / speedDef.ideal;
  return clamp(0.55 + ratio * 0.55, 0.35, 1.35);
}

export class LineSimulator {
  private level: LevelDef;
  private controls: Record<string, number>;
  private stations: StationState[];
  private elapsed = 0;
  private produced = 0;
  private rejected = 0;
  private downtime = 0;
  private alarm: string | null = null;
  private log: string[] = [];
  private firedEvents = new Set<number>();
  private finished = false;
  private result: RunStats | null = null;
  private running = false;
  private carry = 0;
  private difficulty: DifficultyTier;
  private firedDifficultyEvents = new Set<string>();
  private activeStop: {
    until: number;
    message: string;
    cleared: string;
    controlKey?: string;
  } | null = null;
  private autoCorrections: Array<{ at: number; controlKey: string }> = [];
  private incidentsHandled = 0;

  constructor(level: LevelDef, difficulty: DifficultyTier = 1) {
    this.level = level;
    this.difficulty = difficulty;
    this.controls = Object.fromEntries(
      level.controls.map((c) => [c.key, c.ideal]),
    );
    this.stations = level.equipment.map((id) => ({
      id,
      throughput: 0,
      rejects: 0,
      health: 100,
      status: "idle" as const,
    }));
    this.pushLog(simT().lineArmed(level.title));
  }

  start(): void {
    if (this.finished) return;
    this.running = true;
    for (const s of this.stations) s.status = "running";
    this.pushLog(simT().runStarted);
  }

  setControl(key: string, value: number): void {
    const def = this.level.controls.find((c) => c.key === key);
    if (!def) return;
    this.controls[key] = clamp(value, def.min, def.max);
  }

  getControls(): Record<string, number> {
    return { ...this.controls };
  }

  tick(dt: number): SimSnapshot {
    if (!this.running || this.finished) return this.snapshot();

    this.elapsed += dt;
    this.resolveActiveStop();
    this.resolveAutoCorrections();
    this.handleEvents();
    this.handleDifficultyEvents();

    const q = qualityFromControls(this.controls, this.level.controls);
    const speed = throughputFactor(this.controls, this.level.controls);
    const baseRate = (this.level.targetUnits / this.level.durationSec) * 1.15;
    const goodRate = baseRate * speed * (0.55 + q * 0.55);
    const rejectRate = baseRate * speed * (1 - q) * 0.85;

    const worst = this.level.controls
      .map((c) => ({
        c,
        d: deviation(this.controls[c.key], c),
      }))
      .sort((a, b) => b.d - a.d)[0];

    if (this.activeStop) {
      this.alarm = this.activeStop.message;
      this.downtime += dt;
      for (const s of this.stations) {
        s.status = "alarm";
        s.throughput = 0;
        s.health = clamp(s.health - dt * 2.5, 20, 100);
      }
    } else if (worst && worst.d > 1.6) {
      this.alarm = simT().outsideWindow(worst.c.label);
      this.downtime += dt * 0.35;
      for (const s of this.stations) {
        s.status = "alarm";
        s.health = clamp(s.health - dt * 4, 20, 100);
      }
    } else {
      this.alarm = null;
      for (const s of this.stations) {
        s.status = "running";
        s.health = clamp(s.health + dt * 1.5, 20, 100);
      }
    }

    const effective = this.activeStop ? 0 : this.alarm ? 0.45 : 1;
    this.carry += goodRate * effective * dt;
    const made = Math.floor(this.carry);
    this.carry -= made;
    this.produced += made;

    const rej = rejectRate * effective * dt;
    this.rejected += rej;

    const n = this.stations.length || 1;
    for (const s of this.stations) {
      s.throughput = goodRate * effective;
      s.rejects = (rej / n) * 60;
    }

    if (
      this.elapsed >= this.level.durationSec ||
      this.produced >= this.level.targetUnits
    ) {
      this.finish();
    }

    return this.snapshot();
  }

  private handleEvents(): void {
    const events = this.level.events ?? [];
    events.forEach((ev, idx) => {
      if (this.firedEvents.has(idx)) return;
      if (this.elapsed < ev.atSec) return;
      this.firedEvents.add(idx);
      this.pushLog(ev.message);
      if (ev.controlKey && ev.nudge != null) {
        const def = this.level.controls.find((c) => c.key === ev.controlKey);
        if (def) {
          this.controls[ev.controlKey] = clamp(
            (this.controls[ev.controlKey] ?? def.ideal) + ev.nudge,
            def.min,
            def.max,
          );
          if (this.difficulty === 1) {
            this.autoCorrections.push({
              at: this.elapsed + 2,
              controlKey: def.key,
            });
            this.pushLog(simT().autoAssistQueued(def.label));
          }
        }
      }
    });
  }

  private handleDifficultyEvents(): void {
    if (
      !this.firedDifficultyEvents.has("human-error") &&
      this.elapsed >= this.level.durationSec * 0.32
    ) {
      this.firedDifficultyEvents.add("human-error");
      const control = this.level.controls[0];
      if (control) {
        const direction = this.controls[control.key] <= control.ideal ? 1 : -1;
        this.controls[control.key] = clamp(
          alignToStep(
            control.ideal + direction * control.tolerance * 2.1,
            control,
          ),
          control.min,
          control.max,
        );
        this.startStop(
          simT().humanError(control.label),
          simT().humanErrorCleared,
          3.5,
          control.key,
        );
      }
    }

    if (
      this.difficulty >= 3 &&
      !this.firedDifficultyEvents.has("power-outage") &&
      this.elapsed >= this.level.durationSec * 0.62
    ) {
      this.firedDifficultyEvents.add("power-outage");
      this.startStop(simT().powerOutage, simT().powerRestored, 7);
    }
  }

  private startStop(
    message: string,
    cleared: string,
    duration: number,
    controlKey?: string,
  ): void {
    this.activeStop = {
      until: this.elapsed + duration,
      message,
      cleared,
      controlKey,
    };
    this.pushLog(message);
  }

  private resolveActiveStop(): void {
    if (!this.activeStop || this.elapsed < this.activeStop.until) return;
    const { cleared, controlKey } = this.activeStop;
    this.pushLog(cleared);
    this.activeStop = null;
    this.incidentsHandled += 1;
    if (!controlKey) return;
    const control = this.level.controls.find((def) => def.key === controlKey);
    if (!control) return;
    if (this.difficulty === 1) {
      this.controls[control.key] = control.ideal;
      this.pushLog(simT().parameterAutoRestored(control.label));
    } else {
      this.pushLog(simT().manualCorrectionRequired(control.label));
    }
  }

  private resolveAutoCorrections(): void {
    const ready = this.autoCorrections.filter((item) => item.at <= this.elapsed);
    this.autoCorrections = this.autoCorrections.filter(
      (item) => item.at > this.elapsed,
    );
    for (const item of ready) {
      const control = this.level.controls.find(
        (def) => def.key === item.controlKey,
      );
      if (!control) continue;
      this.controls[control.key] = control.ideal;
      this.incidentsHandled += 1;
      this.pushLog(simT().parameterAutoRestored(control.label));
    }
  }

  private finish(): void {
    this.finished = true;
    this.running = false;
    for (const s of this.stations) s.status = "done";

    const planned = this.level.targetUnits;
    const availability = clamp(
      1 - this.downtime / this.level.durationSec,
      0.4,
      1,
    );
    const performance = clamp(this.produced / planned, 0, 1.2);
    const total = this.produced + this.rejected;
    const quality = total > 0 ? this.produced / total : 0;
    const oee = availability * Math.min(1, performance) * quality * 100;
    const qualityPct = quality * 100;

    const passed =
      this.produced >= planned * 0.85 && qualityPct >= 78 && oee >= 55;

    const score = Math.round(
      oee * 8 +
        Math.min(this.produced, planned) * 0.15 +
        (passed ? 120 : 0) -
        this.rejected * 0.08,
    );

    this.result = {
      produced: Math.floor(this.produced),
      rejected: Math.floor(this.rejected),
      downtimeSec: Math.round(this.downtime),
      qualityPct: Math.round(qualityPct * 10) / 10,
      oeePct: Math.round(oee * 10) / 10,
      score: Math.max(0, score),
      passed,
      incidentsHandled: this.incidentsHandled,
    };

    this.pushLog(
      passed
        ? simT().batchReleased(this.result.oeePct)
        : simT().batchHeld(this.result.oeePct),
    );
  }

  private pushLog(msg: string): void {
    const sec = Math.floor(this.elapsed);
    this.log.unshift(`[${String(sec).padStart(2, "0")}s] ${msg}`);
    if (this.log.length > 8) this.log.length = 8;
  }

  private snapshot(): SimSnapshot {
    return {
      elapsed: this.elapsed,
      remaining: Math.max(0, this.level.durationSec - this.elapsed),
      stations: this.stations.map((s) => ({ ...s })),
      controls: { ...this.controls },
      produced: Math.floor(this.produced),
      rejected: Math.floor(this.rejected),
      target: this.level.targetUnits,
      alarm: this.alarm,
      log: [...this.log],
      finished: this.finished,
      result: this.result,
    };
  }

  getTips(): string[] {
    return this.level.equipment.map((id) => {
      const e = equipT(id);
      return `${e.name} (${e.model}): ${e.tip}`;
    });
  }
}
