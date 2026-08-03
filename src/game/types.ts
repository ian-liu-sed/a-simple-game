export type EquipmentId =
  | "tablet-press"
  | "capsule-filler"
  | "metal-detector"
  | "pill-counter"
  | "capping"
  | "induction-sealer"
  | "blister-packer"
  | "capsule-polisher";

export type ProductForm = "tablet" | "capsule";

export interface EquipmentDef {
  id: EquipmentId;
  name: string;
  model: string;
  role: string;
  tip: string;
}

export interface ControlDef {
  key: string;
  label: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  ideal: number;
  tolerance: number;
}

export interface LevelDef {
  id: string;
  title: string;
  subtitle: string;
  briefing: string;
  product: ProductForm;
  targetUnits: number;
  durationSec: number;
  equipment: EquipmentId[];
  controls: ControlDef[];
  events?: LevelEvent[];
}

export interface LevelEvent {
  atSec: number;
  message: string;
  controlKey?: string;
  nudge?: number;
}

export interface StationState {
  id: EquipmentId;
  throughput: number;
  rejects: number;
  health: number;
  status: "idle" | "running" | "alarm" | "done";
}

export interface RunStats {
  produced: number;
  rejected: number;
  downtimeSec: number;
  qualityPct: number;
  oeePct: number;
  score: number;
  passed: boolean;
}

export interface SimSnapshot {
  elapsed: number;
  remaining: number;
  stations: StationState[];
  controls: Record<string, number>;
  produced: number;
  rejected: number;
  target: number;
  alarm: string | null;
  log: string[];
  finished: boolean;
  result: RunStats | null;
}
