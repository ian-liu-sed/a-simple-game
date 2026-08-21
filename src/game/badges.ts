import type { DifficultyTier, RunStats } from "./types";

export type BadgeId =
  | "quality-guardian"
  | "oee-elite"
  | "recovery-ace"
  | "press-master"
  | "capsule-specialist"
  | "packaging-guardian"
  | "blister-specialist"
  | "full-line-commander"
  | "campaign-master";

export interface BadgeDefinition {
  id: BadgeId;
  icon: string;
  levelId?: string;
}

export const BADGES: BadgeDefinition[] = [
  { id: "quality-guardian", icon: "◆" },
  { id: "oee-elite", icon: "⚡" },
  { id: "recovery-ace", icon: "✦" },
  { id: "press-master", icon: "P", levelId: "L1-press" },
  { id: "capsule-specialist", icon: "C", levelId: "L2-capsule" },
  { id: "packaging-guardian", icon: "B", levelId: "L3-bottle" },
  { id: "blister-specialist", icon: "▦", levelId: "L4-blister" },
  { id: "full-line-commander", icon: "OEE", levelId: "L5-oee" },
  { id: "campaign-master", icon: "★" },
];

const LINE_BADGE_IDS: BadgeId[] = [
  "press-master",
  "capsule-specialist",
  "packaging-guardian",
  "blister-specialist",
  "full-line-commander",
];

export function missionBadge(levelId: string): BadgeDefinition | undefined {
  return BADGES.find((badge) => badge.levelId === levelId);
}

export function evaluateBadges(
  levelId: string,
  result: RunStats,
  difficulty: DifficultyTier,
  alreadyUnlocked: Iterable<string>,
): BadgeId[] {
  if (!result.passed) return [];
  const unlocked = new Set(alreadyUnlocked);
  const earned = new Set<BadgeId>();
  const add = (id: BadgeId, condition: boolean) => {
    if (condition && !unlocked.has(id)) earned.add(id);
  };

  add(
    "quality-guardian",
    result.qualityPct >= 99.5 && result.oeePct >= 82,
  );
  add("oee-elite", result.oeePct >= 93 && result.qualityPct >= 98.5);
  add(
    "recovery-ace",
    difficulty >= 2 && result.incidentsHandled >= 3 && result.oeePct >= 78,
  );
  add(
    "press-master",
    levelId === "L1-press" &&
      result.qualityPct >= 99 &&
      result.oeePct >= 88,
  );
  add(
    "capsule-specialist",
    levelId === "L2-capsule" &&
      result.qualityPct >= 99.5 &&
      result.oeePct >= 90,
  );
  add(
    "packaging-guardian",
    levelId === "L3-bottle" &&
      result.qualityPct >= 98.5 &&
      result.oeePct >= 87,
  );
  add(
    "blister-specialist",
    levelId === "L4-blister" &&
      result.qualityPct >= 99 &&
      result.oeePct >= 89,
  );
  add(
    "full-line-commander",
    levelId === "L5-oee" &&
      difficulty >= 2 &&
      result.qualityPct >= 98.5 &&
      result.oeePct >= 86,
  );

  const afterRun = new Set([...unlocked, ...earned]);
  add(
    "campaign-master",
    LINE_BADGE_IDS.every((badgeId) => afterRun.has(badgeId)),
  );

  return BADGES.map((badge) => badge.id).filter((id) => earned.has(id));
}
