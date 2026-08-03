import type { EquipmentId } from "./types";

const palette = {
  steel: "#8a97a8",
  steelDark: "#4a5563",
  accent: "#0f6e56",
  accentLite: "#1fa37a",
  glass: "#c8e7ff",
  warn: "#c45c26",
  bg: "#1a2332",
};

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

export function heroSvg(): string {
  return `
<svg viewBox="0 0 960 420" xmlns="http://www.w3.org/2000/svg" class="hero-art" role="img" aria-label="SED solid dose production line">
  <defs>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#243247"/>
      <stop offset="100%" stop-color="#121a26"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0f6e56" stop-opacity="0"/>
      <stop offset="50%" stop-color="#1fa37a" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#0f6e56" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#d5dde8"/>
      <stop offset="100%" stop-color="#8b98a8"/>
    </linearGradient>
  </defs>
  <rect width="960" height="420" fill="url(#floor)"/>
  <rect y="300" width="960" height="120" fill="#0d141f"/>
  <rect y="300" width="960" height="18" fill="url(#glow)"/>

  <!-- conveyor -->
  <rect x="40" y="268" width="880" height="18" rx="4" fill="#3b4658"/>
  <g fill="#1fa37a" opacity="0.7">
    <rect x="60" y="272" width="28" height="10" rx="2"/>
    <rect x="120" y="272" width="28" height="10" rx="2"/>
    <rect x="180" y="272" width="28" height="10" rx="2"/>
    <rect x="240" y="272" width="28" height="10" rx="2"/>
    <rect x="300" y="272" width="28" height="10" rx="2"/>
    <rect x="360" y="272" width="28" height="10" rx="2"/>
    <rect x="420" y="272" width="28" height="10" rx="2"/>
    <rect x="480" y="272" width="28" height="10" rx="2"/>
    <rect x="540" y="272" width="28" height="10" rx="2"/>
    <rect x="600" y="272" width="28" height="10" rx="2"/>
    <rect x="660" y="272" width="28" height="10" rx="2"/>
    <rect x="720" y="272" width="28" height="10" rx="2"/>
    <rect x="780" y="272" width="28" height="10" rx="2"/>
    <rect x="840" y="272" width="28" height="10" rx="2"/>
  </g>

  <!-- press -->
  <g transform="translate(70,110)">
    <rect width="140" height="150" rx="10" fill="url(#steel)" stroke="#334155" stroke-width="3"/>
    <rect width="140" height="28" fill="#0f6e56"/>
    <text x="12" y="19" fill="#fff" font-size="12" font-family="IBM Plex Sans, sans-serif" font-weight="700">Tablet Press</text>
    <circle cx="70" cy="95" r="36" fill="#64748b" stroke="#1e293b" stroke-width="3"/>
    <circle cx="70" cy="95" r="14" fill="#e2e8f0"/>
  </g>

  <!-- detector -->
  <g transform="translate(260,130)">
    <rect width="120" height="130" rx="10" fill="url(#steel)" stroke="#334155" stroke-width="3"/>
    <rect width="120" height="28" fill="#0f6e56"/>
    <text x="10" y="19" fill="#fff" font-size="12" font-family="IBM Plex Sans, sans-serif" font-weight="700">Metal Detect</text>
    <rect x="25" y="55" width="70" height="45" fill="#0f172a"/>
    <rect x="35" y="68" width="50" height="18" fill="#c45c26"/>
  </g>

  <!-- counter -->
  <g transform="translate(430,120)">
    <rect width="130" height="140" rx="10" fill="url(#steel)" stroke="#334155" stroke-width="3"/>
    <rect width="130" height="28" fill="#0f6e56"/>
    <text x="12" y="19" fill="#fff" font-size="12" font-family="IBM Plex Sans, sans-serif" font-weight="700">Pill Counter</text>
    <rect x="18" y="50" width="50" height="70" fill="#94a3b8"/>
    <rect x="78" y="70" width="36" height="55" rx="4" fill="#cbd5e1" stroke="#334155"/>
  </g>

  <!-- cap + seal -->
  <g transform="translate(610,125)">
    <rect width="120" height="135" rx="10" fill="url(#steel)" stroke="#334155" stroke-width="3"/>
    <rect width="120" height="28" fill="#0f6e56"/>
    <text x="18" y="19" fill="#fff" font-size="12" font-family="IBM Plex Sans, sans-serif" font-weight="700">Cap / Seal</text>
    <rect x="48" y="55" width="24" height="40" fill="#64748b"/>
    <rect x="35" y="95" width="50" height="28" rx="4" fill="#cbd5e1"/>
  </g>

  <!-- blister -->
  <g transform="translate(780,135)">
    <rect width="130" height="125" rx="10" fill="url(#steel)" stroke="#334155" stroke-width="3"/>
    <rect width="130" height="28" fill="#0f6e56"/>
    <text x="14" y="19" fill="#fff" font-size="12" font-family="IBM Plex Sans, sans-serif" font-weight="700">Blister</text>
    <g fill="#e2e8f0" stroke="#475569">
      <rect x="18" y="55" width="20" height="14" rx="3"/>
      <rect x="44" y="55" width="20" height="14" rx="3"/>
      <rect x="70" y="55" width="20" height="14" rx="3"/>
      <rect x="96" y="55" width="20" height="14" rx="3"/>
      <rect x="18" y="78" width="20" height="14" rx="3"/>
      <rect x="44" y="78" width="20" height="14" rx="3"/>
      <rect x="70" y="78" width="20" height="14" rx="3"/>
      <rect x="96" y="78" width="20" height="14" rx="3"/>
    </g>
  </g>

  <text x="48" y="360" fill="#9fb0c3" font-size="14" font-family="IBM Plex Sans, sans-serif">
    Solid-dose flow: Press / Fill → Inspect → Count or Blister → Cap &amp; Seal
  </text>
  <text x="48" y="388" fill="#1fa37a" font-size="13" font-family="IBM Plex Mono, monospace">
    SED Machines · Ontario, CA showroom logic in playable form
  </text>
</svg>`;
}
