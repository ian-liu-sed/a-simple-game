import type { DifficultyTier } from "./types";

export interface CampaignState {
  failures: Record<string, number>;
  holds: Record<string, number>;
  cooperations: number;
  difficulty: DifficultyTier;
}

export const HOLD_THRESHOLD = 3;
export const HOLD_DURATION_MS = 60 * 60 * 1000;

const COOKIE_KEY = "sed_line_pilot_campaign_v2";
const LEGACY_STORAGE_KEY = "sed-line-pilot-campaign-v1";
const COOKIE_MAX_AGE_SECONDS = 90 * 24 * 60 * 60;

const INITIAL_STATE: CampaignState = {
  failures: {},
  holds: {},
  cooperations: 0,
  difficulty: 1,
};

function freshState(): CampaignState {
  return { ...INITIAL_STATE, failures: {}, holds: {} };
}

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
  const holds: Record<string, number> = {};
  for (const [key, value] of Object.entries(raw.holds ?? {})) {
    const holdUntil = Math.max(0, Number(value) || 0);
    if (holdUntil > 0) holds[key] = holdUntil;
  }

  return { failures, holds, cooperations, difficulty };
}

function readCookie(): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${COOKIE_KEY}=`;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

function writeCookie(state: CampaignState): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${COOKIE_KEY}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${COOKIE_MAX_AGE_SECONDS}; Path=/; SameSite=Lax${secure}`;
}

function migrateLegacyState(): CampaignState | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const saved = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!saved) return null;
    const migrated = normalize(JSON.parse(saved) as Partial<CampaignState>);
    const now = Date.now();
    for (const [levelId, failures] of Object.entries(migrated.failures)) {
      if (failures >= HOLD_THRESHOLD) {
        migrated.holds[levelId] = now + HOLD_DURATION_MS;
      }
    }
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return migrated;
  } catch {
    return null;
  }
}

export function loadCampaign(): CampaignState {
  try {
    const saved = readCookie();
    if (saved) return normalize(JSON.parse(saved) as Partial<CampaignState>);
    const migrated = migrateLegacyState();
    if (migrated) {
      writeCookie(migrated);
      return migrated;
    }
    return freshState();
  } catch {
    return freshState();
  }
}

export function saveCampaign(state: CampaignState): void {
  try {
    writeCookie(normalize(state));
  } catch {
    /* Progress remains available for the current session. */
  }
}

export function failureCount(state: CampaignState, levelId: string): number {
  return state.failures[levelId] ?? 0;
}

export function holdRemainingMs(
  state: CampaignState,
  levelId: string,
  now = Date.now(),
): number {
  return Math.max(0, (state.holds[levelId] ?? 0) - now);
}

export function recordOutcome(
  state: CampaignState,
  levelId: string,
  passed: boolean,
  now = Date.now(),
): CampaignState {
  const next = normalize(state);
  if (passed) {
    next.failures[levelId] = 0;
    delete next.holds[levelId];
  } else {
    const failures = failureCount(state, levelId) + 1;
    next.failures[levelId] = failures;
    if (failures >= HOLD_THRESHOLD && !next.holds[levelId]) {
      next.holds[levelId] = now + HOLD_DURATION_MS;
    }
  }
  saveCampaign(next);
  return next;
}

export function selectDifficulty(
  state: CampaignState,
  difficulty: DifficultyTier,
): CampaignState {
  const next = normalize({ ...state, difficulty });
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
    holds: { ...state.holds },
    cooperations,
    difficulty: Math.min(3, cooperations + 1) as DifficultyTier,
  };
  delete next.holds[levelId];
  saveCampaign(next);
  return next;
}
