import type { EquipmentDef, EquipmentId } from "./types";

export const EQUIPMENT: Record<EquipmentId, EquipmentDef> = {
  "tablet-press": {
    id: "tablet-press",
    name: "Rotary Tablet Press",
    model: "SED-GY-D",
    role: "Compress granules into tablets at controlled force and speed",
    tip: "Too much force → capping/laminating. Too little → soft friable tablets.",
  },
  "capsule-filler": {
    id: "capsule-filler",
    name: "Capsule Filling Machine",
    model: "SED-J Series",
    role: "Orient empty shells, dose powder/granules, lock capsules",
    tip: "Fill weight drift rises when vacuum or tamping pressure leaves ideal band.",
  },
  "capsule-polisher": {
    id: "capsule-polisher",
    name: "Capsule Polisher",
    model: "SED Polish Line",
    role: "Remove dust, polish shells before inspection and pack",
    tip: "Low polish time leaves dust → visual rejects downstream.",
  },
  "metal-detector": {
    id: "metal-detector",
    name: "Pharma Metal Detector",
    model: "SED Metal Detect",
    role: "Inline ferrous / non-ferrous / stainless reject gate",
    tip: "Sensitivity too high → false rejects. Too low → miss contaminants.",
  },
  "pill-counter": {
    id: "pill-counter",
    name: "Electronic Pill Counter",
    model: "SED Count Line",
    role: "Count tablets/capsules into bottles at target fill count",
    tip: "Speed vs accuracy tradeoff. Over-speed causes count errors.",
  },
  capping: {
    id: "capping",
    name: "Bottle Capping Machine",
    model: "SED Capper",
    role: "Apply and torque caps onto counted bottles",
    tip: "Wrong torque → loose caps or crushed bottles / stripped threads.",
  },
  "induction-sealer": {
    id: "induction-sealer",
    name: "Induction Sealing Machine",
    model: "SED Induction Seal",
    role: "Heat-seal foil liners for tamper-evident primary pack",
    tip: "Power and dwell must match bottle neck and liner type.",
  },
  "blister-packer": {
    id: "blister-packer",
    name: "Thermoforming Blister Packer",
    model: "SED-P-A",
    role: "Form cavities, place product, seal foil, punch cards",
    tip: "Forming temp + seal pressure decide cavity integrity and seal strength.",
  },
};

export const LINE_FLOW_TABLET = [
  "tablet-press",
  "metal-detector",
  "pill-counter",
  "capping",
  "induction-sealer",
] as const satisfies readonly EquipmentId[];

export const LINE_FLOW_CAPSULE = [
  "capsule-filler",
  "capsule-polisher",
  "metal-detector",
  "blister-packer",
] as const satisfies readonly EquipmentId[];
