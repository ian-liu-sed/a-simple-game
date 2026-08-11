import type { EquipmentId } from "./types";
import { equipT, t } from "../i18n";

const palette = {
  steel: "#8a97a8",
  steelDark: "#4a5563",
  accent: "#0f6e56",
  accentLite: "#1fa37a",
  warn: "#c45c26",
  bg: "#1a2332",
};

/** Public asset paths for equipment product photos */
export const EQUIPMENT_PHOTOS: Partial<Record<EquipmentId, string>> = {
  "tablet-press": "./equipment/tablet-press.jpg",
  "capsule-filler": "./equipment/capsule-filler.jpg",
  "capsule-polisher": "./equipment/capsule-polisher.jpg",
  "metal-detector": "./equipment/metal-detector.jpg",
  "pill-counter": "./equipment/pill-counter.jpg",
  capping: "./equipment/cap-seal.jpg",
  "induction-sealer": "./equipment/cap-seal.jpg",
  "blister-packer": "./equipment/blister-packer.jpg",
};

export interface HeroStation {
  id: EquipmentId;
  label: string;
  model: string;
  photo: string;
}

export const HERO_STATIONS: HeroStation[] = [
  {
    id: "tablet-press",
    label: "Tablet Press",
    model: "SED-GY-D",
    photo: "./equipment/tablet-press.jpg",
  },
  {
    id: "metal-detector",
    label: "Metal Detect",
    model: "SED MD",
    photo: "./equipment/metal-detector.jpg",
  },
  {
    id: "pill-counter",
    label: "Pill Counter",
    model: "SED Count",
    photo: "./equipment/pill-counter.jpg",
  },
  {
    id: "capping",
    label: "Cap / Seal",
    model: "SED Cap+Seal",
    photo: "./equipment/cap-seal.jpg",
  },
  {
    id: "blister-packer",
    label: "Blister",
    model: "SED-P-A",
    photo: "./equipment/blister-packer.jpg",
  },
];

export function heroLineHtml(): string {
  const ui = t();
  const cards = HERO_STATIONS.map((s, i) => {
    const label = equipT(s.id).shortLabel;
    return `
    <article class="hero-station" style="animation-delay:${i * 50}ms">
      <div class="hero-station-photo">
        <img src="${s.photo}" alt="${label} — ${s.model}" loading="${i < 2 ? "eager" : "lazy"}" decoding="async" width="120" height="90" />
      </div>
      <header>
        <strong>${label}</strong>
        <span>${s.model}</span>
      </header>
    </article>
    ${i < HERO_STATIONS.length - 1 ? '<div class="hero-flow" aria-hidden="true">→</div>' : ""}`;
  }).join("");

  return `
  <div class="hero-line" role="img" aria-label="${ui.heroAlt}">
    <div class="hero-line-track">${cards}</div>
    <p class="hero-line-caption">
      ${ui.heroFlow}
      <span>${ui.heroCaption}</span>
    </p>
  </div>`;
}

function machineFrame(
  title: string,
  model: string,
  body: string,
  width = 220,
  height = 150,
): string {
  return `
<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${title}">
  <defs>
    <linearGradient id="gPanel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d7dee8"/>
      <stop offset="100%" stop-color="#9aa7b8"/>
    </linearGradient>
    <linearGradient id="gAccent" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${palette.accent}"/>
      <stop offset="100%" stop-color="${palette.accentLite}"/>
    </linearGradient>
  </defs>
  <rect x="4" y="18" width="${width - 8}" height="${height - 28}" rx="10" fill="url(#gPanel)" stroke="${palette.steelDark}" stroke-width="2"/>
  <rect x="4" y="4" width="${width - 8}" height="22" rx="6" fill="url(#gAccent)"/>
  <text x="14" y="19" fill="#f4fbf8" font-family="IBM Plex Sans, sans-serif" font-size="11" font-weight="700">${title}</text>
  <text x="${width - 12}" y="19" fill="#d7fff0" font-family="IBM Plex Mono, monospace" font-size="9" text-anchor="end">${model}</text>
  ${body}
</svg>`;
}

export function equipmentCardHtml(
  id: EquipmentId,
  title: string,
  model: string,
): string {
  const photo = EQUIPMENT_PHOTOS[id];
  if (photo) {
    return `
    <div class="equip-photo-card">
      <img src="${photo}" alt="${title}" loading="lazy" decoding="async" width="200" height="150" />
      <div class="equip-photo-label">
        <strong>${title}</strong>
        <span>${model}</span>
      </div>
    </div>`;
  }
  return equipmentSvg(id);
}

export function equipmentSvg(id: EquipmentId): string {
  switch (id) {
    case "tablet-press":
      return machineFrame(
        "Tablet Press",
        "SED-GY-D",
        `
        <circle cx="110" cy="88" r="34" fill="#6b7787" stroke="#2d3744" stroke-width="3"/>
        <circle cx="110" cy="88" r="16" fill="#cfd7e2"/>
        <g stroke="#2d3744" stroke-width="3">
          <line x1="110" y1="54" x2="110" y2="68"/>
          <line x1="110" y1="108" x2="110" y2="122"/>
          <line x1="76" y1="88" x2="90" y2="88"/>
          <line x1="130" y1="88" x2="144" y2="88"/>
        </g>
        <rect x="28" y="58" width="28" height="55" rx="4" fill="#b8c2cf"/>
        <rect x="164" y="58" width="28" height="55" rx="4" fill="#b8c2cf"/>
        <rect x="86" y="122" width="48" height="10" rx="2" fill="${palette.accent}"/>
        `,
      );
    case "capsule-filler":
      return machineFrame(
        "Capsule Filler",
        "SED-J",
        `
        <rect x="40" y="48" width="140" height="70" rx="6" fill="#b7c2d0" stroke="#334155" stroke-width="2"/>
        <ellipse cx="110" cy="48" rx="36" ry="12" fill="#94a3b8"/>
        <rect x="74" y="36" width="72" height="14" rx="3" fill="#64748b"/>
        <g fill="#e2e8f0">
          <circle cx="70" cy="78" r="6"/><circle cx="90" cy="78" r="6"/>
          <circle cx="110" cy="78" r="6"/><circle cx="130" cy="78" r="6"/>
          <circle cx="150" cy="78" r="6"/>
        </g>
        <rect x="55" y="100" width="110" height="8" fill="${palette.accentLite}"/>
        `,
      );
    case "capsule-polisher":
      return machineFrame(
        "Polisher",
        "SED",
        `
        <rect x="50" y="55" width="120" height="50" rx="22" fill="#aeb9c8" stroke="#334155" stroke-width="2"/>
        <path d="M60 80 Q110 55 160 80" fill="none" stroke="${palette.accent}" stroke-width="4"/>
        <circle cx="70" cy="80" r="5" fill="#fff"/><circle cx="150" cy="80" r="5" fill="#fff"/>
        `,
        220,
        140,
      );
    case "metal-detector":
      return machineFrame(
        "Metal Detector",
        "SED MD",
        `
        <rect x="55" y="50" width="110" height="70" rx="8" fill="#90a0b4" stroke="#1e293b" stroke-width="2"/>
        <rect x="75" y="68" width="70" height="34" rx="4" fill="${palette.bg}"/>
        <rect x="85" y="78" width="50" height="14" fill="${palette.warn}" opacity="0.85"/>
        <text x="110" y="89" text-anchor="middle" fill="#fff" font-size="9" font-family="IBM Plex Mono, monospace">SCAN</text>
        `,
      );
    case "pill-counter":
      return machineFrame(
        "Pill Counter",
        "SED Count",
        `
        <rect x="45" y="45" width="70" height="55" rx="4" fill="#b0bccb"/>
        <rect x="125" y="55" width="55" height="70" rx="6" fill="#cbd5e1" stroke="#334155"/>
        <g fill="${palette.accentLite}">
          <circle cx="60" cy="60" r="3"/><circle cx="72" cy="60" r="3"/>
          <circle cx="84" cy="60" r="3"/><circle cx="96" cy="60" r="3"/>
          <circle cx="66" cy="72" r="3"/><circle cx="78" cy="72" r="3"/>
          <circle cx="90" cy="72" r="3"/>
        </g>
        <rect x="138" y="95" width="28" height="22" fill="#94a3b8"/>
        `,
      );
    case "capping":
      return machineFrame(
        "Capping",
        "SED Cap",
        `
        <rect x="90" y="42" width="40" height="18" rx="3" fill="#64748b"/>
        <rect x="98" y="60" width="24" height="40" fill="#94a3b8"/>
        <rect x="85" y="100" width="50" height="22" rx="4" fill="#cbd5e1" stroke="#334155"/>
        <circle cx="110" cy="78" r="10" fill="${palette.accent}"/>
        `,
      );
    case "induction-sealer":
      return machineFrame(
        "Induction Seal",
        "SED Seal",
        `
        <rect x="60" y="48" width="100" height="28" rx="4" fill="#788797"/>
        <rect x="85" y="76" width="50" height="40" rx="6" fill="#c5d0de" stroke="#334155"/>
        <rect x="92" y="70" width="36" height="8" fill="${palette.warn}"/>
        <path d="M70 58 H150" stroke="#fbbf24" stroke-width="3" stroke-dasharray="4 3"/>
        `,
      );
    case "blister-packer":
      return machineFrame(
        "Blister Packer",
        "SED-P-A",
        `
        <rect x="35" y="55" width="150" height="55" rx="5" fill="#a8b4c4" stroke="#334155"/>
        <g fill="#e2e8f0" stroke="#475569">
          <rect x="48" y="68" width="22" height="16" rx="3"/>
          <rect x="78" y="68" width="22" height="16" rx="3"/>
          <rect x="108" y="68" width="22" height="16" rx="3"/>
          <rect x="138" y="68" width="22" height="16" rx="3"/>
        </g>
        <rect x="48" y="95" width="112" height="6" fill="${palette.accent}"/>
        `,
      );
    default:
      return machineFrame("Equipment", "SED", "");
  }
}

/** @deprecated Prefer heroLineHtml() — kept for type compat */
export function heroSvg(): string {
  return heroLineHtml();
}
