/* ============================================================
   STORAGE ENGINE – LocalStorage + Export/Import Save JSON
   ============================================================ */

const SLStorage = (() => {
  const KEY = "socialism_legends_save_v1";

  function defaultState() {
    return {
      version: 1,
      heroName: "Chiến Binh Tri Thức",
      level: 1,
      exp: 0,
      totalCorrect: 0,
      totalAnswered: 0,
      bestComboEver: 0,
      unlockedChapters: [3],
      clearedStages: {},     // { "3-1": { rank, score, accuracy, bestCombo, attempts } }
      clearedBosses: [],     // [3, 4, ...]
      equippedSkills: [],    // max 3 skill IDs
      bounty: {},            // { [qId]: { id, chapter, stage, wrongCount, lastWrongText, consecutiveCorrect, status: 'active'|'cleared', updatedAt } }
      questionStats: {},     // { [qId]: { attempts, correct, wrong, totalTime } }
      achievements: [],      // ['first_blood', ...]
      titles: ["Người Khai Mở"],
      endlessRecord: { bestFloor: 0, bestCorrect: 0 },
      bossRushRecord: { bestCleared: 0, bestAccuracy: 0 },
      examHistory: [],       // [{ date, total, correct, score10, durationSec }]
      settings: {
        baseTime: 15,
        maxHearts: 3,
        dmgTier1: 200,
        dmgTier2: 150,
        dmgTier3: 120,
        dmgTier4: 100,
        autoNextDelay: 1500,
        manualNext: false,
        soundEnabled: true,
        volume: 0.55,
        unlockAllMode: false
      }
    };
  }

  let state = load();

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      const base = defaultState();
      return {
        ...base,
        ...parsed,
        settings: { ...base.settings, ...(parsed.settings || {}) },
        endlessRecord: { ...base.endlessRecord, ...(parsed.endlessRecord || {}) },
        bossRushRecord: { ...base.bossRushRecord, ...(parsed.bossRushRecord || {}) }
      };
    } catch (e) {
      console.warn("Save load failed, using defaults:", e);
      return defaultState();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch (e) {
      console.warn("LocalStorage save error:", e);
    }
  }

  function get() { return state; }

  function update(mutator) {
    mutator(state);
    save();
    return state;
  }

  function resetAll() {
    state = defaultState();
    save();
    return state;
  }

  function exportSaveFile() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `socialism_legends_save_${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function importSaveJson(text) {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || typeof parsed.level !== "number") {
      throw new Error("Tệp lưu không hợp lệ hoặc bị hỏng cấu trúc.");
    }
    const base = defaultState();
    state = {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      endlessRecord: { ...base.endlessRecord, ...(parsed.endlessRecord || {}) },
      bossRushRecord: { ...base.bossRushRecord, ...(parsed.bossRushRecord || {}) }
    };
    save();
    return state;
  }

  return { get, save, update, resetAll, exportSaveFile, importSaveJson, defaultState };
})();
