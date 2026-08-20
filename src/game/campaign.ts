import type { DifficultyTier } from "./types";

export interface CampaignState {
  failures: Record<string, number>;
  cooperations: number;
  difficulty: DifficultyTier;
}

const STORAGE_KEY = "sed-line-pilot-campaign-v1";

const INITIAL_STATE: CampaignState = {
  failures: {},
  cooperations: 0,
  difficulty: 1,
};

function normalize(raw: Partial<CampaignState>): CampaignState {
  const cooperations = Math.max(0, Math.floor(Number(raw.cooperations) || 0));
  const savedDifficulty = Math.floor(Number(raw.difficulty) || 1);
  const difficulty = Math.min(3, Math.max(1, savedDifficulty)) as DifficultyTier;
  const failures = Object.fromEntries(
    Object.entries(raw.failures ?? {}).map(([key, value]) => [
      key,
      Math.max(0, Math.floor(Number(value) || 0)),
    ]),
  );

  return { failures, cooperations, difficulty };
}

export function loadCampaign(): CampaignState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return { ...INITIAL_STATE, failures: {} };
    return normalize(JSON.parse(saved) as Partial<CampaignState>);
  } catch {
    return { ...INITIAL_STATE, failures: {} };
  }
}

export function saveCampaign(state: CampaignState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Progress remains available for the current session. */
  }
}

export function failureCount(state: CampaignState, levelId: string): number {
  return state.failures[levelId] ?? 0;
}

export function recordOutcome(
  state: CampaignState,
  levelId: string,
  passed: boolean,
): CampaignState {
  const next = normalize(state);
  next.failures[levelId] = passed ? 0 : failureCount(state, levelId) + 1;
  saveCampaign(next);
  return next;
}

export function completeClientRecovery(
  state: CampaignState,
  levelId: string,
): CampaignState {
  const cooperations = state.cooperations + 1;
  const next: CampaignState = {
    failures: { ...state.failures, [levelId]: 0 },
    cooperations,
    difficulty: Math.min(3, cooperations + 1) as DifficultyTier,
  };
  saveCampaign(next);
  return next;
}
