export type Lang = "en" | "zh";

const STORAGE_KEY = "sed-line-pilot-lang";

let current: Lang = detectInitial();

function detectInitial(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "en" || saved === "zh") return saved;
  } catch {
    /* ignore */
  }
  const nav = navigator.language?.toLowerCase() ?? "en";
  return nav.startsWith("zh") ? "zh" : "en";
}

export function getLang(): Lang {
  return current;
}

export function setLang(lang: Lang): void {
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* ignore */
  }
  document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
}

export function applyDocumentLang(): void {
  document.documentElement.lang = current === "zh" ? "zh-CN" : "en";
}
