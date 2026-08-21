import type { EquipmentId, LevelDef } from "../game/types";
import { EQUIPMENT } from "../game/equipment";
import { applyDocumentLang, getLang, setLang, type Lang } from "./locale";
import { pack } from "./messages";

export type { Lang };
export { getLang, setLang, applyDocumentLang };

export function t() {
  return pack(getLang()).ui;
}

export function simT() {
  return pack(getLang()).sim;
}

export function storyT() {
  return pack(getLang()).story;
}

export function equipT(id: EquipmentId) {
  const base = EQUIPMENT[id];
  const loc = pack(getLang()).equipment[id];
  return {
    ...base,
    name: loc.name,
    role: loc.role,
    tip: loc.tip,
    shortLabel: loc.shortLabel,
  };
}

export function localizeLevel(level: LevelDef): LevelDef {
  const L = pack(getLang()).levels[level.id];
  if (!L) return level;
  return {
    ...level,
    title: L.title,
    subtitle: L.subtitle,
    briefing: L.briefing,
    controls: level.controls.map((c) => ({
      ...c,
      label: L.controls[c.key] ?? c.label,
    })),
    events: level.events?.map((ev) => ({
      ...ev,
      message: L.events[ev.message] ?? ev.message,
    })),
  };
}

export function statusLabel(
  status: "idle" | "running" | "alarm" | "done",
): string {
  const ui = t();
  switch (status) {
    case "idle":
      return ui.statusIdle;
    case "running":
      return ui.statusRunning;
    case "alarm":
      return ui.statusAlarm;
    case "done":
      return ui.statusDone;
  }
}

export function productLabel(product: "tablet" | "capsule"): string {
  const ui = t();
  return product === "tablet" ? ui.formTablet : ui.formCapsule;
}

export function langSwitchHtml(): string {
  const lang = getLang();
  const ui = t();
  return `
  <div class="lang-switch" role="group" aria-label="${ui.langAria}">
    <button type="button" class="lang-btn${lang === "en" ? " active" : ""}" data-set-lang="en">EN</button>
    <button type="button" class="lang-btn${lang === "zh" ? " active" : ""}" data-set-lang="zh">中文</button>
  </div>`;
}

export function bindLangSwitch(onChange: () => void): void {
  document.querySelectorAll<HTMLButtonElement>("[data-set-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const next = btn.dataset.setLang as Lang;
      if (next !== getLang()) {
        setLang(next);
        onChange();
      }
    });
  });
}
