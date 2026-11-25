/* ============================================================
   WEB AUDIO API DARK FANTASY SOUND ENGINE (100% Offline)
   ============================================================ */

const SLAudio = (() => {
  let ctx = null;

  function ensureCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  }

  function isEnabled() {
    const s = SLStorage.get().settings;
    return s.soundEnabled !== false;
  }

  function vol(scale = 1) {
    const s = SLStorage.get().settings;
    return Math.max(0.01, Math.min(1, (s.volume ?? 0.55) * scale));
  }

  function tone(freq, type, dur, gainVal, delay = 0, freqEnd = null) {
    if (!isEnabled()) return;
    const c = ensureCtx();
    if (!c) return;
    const t0 = c.currentTime + delay;
    const osc = c.createOscillator();
    const g = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.linearRampToValueAtTime(vol(gainVal), t0 + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(c.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  function playClick() {
    tone(520, "triangle", 0.06, 0.22, 0, 380);
  }

  function playSlash() {
    tone(320, "sawtooth", 0.14, 0.25, 0, 110);
    tone(660, "triangle", 0.12, 0.2, 0.04, 880);
  }

  function playCrit() {
    tone(440, "sawtooth", 0.16, 0.30, 0, 880);
    tone(660, "square", 0.18, 0.22, 0.05, 1320);
    tone(140, "sine", 0.26, 0.35, 0, 55);
  }

  function playWrong() {
    tone(190, "sawtooth", 0.22, 0.30, 0, 95);
    tone(145, "square", 0.25, 0.22, 0.08, 72);
  }

  function playShield() {
    tone(480, "sine", 0.18, 0.28, 0, 720);
    tone(960, "triangle", 0.22, 0.22, 0.06, 620);
  }

  function playFreeze() {
    tone(1200, "sine", 0.22, 0.22, 0, 1800);
    tone(1600, "triangle", 0.28, 0.18, 0.08, 920);
  }

  function playHeal() {
    tone(440, "sine", 0.16, 0.22, 0, 554);
    tone(554, "sine", 0.16, 0.22, 0.09, 659);
    tone(659, "sine", 0.24, 0.24, 0.18, 880);
  }

  function playFever() {
    [330, 440, 554, 659, 880].forEach((f, i) => {
      tone(f, "triangle", 0.22, 0.25, i * 0.055);
    });
  }

  function playBossIntro() {
    tone(110, "sawtooth", 0.55, 0.32, 0, 75);
    tone(165, "sawtooth", 0.55, 0.24, 0.08, 120);
    tone(220, "triangle", 0.65, 0.22, 0.2, 180);
  }

  function playVictory() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((n, i) => tone(n, "triangle", 0.28, 0.28, i * 0.1));
  }

  function playDefeat() {
    const notes = [330, 293.66, 261.63, 196];
    notes.forEach((n, i) => tone(n, "sawtooth", 0.30, 0.22, i * 0.14));
  }

  function playCardSelect() {
    tone(587.33, "sine", 0.14, 0.24, 0, 880);
    tone(880, "triangle", 0.22, 0.22, 0.08, 1174.66);
  }

  return {
    playClick, playSlash, playCrit, playWrong, playShield,
    playFreeze, playHeal, playFever, playBossIntro,
    playVictory, playDefeat, playCardSelect
  };
})();
