import type { Lang } from "./locale";
import type { EquipmentId } from "../game/types";

export interface UiMessages {
  tagline: string;
  heroTitle: string;
  heroBody: string;
  startLevel1: string;
  browseCatalog: string;
  lineStations: string;
  lineStationsLead: string;
  missions: string;
  foot: string;
  best: string;
  allMissions: string;
  target: string;
  shift: string;
  form: string;
  formTablet: string;
  formCapsule: string;
  goodUnits: string;
  lineEquipment: string;
  startRun: string;
  back: string;
  keepWindow: string;
  abort: string;
  goodUnitsHud: string;
  rejects: string;
  timeLeft: string;
  status: string;
  alarm: string;
  run: string;
  lineNominal: string;
  operatorTips: string;
  processControls: string;
  eventLog: string;
  ideal: string;
  health: string;
  batchReport: string;
  released: string;
  held: string;
  score: string;
  produced: string;
  quality: string;
  oee: string;
  downtime: string;
  retry: string;
  nextMission: string;
  backToHub: string;
  exploreSed: string;
  heroAlt: string;
  heroFlow: string;
  heroCaption: string;
  langAria: string;
  statusIdle: string;
  statusRunning: string;
  statusAlarm: string;
  statusDone: string;
}

export interface EquipMessages {
  name: string;
  role: string;
  tip: string;
  shortLabel: string;
}

export interface LevelMessages {
  title: string;
  subtitle: string;
  briefing: string;
  controls: Record<string, string>;
  events: Record<string, string>;
}

export interface Pack {
  ui: UiMessages;
  equipment: Record<EquipmentId, EquipMessages>;
  levels: Record<string, LevelMessages>;
  sim: {
    lineArmed: (title: string) => string;
    runStarted: string;
    outsideWindow: (label: string) => string;
    batchReleased: (oee: number) => string;
    batchHeld: (oee: number) => string;
  };
}

const en: Pack = {
  ui: {
    tagline: "Serious game · solid-dose equipment logic",
    heroTitle: "Run a pharmaceutical line. Keep every station in window.",
    heroBody:
      "Learn how SED Machines gear works together — tablet presses, capsule fillers, metal detectors, counters, cappers, induction sealers, and blister packers. Tune real process parameters, survive disturbances, and chase OEE.",
    startLevel1: "Start Level 1",
    browseCatalog: "Browse equipment catalog",
    lineStations: "Line stations",
    lineStationsLead: "Tap a mission below. These machines show up in the runs.",
    missions: "Missions",
    foot: "Inspired by SED Machines / SED Pharma production & packaging equipment. Training simulation — not a control system.",
    best: "BEST",
    allMissions: "All missions",
    target: "Target",
    shift: "Shift",
    form: "Form",
    formTablet: "tablet",
    formCapsule: "capsule",
    goodUnits: "good units",
    lineEquipment: "Line equipment",
    startRun: "Start run",
    back: "Back",
    keepWindow: "Keep parameters inside process window",
    abort: "Abort",
    goodUnitsHud: "Good units",
    rejects: "Rejects",
    timeLeft: "Time left",
    status: "Status",
    alarm: "ALARM",
    run: "RUN",
    lineNominal: "Line nominal. Watch for process disturbances.",
    operatorTips: "Operator tips",
    processControls: "Process controls",
    eventLog: "Event log",
    ideal: "ideal",
    health: "health",
    batchReport: "Batch report",
    released: "RELEASED — process capable",
    held: "HELD — out of window",
    score: "Score",
    produced: "Produced",
    quality: "Quality",
    oee: "OEE",
    downtime: "Downtime",
    retry: "Retry",
    nextMission: "Next mission",
    backToHub: "Back to hub",
    exploreSed: "Explore SED Machines",
    heroAlt: "SED pharmaceutical packaging production line",
    heroFlow: "Solid-dose flow: Press / Fill → Inspect → Count or Blister → Cap & Seal",
    heroCaption: "SED Machines · Ontario, CA showroom logic in playable form",
    langAria: "Language",
    statusIdle: "IDLE",
    statusRunning: "RUNNING",
    statusAlarm: "ALARM",
    statusDone: "DONE",
  },
  equipment: {
    "tablet-press": {
      name: "Rotary Tablet Press",
      role: "Compress granules into tablets at controlled force and speed",
      tip: "Too much force → capping/laminating. Too little → soft friable tablets.",
      shortLabel: "Tablet Press",
    },
    "capsule-filler": {
      name: "Capsule Filling Machine",
      role: "Orient empty shells, dose powder/granules, lock capsules",
      tip: "Fill weight drift rises when vacuum or tamping pressure leaves ideal band.",
      shortLabel: "Capsule Filler",
    },
    "capsule-polisher": {
      name: "Capsule Polisher",
      role: "Remove dust, polish shells before inspection and pack",
      tip: "Low polish time leaves dust → visual rejects downstream.",
      shortLabel: "Polisher",
    },
    "metal-detector": {
      name: "Pharma Metal Detector",
      role: "Inline ferrous / non-ferrous / stainless reject gate",
      tip: "Sensitivity too high → false rejects. Too low → miss contaminants.",
      shortLabel: "Metal Detect",
    },
    "pill-counter": {
      name: "Electronic Pill Counter",
      role: "Count tablets/capsules into bottles at target fill count",
      tip: "Speed vs accuracy tradeoff. Over-speed causes count errors.",
      shortLabel: "Pill Counter",
    },
    capping: {
      name: "Bottle Capping Machine",
      role: "Apply and torque caps onto counted bottles",
      tip: "Wrong torque → loose caps or crushed bottles / stripped threads.",
      shortLabel: "Cap / Seal",
    },
    "induction-sealer": {
      name: "Induction Sealing Machine",
      role: "Heat-seal foil liners for tamper-evident primary pack",
      tip: "Power and dwell must match bottle neck and liner type.",
      shortLabel: "Induction Seal",
    },
    "blister-packer": {
      name: "Thermoforming Blister Packer",
      role: "Form cavities, place product, seal foil, punch cards",
      tip: "Forming temp + seal pressure decide cavity integrity and seal strength.",
      shortLabel: "Blister",
    },
  },
  levels: {
    "L1-press": {
      title: "Level 1 — Tablet Press Startup",
      subtitle: "SED-GY-D rotary press calibration",
      briefing:
        "Granules wait in the hopper. Dial compression force and turret RPM into the process window so tablets leave the press hard enough for handling but not capped. Meet the batch target before the shift timer ends.",
      controls: {
        force: "Main compression",
        rpm: "Turret speed",
        feed: "Feeder fill",
      },
      events: {},
    },
    "L2-capsule": {
      title: "Level 2 — Capsule Fill Run",
      subtitle: "SED-J automatic capsule filler",
      briefing:
        "Empty gelatin shells (size 0) enter the dosing turret. Keep vacuum and tamping in band for ± fill accuracy, then polish dust before QC. Capsule lines fail quietly — watch reject climb.",
      controls: {
        vacuum: "Separation vacuum",
        tamp: "Tamping pressure",
        polish: "Polish dwell",
      },
      events: {
        "Powder density shift detected in hopper — check tamping.":
          "Powder density shift detected in hopper — check tamping.",
      },
    },
    "L3-bottle": {
      title: "Level 3 — Bottle Pack Line",
      subtitle: "Count → Cap → Induction seal",
      briefing:
        "Pressed tablets move through metal detection into electronic counting, capping, and induction sealing. Balance detector sensitivity against false rejects, and keep seal power matched to the liner.",
      controls: {
        sensitivity: "Metal detect sensitivity",
        countSpeed: "Counter throughput",
        torque: "Cap torque",
        sealPower: "Induction power",
      },
      events: {
        "Operator bumped sensitivity high — false rejects rising.":
          "Operator bumped sensitivity high — false rejects rising.",
        "Liner lot change. Re-check induction power.":
          "Liner lot change. Re-check induction power.",
      },
    },
    "L4-blister": {
      title: "Level 4 — Blister Pack Challenge",
      subtitle: "SED-P-A thermoforming packer",
      briefing:
        "Form PVC cavities, place capsules, seal ALU foil, punch cards. Forming temperature and seal pressure decide whether cavities collapse or seals peel. Hit output without soft seals.",
      controls: {
        formTemp: "Forming temperature",
        sealPressure: "Seal pressure",
        cycle: "Machine cycles",
      },
      events: {
        "Chiller lag — forming temp drifting cold.":
          "Chiller lag — forming temp drifting cold.",
      },
    },
    "L5-oee": {
      title: "Level 5 — Full Line OEE Drill",
      subtitle: "Solid-dose line under GMP pressure",
      briefing:
        "Run a mini solid-dose line: press → detect → count → cap → seal. OEE = Availability × Performance × Quality. Keep every station in window while disturbances hit. Pass only with strong quality and throughput.",
      controls: {
        force: "Compression force",
        rpm: "Press RPM",
        sensitivity: "Detector sensitivity",
        countSpeed: "Count speed",
        torque: "Cap torque",
        sealPower: "Seal power",
      },
      events: {
        "Feeder surge — compression drifted high.":
          "Feeder surge — compression drifted high.",
        "QA requests tighter metal detect — watch false rejects.":
          "QA requests tighter metal detect — watch false rejects.",
        "Cap chuck wear — torque falling.": "Cap chuck wear — torque falling.",
      },
    },
  },
  sim: {
    lineArmed: (title) => `Line armed: ${title}`,
    runStarted: "Run started. Monitor process window.",
    outsideWindow: (label) => `${label} outside process window`,
    batchReleased: (oee) => `Batch released. OEE ${oee}%`,
    batchHeld: (oee) => `Batch held. OEE ${oee}% — adjust process window.`,
  },
};

const zh: Pack = {
  ui: {
    tagline: "严肃游戏 · 固体制剂设备逻辑",
    heroTitle: "操控一条制药产线。把每台设备保持在工艺窗口内。",
    heroBody:
      "学习 SED Machines 设备如何协同：压片机、胶囊填充机、金属检测机、数粒机、旋盖机、电磁感应封口机与泡罩包装机。调节真实工艺参数，应对扰动，追求 OEE。",
    startLevel1: "开始第 1 关",
    browseCatalog: "浏览设备目录",
    lineStations: "产线工位",
    lineStationsLead: "选择下方任务。这些设备会出现在关卡中。",
    missions: "任务",
    foot: "灵感来自 SED Machines / SED Pharma 生产与包装设备。仅供培训模拟，非控制系统。",
    best: "最佳",
    allMissions: "全部任务",
    target: "目标",
    shift: "班次",
    form: "剂型",
    formTablet: "片剂",
    formCapsule: "胶囊",
    goodUnits: "合格产量",
    lineEquipment: "产线设备",
    startRun: "开始运行",
    back: "返回",
    keepWindow: "将参数保持在工艺窗口内",
    abort: "中止",
    goodUnitsHud: "合格产量",
    rejects: "废品",
    timeLeft: "剩余时间",
    status: "状态",
    alarm: "报警",
    run: "运行",
    lineNominal: "产线正常。留意工艺扰动。",
    operatorTips: "操作提示",
    processControls: "工艺控制",
    eventLog: "事件日志",
    ideal: "理想值",
    health: "健康度",
    batchReport: "批次报告",
    released: "放行 — 工艺能力达标",
    held: "暂扣 — 偏离工艺窗口",
    score: "得分",
    produced: "产量",
    quality: "质量",
    oee: "OEE",
    downtime: "停机",
    retry: "重试",
    nextMission: "下一关",
    backToHub: "返回主页",
    exploreSed: "了解 SED Machines",
    heroAlt: "SED 制药包装产线",
    heroFlow: "固体制剂流程：压片/填充 → 检验 → 数粒或泡罩 → 旋盖与封口",
    heroCaption: "SED Machines · 加州安大略展厅逻辑，可玩化呈现",
    langAria: "语言",
    statusIdle: "待机",
    statusRunning: "运行",
    statusAlarm: "报警",
    statusDone: "完成",
  },
  equipment: {
    "tablet-press": {
      name: "旋转式压片机",
      role: "以受控压力与速度将颗粒压制成片",
      tip: "压力过大 → 顶裂/分层。过小 → 片剂过软易碎。",
      shortLabel: "压片机",
    },
    "capsule-filler": {
      name: "胶囊填充机",
      role: "空壳定向、定量填充粉末/颗粒并锁合",
      tip: "真空或捣实压力偏离理想带时，装量漂移上升。",
      shortLabel: "胶囊填充",
    },
    "capsule-polisher": {
      name: "胶囊抛光机",
      role: "除粉抛光，便于检验与包装",
      tip: "抛光时间不足 → 粉尘残留 → 下游外观废品。",
      shortLabel: "抛光机",
    },
    "metal-detector": {
      name: "制药金属检测机",
      role: "在线铁/非铁/不锈钢异物剔除",
      tip: "灵敏度过高 → 误剔。过低 → 漏检污染物。",
      shortLabel: "金检",
    },
    "pill-counter": {
      name: "电子数粒机",
      role: "按目标粒数将片剂/胶囊装入瓶中",
      tip: "速度与精度权衡。过快会导致计数误差。",
      shortLabel: "数粒机",
    },
    capping: {
      name: "旋盖机",
      role: "对已数粒瓶施加并控制扭矩旋盖",
      tip: "扭矩不对 → 松盖，或压坏瓶体/滑牙。",
      shortLabel: "旋盖/封口",
    },
    "induction-sealer": {
      name: "电磁感应封口机",
      role: "热封铝箔垫片，实现防拆一次包装",
      tip: "功率与停留时间须匹配瓶颈与垫片类型。",
      shortLabel: "感应封口",
    },
    "blister-packer": {
      name: "热成型泡罩包装机",
      role: "成型腔体、落料、封铝箔、冲裁卡片",
      tip: "成型温度与热封压力决定腔体完整性与封合强度。",
      shortLabel: "泡罩机",
    },
  },
  levels: {
    "L1-press": {
      title: "第 1 关 — 压片机开机",
      subtitle: "SED-GY-D 旋转压片机校准",
      briefing:
        "料斗中已有颗粒。将主压力与转台转速调入工艺窗口，使片剂足够硬可转运又不过压顶裂。在班次计时结束前完成批量目标。",
      controls: {
        force: "主压缩力",
        rpm: "转台转速",
        feed: "加料填充",
      },
      events: {},
    },
    "L2-capsule": {
      title: "第 2 关 — 胶囊填充运行",
      subtitle: "SED-J 全自动胶囊填充机",
      briefing:
        "0号空明胶壳进入定量转台。保持真空与捣实在带内以保证装量精度，再抛光去粉后进入质控。胶囊线故障常很隐蔽 — 盯紧废品率。",
      controls: {
        vacuum: "分囊真空",
        tamp: "捣实压力",
        polish: "抛光停留",
      },
      events: {
        "Powder density shift detected in hopper — check tamping.":
          "料斗粉体密度偏移 — 请检查捣实压力。",
      },
    },
    "L3-bottle": {
      title: "第 3 关 — 瓶装包装线",
      subtitle: "数粒 → 旋盖 → 电磁感应封口",
      briefing:
        "压好的片剂经金检进入电子数粒、旋盖与感应封口。平衡检测灵敏度与误剔，封口功率需匹配垫片。",
      controls: {
        sensitivity: "金检灵敏度",
        countSpeed: "数粒产能",
        torque: "旋盖扭矩",
        sealPower: "感应功率",
      },
      events: {
        "Operator bumped sensitivity high — false rejects rising.":
          "操作员误调高灵敏度 — 误剔上升。",
        "Liner lot change. Re-check induction power.":
          "垫片批次更换。请复查感应功率。",
      },
    },
    "L4-blister": {
      title: "第 4 关 — 泡罩包装挑战",
      subtitle: "SED-P-A 热成型泡罩机",
      briefing:
        "成型 PVC 腔体、放入胶囊、封 ALU 铝箔、冲裁卡片。成型温度与封合压力决定腔体塌陷或封合剥离。在避免软封的前提下完成产量。",
      controls: {
        formTemp: "成型温度",
        sealPressure: "封合压力",
        cycle: "机器循环",
      },
      events: {
        "Chiller lag — forming temp drifting cold.":
          "冷水机滞后 — 成型温度偏低漂移。",
      },
    },
    "L5-oee": {
      title: "第 5 关 — 全线 OEE 演练",
      subtitle: "GMP 压力下的固体制剂线",
      briefing:
        "运行迷你固体制剂线：压片 → 金检 → 数粒 → 旋盖 → 封口。OEE = 可用率 × 表现 × 质量。扰动来袭时仍保持每台设备在窗口内。仅在质量与产量双强时通过。",
      controls: {
        force: "压缩力",
        rpm: "压片转速",
        sensitivity: "检测灵敏度",
        countSpeed: "数粒速度",
        torque: "旋盖扭矩",
        sealPower: "封口功率",
      },
      events: {
        "Feeder surge — compression drifted high.": "加料浪涌 — 压缩力偏高。",
        "QA requests tighter metal detect — watch false rejects.":
          "QA 要求更严金检 — 留意误剔。",
        "Cap chuck wear — torque falling.": "旋盖头磨损 — 扭矩下降。",
      },
    },
  },
  sim: {
    lineArmed: (title) => `产线就绪：${title}`,
    runStarted: "运行开始。监控工艺窗口。",
    outsideWindow: (label) => `${label} 偏离工艺窗口`,
    batchReleased: (oee) => `批次放行。OEE ${oee}%`,
    batchHeld: (oee) => `批次暂扣。OEE ${oee}% — 请回调工艺窗口。`,
  },
};

const packs: Record<Lang, Pack> = { en, zh };

export function pack(lang: Lang): Pack {
  return packs[lang];
}
