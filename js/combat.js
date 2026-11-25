/* ============================================================
   UNIFIED COMBAT ENGINE
   Powers: Campaign, Boss Arena, Bounty Hunt, Boss Rush, Endless Tower
   ============================================================ */

const SLCombat = (() => {
  let run = null;
  let timerHandle = null;
  let freezeTimeout = null;
  let fogTimeout = null;
  let disorientTimeout = null;
  let nextTimeout = null;

  function calcBalancedHP(n, isBoss) {
    const count = Math.max(1, n);
    const maxCritSum = Math.min(count, 4) * 200 + Math.max(0, count - 4) * 250;
    const ratio = isBoss ? 0.80 : 0.78;
    return Math.max(400, Math.round(maxCritSum * ratio));
  }

  function clearAllTimers() {
    if (timerHandle) { clearInterval(timerHandle); timerHandle = null; }
    if (freezeTimeout) { clearTimeout(freezeTimeout); freezeTimeout = null; }
    if (fogTimeout) { clearTimeout(fogTimeout); fogTimeout = null; }
    if (disorientTimeout) { clearTimeout(disorientTimeout); disorientTimeout = null; }
    if (nextTimeout) { clearTimeout(nextTimeout); nextTimeout = null; }
  }

  function isActive() { return run !== null; }

  function abort() {
    clearAllTimers();
    run = null;
  }

  function start(config) {
    clearAllTimers();
    const st = SLStorage.get();
    const cfg = st.settings;

    const mode = config.mode; // 'campaign' | 'boss' | 'bounty' | 'boss_rush' | 'endless'
    const chapter = config.chapter || 3;
    const stage = config.stage || 1;
    const boss = mode === "boss" || mode === "boss_rush" ? SLBosses.get(chapter) : null;

    let deck = [];
    let monsterName = "";
    let monsterSub = "";
    let monsterArt = "";
    let arenaClass = "arena-bg-ch" + chapter;
    let timeLimit = cfg.baseTime || 15;
    let maxHearts = cfg.maxHearts || 3;

    if (mode === "campaign") {
      deck = SLQuestions.buildStageDeck(chapter, stage);
      const chMeta = SLQuestions.getChapterMeta(chapter);
      const stMeta = SLQuestions.getStageMeta(chapter, stage);
      monsterName = chMeta.monsterNames[(stage - 1) % chMeta.monsterNames.length] || "Quái Vật Tri Thức";
      monsterSub = `Chương ${chapter} • Ải ${chapter}.${stage} (${stMeta ? stMeta.groupTitle : ""})`;
      monsterArt = SLArt.monsterSVG(chapter, stage);
      arenaClass = chMeta.arenaClass;
    } else if (mode === "boss" || mode === "boss_rush") {
      deck = SLQuestions.buildBossDeck(chapter, boss.questionCount);
      monsterName = boss.name;
      monsterSub = boss.title;
      monsterArt = SLArt.bossSVG(chapter);
      arenaClass = "arena-bg-boss";
      timeLimit = boss.timePerQuestion;
    } else if (mode === "bounty") {
      const targets = SLProgression.getActiveBounties(config.bountyChapter ?? null);
      if (targets.length === 0) {
        SLApp.toast("Không còn mục tiêu truy nã nào cần tiêu diệt!", "info");
        return;
      }
      const qs = targets.map(b => SLQuestions.getById(b.id)).filter(Boolean);
      deck = SLQuestions.shuffle(qs).map(q => SLQuestions.prepareQuestion(q));
      monsterName = "Quái Tinh Anh Truy Nã";
      monsterSub = config.bountyChapter ? `Săn Truy Nã • Chương ${config.bountyChapter}` : "Săn Truy Nã Toàn Lục Địa";
      monsterArt = SLArt.monsterSVG(targets[0].chapter || 5, 2);
      arenaClass = "arena-bg-ch5";
      maxHearts = Math.max(3, cfg.maxHearts || 3);
    } else if (mode === "endless") {
      deck = SLQuestions.shuffle(SLQuestions.getAll()).map(q => SLQuestions.prepareQuestion(q));
      monsterName = "Hộ Vệ Tầng 1";
      monsterSub = "Tháp Vô Tận • Chế độ Hardcore (1 Tim)";
      monsterArt = SLArt.monsterSVG(6, 1);
      arenaClass = "arena-bg-ch6";
      maxHearts = 1;
      timeLimit = 14;
    }

    const maxHP = mode === "endless" ? 999999 : calcBalancedHP(deck.length, mode === "boss" || mode === "boss_rush");

    // Prepare 1-use-per-stage skill charges from equipped skills
    const equipped = (st.equippedSkills || []).slice(0, 3);
    const skillCharges = {};
    equipped.forEach(id => { skillCharges[id] = 1; });

    run = {
      mode,
      chapter,
      stage,
      boss,
      bossRushQueue: config.bossRushQueue || [],
      bossRushCleared: config.bossRushCleared || 0,
      bountyChapter: config.bountyChapter ?? null,
      deck,
      qIndex: 0,
      monsterName,
      monsterSub,
      monsterArt,
      arenaClass,
      maxHP,
      hp: maxHP,
      maxHearts,
      hearts: maxHearts,
      baseTimeLimit: timeLimit,
      currentTimeLimit: timeLimit,
      timeLeft: timeLimit,
      elapsedOnQ: 0,
      frozen: false,
      paused: false,
      answered: false,
      waitingManualNext: false,
      combo: 0,
      maxCombo: 0,
      vampStreak: 0,
      correctCount: 0,
      wrongCount: 0,
      totalElapsed: 0,
      bountiesEliminatedThisRun: 0,
      endlessFloor: 1,
      activeDebuff: null,
      equipped,
      skillCharges,
      eliminatedKeys: [],
      foggedKey: null,
      currentQ: null,
      pickedSkillId: null
    };

    if (mode === "boss" || mode === "boss_rush") {
      showBossIntro(boss, () => {
        renderArenaShell();
        loadQuestion();
      });
    } else {
      renderArenaShell();
      loadQuestion();
    }
  }

  function showBossIntro(boss, onBegin) {
    SLAudio.playBossIntro();
    const modal = document.getElementById("modal-overlay");
    const debuffChips = boss.debuffs.map(d => {
      const info = SLBosses.getDebuff(d);
      return `<span class="debuff-pill">${info.name}</span>`;
    }).join("");

    modal.innerHTML = `
      <div class="boss-intro-box boss-reveal">
        <div style="font-size:12px;font-weight:800;letter-spacing:1.4px;color:#fca5a5;text-transform:uppercase;margin-bottom:6px;">
          ⚠ CẢNH BÁO BOSS CUỐI CHƯƠNG ⚠
        </div>
        <div style="width:185px;height:185px;margin:6px auto;">${SLArt.bossSVG(boss.chapter)}</div>
        <h2 class="fantasy-title" style="font-size:30px;color:#fef08a;margin-top:4px;">${boss.name}</h2>
        <div style="color:#fda4af;font-size:14px;font-weight:600;margin-bottom:10px;">${boss.title}</div>
        <p style="font-style:italic;color:#cbd5e1;font-size:14px;margin-bottom:14px;">“${boss.introQuote}”</p>
        <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin-bottom:12px;font-size:13px;color:#e2e8f0;">
          <span class="q-chip">📜 ${boss.questionCount} câu hỏi</span>
          <span class="q-chip">⏱ ${boss.timePerQuestion} giây/câu</span>
        </div>
        <div style="display:flex;justify-content:center;gap:8px;flex-wrap:wrap;margin-bottom:18px;">
          ${debuffChips}
        </div>
        <div class="modal-actions">
          <button class="btn btn-crimson btn-lg" id="btn-boss-fight">⚔️ Bắt Đầu Quyết Chiến</button>
          <button class="btn btn-ghost" id="btn-boss-back">Quay Lại</button>
        </div>
      </div>
    `;
    modal.classList.remove("hidden");

    document.getElementById("btn-boss-fight").onclick = () => {
      SLAudio.playClick();
      modal.classList.add("hidden");
      onBegin();
    };
    document.getElementById("btn-boss-back").onclick = () => {
      SLAudio.playClick();
      modal.classList.add("hidden");
      abort();
      SLApp.go("stages", { chapter: boss.chapter });
    };
  }

  function renderArenaShell() {
    const vp = document.getElementById("screen-viewport");
    vp.className = "screen-viewport combat-full screen-enter";
    const isBoss = run.mode === "boss" || run.mode === "boss_rush";

    vp.innerHTML = `
      <div class="combat-wrapper" id="combat-root">
        <!-- Top Monster HUD -->
        <div class="combat-top-hud">
          <div class="combat-stage-pill">
            <span class="tag" id="hud-mode-tag">${getModeLabel()}</span>
            <span class="sub" id="hud-progress-sub">Câu 1 / ${run.deck.length}</span>
          </div>

          <div class="monster-hp-block">
            <div class="monster-hp-header">
              <div class="monster-name" id="hud-monster-name">${run.monsterName}</div>
              <div class="monster-hp-text" id="hud-hp-text">${run.mode === "endless" ? "Tầng 1" : `${run.hp} / ${run.maxHP} HP`}</div>
            </div>
            <div class="hp-bar-outer">
              <div class="hp-bar-trail" id="hud-hp-trail"></div>
              <div class="hp-bar-fill ${isBoss ? "boss-hp" : ""}" id="hud-hp-fill"></div>
            </div>
          </div>

          <div style="display:flex;gap:8px;">
            <button class="btn btn-ghost btn-sm" id="btn-combat-pause" title="Tạm dừng (ESC)">⏸ Tạm Dừng</button>
          </div>
        </div>

        <!-- Middle 3-Column Arena -->
        <div class="combat-mid-grid">
          <!-- Left: Hero & Skills -->
          <div class="side-hud-card">
            <div>
              <div class="hero-row">
                <div class="hero-avatar-sm">${SLArt.heroAvatarSVG()}</div>
                <div>
                  <div style="font-weight:700;font-size:13.5px;color:var(--gold-bright);">${escapeHtml(SLStorage.get().heroName)}</div>
                  <div style="font-size:11.5px;color:var(--text-muted);">Cấp ${SLStorage.get().level}</div>
                </div>
              </div>
              <div style="margin-top:10px;">
                <div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;">SINH LỰC (TIM)</div>
                <div class="hearts-row" id="hud-hearts"></div>
              </div>
              <div class="combo-box" style="margin-top:10px;">
                <div>
                  <div style="font-size:11px;color:var(--text-muted);">CHUỖI COMBO</div>
                  <div style="font-size:11px;color:#fb923c;" id="hud-combo-hint">Đạt 5 → Fever</div>
                </div>
                <div class="combo-val" id="hud-combo-val">x0</div>
              </div>
            </div>

            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px;letter-spacing:0.6px;">KỸ NĂNG TRANG BỊ (1 LẦN/ẢI)</div>
              <div class="skills-dock" id="hud-skills-dock"></div>
            </div>
          </div>

          <!-- Center: Visual Stage -->
          <div class="arena-stage ${run.arenaClass}" id="arena-stage">
            <canvas id="fx-canvas"></canvas>
            <div class="arena-debuff-banner" id="arena-debuff-banner"></div>
            <div class="monster-sprite-wrap ${isBoss ? "boss-size" : ""}" id="monster-sprite">
              ${run.monsterArt}
            </div>
            <div class="damage-popup-layer" id="dmg-popup-layer"></div>
          </div>

          <!-- Right: Timer & Multipliers -->
          <div class="side-hud-card">
            <div class="timer-ring-wrap">
              <div style="font-size:11px;color:var(--text-muted);letter-spacing:0.8px;">THỜI GIAN CÒN LẠI</div>
              <div class="timer-number" id="hud-timer">${run.baseTimeLimit.toFixed(1)}s</div>
              <div class="bar-track" style="height:8px;">
                <div class="bar-fill gold" id="hud-timer-bar" style="width:100%;"></div>
              </div>
            </div>

            <div>
              <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;">HỆ SỐ SÁT THƯƠNG HIỆN TẠI</div>
              <div class="mult-badge crit" id="hud-mult-badge">⚡ CHÍ MẠNG 200%</div>
            </div>

            <div class="fever-status-box" id="hud-fever-box">
              Fever Mode: Chưa kích hoạt (0/5)
            </div>
          </div>
        </div>

        <!-- Bottom: Question & 4 Options -->
        <div class="question-box" id="question-box">
          <div class="question-meta-bar" id="q-meta-bar"></div>
          <div class="question-text" id="q-text"></div>
          <div class="answers-grid" id="answers-grid"></div>
          <div id="manual-next-wrap" style="display:none;margin-top:10px;text-align:right;">
            <button class="btn btn-gold btn-sm" id="btn-manual-next">Câu Tiếp Theo (Enter) →</button>
          </div>
        </div>

        <!-- Rage / Fever Meter Footer -->
        <div class="rage-footer">
          <span style="font-weight:700;color:#fbbf24;white-space:nowrap;">🔥 THANH NỘ (FEVER)</span>
          <div class="rage-track"><div class="rage-fill" id="hud-rage-fill"></div></div>
          <span id="hud-rage-text" style="color:var(--text-muted);white-space:nowrap;">0 / 5</span>
          <span style="color:var(--text-muted);font-size:11.5px;display:inline-block;">Phím tắt: 1–4 / A–D • Q / W kỹ năng • ESC tạm dừng</span>
        </div>
      </div>
    `;

    document.getElementById("btn-combat-pause").onclick = () => togglePause();
    const btnManual = document.getElementById("btn-manual-next");
    if (btnManual) btnManual.onclick = () => proceedNext();

    updateHeartsUI();
    updateComboUI();
    updateSkillsUI();
  }

  function getModeLabel() {
    if (run.mode === "campaign") return `CHIẾN DỊCH • ẢI ${run.chapter}.${run.stage}`;
    if (run.mode === "boss") return `BOSS CHƯƠNG ${run.chapter}`;
    if (run.mode === "boss_rush") return `BOSS RUSH (${run.bossRushCleared + 1}/5)`;
    if (run.mode === "bounty") return "SĂN TRUY NÃ • QUÁI TINH ANH";
    if (run.mode === "endless") return `THÁP VÔ TẬN • TẦNG ${run.endlessFloor}`;
    return "CHIẾN ĐẤU";
  }

  function loadQuestion() {
    clearAllTimers();
    if (!run) return;

    // Endless tower wraps reshuffled deck infinitely
    if (run.mode === "endless") {
      if (run.qIndex >= run.deck.length) {
        run.deck = SLQuestions.shuffle(SLQuestions.getAll()).map(q => SLQuestions.prepareQuestion(q));
        run.qIndex = 0;
      }
      run.baseTimeLimit = Math.max(7, 14 - Math.floor((run.endlessFloor - 1) / 3));
      const isBossFloor = run.endlessFloor % 10 === 0;
      run.monsterName = isBossFloor ? `Boss Tầng ${run.endlessFloor}` : `Hộ Vệ Tầng ${run.endlessFloor}`;
      document.getElementById("hud-mode-tag").textContent = getModeLabel();
      document.getElementById("hud-monster-name").textContent = run.monsterName;
      document.getElementById("hud-hp-text").textContent = `Tầng ${run.endlessFloor} • Đúng ${run.correctCount}`;
      const chVis = 3 + ((run.endlessFloor - 1) % 5);
      document.getElementById("monster-sprite").innerHTML = isBossFloor
        ? SLArt.bossSVG(chVis)
        : SLArt.monsterSVG(chVis, ((run.endlessFloor - 1) % 4) + 1);
    } else if (run.qIndex >= run.deck.length) {
      finishRunByDeckEnd();
      return;
    }

    const q = run.deck[run.qIndex];
    run.currentQ = q;
    run.answered = false;
    run.waitingManualNext = false;
    run.frozen = false;
    run.eliminatedKeys = [];
    run.foggedKey = null;
    run.activeDebuff = null;

    // Determine Boss / Endless Floor 10 Debuffs
    let debuff = null;
    if (run.mode === "boss" || run.mode === "boss_rush") {
      debuff = SLBosses.getScheduledDebuff(run.boss, run.qIndex);
    } else if (run.mode === "endless" && run.endlessFloor % 10 === 0) {
      const dList = ["fog", "disorient", "haste"];
      debuff = SLBosses.getDebuff(dList[(run.endlessFloor / 10) % dList.length]);
    }
    run.activeDebuff = debuff;

    run.currentTimeLimit = (debuff && debuff.id === "haste") ? 7 : run.baseTimeLimit;
    run.timeLeft = run.currentTimeLimit;
    run.elapsedOnQ = 0;

    // Fog debuff: obscure 1 WRONG option for first 3s
    if (debuff && debuff.id === "fog") {
      const wrongKeys = ["A", "B", "C", "D"].filter(k => k !== q.correctKey);
      run.foggedKey = wrongKeys[Math.floor(Math.random() * wrongKeys.length)];
      fogTimeout = setTimeout(() => {
        if (!run || run.answered) return;
        run.foggedKey = null;
        const btn = document.querySelector(`.answer-btn[data-key="${run.foggedKey}"]`);
        document.querySelectorAll(".answer-btn.fogged").forEach(el => el.classList.remove("fogged"));
      }, 3000);
    }

    // Disorient debuff: reshuffle answers after 1.1s (safe on composite questions!)
    if (debuff && debuff.id === "disorient") {
      disorientTimeout = setTimeout(() => {
        if (!run || run.answered || run.paused) return;
        if (run.currentQ.isComposite) {
          showPopup("MIỄN NHIỄM LẠC HƯỚNG!", "norm");
          return;
        }
        run.currentQ = SLQuestions.reshufflePreparedQuestion(run.currentQ);
        renderAnswersGrid();
        showPopup("⚡ ĐÁNH LẠC HƯỚNG!", "miss");
      }, 1100);
    }

    document.getElementById("hud-progress-sub").textContent = run.mode === "endless"
      ? `Tầng ${run.endlessFloor} • Kỷ lục: ${SLStorage.get().endlessRecord.bestFloor}`
      : `Câu ${run.qIndex + 1} / ${run.deck.length}`;

    // Render Debuff pills
    const debuffBanner = document.getElementById("arena-debuff-banner");
    debuffBanner.innerHTML = debuff
      ? `<span class="debuff-pill">☠ Boss Debuff: ${debuff.name}</span>`
      : "";

    // Meta bar
    const metaBar = document.getElementById("q-meta-bar");
    const bountyInfo = SLStorage.get().bounty[q.id];
    let chips = `<span class="q-chip">Câu #${q.id} • Chương ${q.chapter} • Nhóm ${q.groupCode}</span>`;
    if (q.isReinforcement) chips += `<span class="q-chip reinforce">Tăng viện ôn tập</span>`;
    if (q.isComposite) chips += `<span class="q-chip" style="border-color:rgba(251,191,36,0.45);color:#fde68a;">Câu tổng hợp</span>`;
    if (bountyInfo && bountyInfo.status === "active") {
      chips += `<span class="q-chip" style="background:rgba(239,68,68,0.2);border-color:#f87171;color:#fecaca;">🎯 Truy Nã (${bountyInfo.consecutiveCorrect}/2)</span>`;
    }
    metaBar.innerHTML = chips;

    document.getElementById("q-text").textContent = q.question;
    document.getElementById("manual-next-wrap").style.display = "none";

    renderAnswersGrid();
    updateSkillsUI();
    startTimerLoop();
  }

  function renderAnswersGrid() {
    const grid = document.getElementById("answers-grid");
    const q = run.currentQ;
    const keys = ["A", "B", "C", "D"];
    grid.innerHTML = keys.map((k, idx) => {
      const elim = run.eliminatedKeys.includes(k) ? "eliminated" : "";
      const fog = run.foggedKey === k ? "fogged" : "";
      return `
        <button class="answer-btn ${elim} ${fog}" data-key="${k}" ${run.answered ? "disabled" : ""}>
          <span class="answer-letter">${k}</span>
          <span>${escapeHtml(q.displayAnswers[k])}</span>
        </button>
      `;
    }).join("");

    grid.querySelectorAll(".answer-btn").forEach(btn => {
      btn.onclick = () => selectAnswer(btn.getAttribute("data-key"));
    });
  }

  function startTimerLoop() {
    if (timerHandle) clearInterval(timerHandle);
    updateTimerUI();
    timerHandle = setInterval(() => {
      if (!run || run.paused || run.answered || run.frozen) return;
      run.timeLeft = Math.max(0, run.timeLeft - 0.1);
      run.elapsedOnQ += 0.1;
      updateTimerUI();
      if (run.timeLeft <= 0) {
        clearInterval(timerHandle);
        timerHandle = null;
        handleTimeout();
      }
    }, 100);
  }

  function getSpeedMultiplier(elapsed) {
    const s = SLStorage.get().settings;
    if (elapsed <= 4) return { pct: s.dmgTier1 || 200, label: `⚡ CHÍ MẠNG ${s.dmgTier1 || 200}%`, cls: "crit", isCrit: true };
    if (elapsed <= 8) return { pct: s.dmgTier2 || 150, label: `🔥 SÁT THƯƠNG CAO ${s.dmgTier2 || 150}%`, cls: "high", isCrit: false };
    if (elapsed <= 12) return { pct: s.dmgTier3 || 120, label: `⚔ SÁT THƯƠNG KHÁ ${s.dmgTier3 || 120}%`, cls: "mid", isCrit: false };
    return { pct: s.dmgTier4 || 100, label: `🛡 SÁT THƯƠNG CƠ BẢN ${s.dmgTier4 || 100}%`, cls: "", isCrit: false };
  }

  function updateTimerUI() {
    const tEl = document.getElementById("hud-timer");
    const bar = document.getElementById("hud-timer-bar");
    const multEl = document.getElementById("hud-mult-badge");
    if (!tEl || !run) return;

    tEl.textContent = `${run.timeLeft.toFixed(1)}s`;
    tEl.className = "timer-number" + (run.frozen ? " frozen" : run.timeLeft <= 4 ? " urgent" : "");

    const pct = Math.max(0, Math.min(100, (run.timeLeft / run.currentTimeLimit) * 100));
    bar.style.width = `${pct}%`;
    bar.className = "bar-fill " + (run.frozen ? "blue" : run.timeLeft <= 4 ? "crimson" : "gold");

    const m = getSpeedMultiplier(run.elapsedOnQ);
    multEl.textContent = m.label;
    multEl.className = `mult-badge ${m.cls}`;
  }

  function selectAnswer(key) {
    if (!run || run.answered || run.paused) return;
    if (run.eliminatedKeys.includes(key) || run.foggedKey === key) return;

    run.answered = true;
    clearAllTimers();

    const q = run.currentQ;
    const isCorrect = key === q.correctKey;
    const chosenText = q.displayAnswers[key];
    run.totalElapsed += run.elapsedOnQ;

    // Disable all buttons and mark result
    document.querySelectorAll(".answer-btn").forEach(btn => {
      btn.disabled = true;
      btn.classList.remove("fogged");
      const k = btn.getAttribute("data-key");
      if (k === q.correctKey) btn.classList.add("correct");
      else if (k === key && !isCorrect) btn.classList.add("wrong");
    });

    const rec = SLProgression.recordAnswer(q, isCorrect, chosenText, run.elapsedOnQ, run.mode === "bounty");

    if (isCorrect) {
      handleCorrectHit(rec);
    } else {
      handleWrongHit(false);
    }
  }

  function handleTimeout() {
    if (!run || run.answered) return;
    run.answered = true;
    clearAllTimers();

    const q = run.currentQ;
    run.totalElapsed += run.currentTimeLimit;

    document.querySelectorAll(".answer-btn").forEach(btn => {
      btn.disabled = true;
      btn.classList.remove("fogged");
      if (btn.getAttribute("data-key") === q.correctKey) btn.classList.add("correct");
    });

    SLProgression.recordAnswer(q, false, "(Hết thời gian)", run.currentTimeLimit, run.mode === "bounty");
    handleWrongHit(true);
  }

  function handleCorrectHit(rec) {
    run.correctCount += 1;
    run.combo += 1;
    run.vampStreak += 1;
    if (run.combo > run.maxCombo) run.maxCombo = run.combo;

    const wasFever = run.combo > 5;
    const justTriggeredFever = run.combo === 5;
    if (justTriggeredFever) {
      SLAudio.playFever();
      SLProgression.unlockAchievement("combo_5");
      showPopup("🔥 FEVER MODE! (+50% DMG)", "crit");
    }
    if (run.combo >= 10) SLProgression.unlockAchievement("combo_10");

    // Vampiric Drain Passive check: 4 consecutive correct -> heal 1 heart (1 use/stage)
    if (
      run.skillCharges["vampiric_drain"] > 0 &&
      run.vampStreak >= 4 &&
      run.hearts < run.maxHearts
    ) {
      run.skillCharges["vampiric_drain"] = 0;
      run.vampStreak = 0;
      run.hearts = Math.min(run.maxHearts, run.hearts + 1);
      SLAudio.playHeal();
      SLArt.triggerCombatFX("heal");
      showPopup("❤️ HÚT MÁU +1 TIM!", "heal");
      updateHeartsUI();
      updateSkillsUI();
    }

    // Calculate Damage: Speed Multiplier + flat +50 Fever bonus (controlled formula)
    const mult = getSpeedMultiplier(run.elapsedOnQ);
    const feverBonus = run.combo >= 5 ? 50 : 0;
    const dmg = mult.pct + feverBonus;

    if (run.mode !== "endless") {
      run.hp = Math.max(0, run.hp - dmg);
      updateMonsterHPUI();
    }

    if (mult.isCrit) {
      SLAudio.playCrit();
      SLArt.triggerCombatFX("crit");
      triggerScreenShake();
      showPopup(`⚡ CHÍ MẠNG -${dmg}!`, "crit");
    } else {
      SLAudio.playSlash();
      SLArt.triggerCombatFX("hit");
      showPopup(`-${dmg}${feverBonus ? " 🔥" : ""}`, mult.pct >= 150 ? "high" : "norm");
    }

    if (rec.bountyJustCleared) {
      run.bountiesEliminatedThisRun += 1;
      SLApp.toast("🎯 Đã tiêu diệt 1 mục tiêu Truy Nã (2/2 liên tiếp)!", "success");
    }

    animateMonster("anim-hurt");
    updateComboUI();

    if (run.mode === "endless") {
      run.endlessFloor += 1;
      SLStorage.update(st => {
        if (run.endlessFloor - 1 > st.endlessRecord.bestFloor) {
          st.endlessRecord.bestFloor = run.endlessFloor - 1;
        }
        if (run.correctCount > st.endlessRecord.bestCorrect) {
          st.endlessRecord.bestCorrect = run.correctCount;
        }
      });
      if (run.endlessFloor - 1 >= 10) SLProgression.unlockAchievement("tower_10");
      scheduleAdvance(900);
      return;
    }

    // Check if Monster HP dropped to 0 (instant victory!)
    if (run.hp <= 0) {
      animateMonster("anim-death");
      SLArt.triggerCombatFX("death");
      nextTimeout = setTimeout(() => handleVictory(), 850);
      return;
    }

    scheduleAdvance(950);
  }

  function handleWrongHit(isTimeout) {
    run.wrongCount += 1;
    run.vampStreak = 0;

    // Check Passive Aegis Shield
    if (run.skillCharges["aegis_shield"] > 0) {
      run.skillCharges["aegis_shield"] = 0;
      SLAudio.playShield();
      SLArt.triggerCombatFX("freeze");
      showPopup("🛡 KHIÊN HỘ MỆNH CHẮN ĐÒN!", "heal");
      updateSkillsUI();
      scheduleAdvance(SLStorage.get().settings.autoNextDelay || 1500);
      return;
    }

    // Lose 1 heart & reset Combo / Fever
    run.hearts = Math.max(0, run.hearts - 1);
    run.combo = 0;
    SLAudio.playWrong();
    SLArt.triggerCombatFX("wrong");
    animateMonster("anim-attack");
    triggerScreenShake();
    showPopup(isTimeout ? "⏱ HẾT GIỜ! -1 TIM" : "✖ SAI RỒI! -1 TIM", "miss");

    updateHeartsUI();
    updateComboUI();

    if (run.hearts <= 0) {
      nextTimeout = setTimeout(() => handleDefeat(), 1350);
      return;
    }

    // Reveal correct answer clearly for 1.5s (user requested) before advancing
    scheduleAdvance(SLStorage.get().settings.autoNextDelay || 1500);
  }

  function scheduleAdvance(delayMs) {
    if (!run) return;
    if (SLStorage.get().settings.manualNext) {
      run.waitingManualNext = true;
      document.getElementById("manual-next-wrap").style.display = "block";
    } else {
      nextTimeout = setTimeout(() => proceedNext(), delayMs);
    }
  }

  function proceedNext() {
    if (!run) return;
    run.waitingManualNext = false;
    run.qIndex += 1;
    loadQuestion();
  }

  /**
   * If all questions in deck completed while hero is still alive:
   * - Bounty mode: Victory if cleared/survived
   * - Campaign / Boss: If accuracy >= 60%, unleash Final Knowledge Strike -> Victory!
   *   Otherwise monster survives -> Defeat (encourages better mastery).
   */
  function finishRunByDeckEnd() {
    const total = run.correctCount + run.wrongCount;
    const acc = total > 0 ? run.correctCount / total : 0;

    if (run.mode === "bounty") {
      handleVictory();
      return;
    }

    if (acc >= 0.6) {
      run.hp = 0;
      updateMonsterHPUI();
      animateMonster("anim-death");
      SLArt.triggerCombatFX("death");
      showPopup("⚔ ĐÒN KẾT LIỄU TRI THỨC!", "crit");
      nextTimeout = setTimeout(() => handleVictory(), 850);
    } else {
      handleDefeat("Quái vật vẫn còn trụ vững (độ chính xác dưới 60%). Hãy ôn kỹ lại và phục thù!");
    }
  }

  /* ---- Active Skills ---- */
  function useSkill(skillId) {
    if (!run || run.answered || run.paused) return;
    if (!run.skillCharges[skillId] || run.skillCharges[skillId] <= 0) return;

    if (skillId === "double_slash") {
      run.skillCharges[skillId] = 0;
      const q = run.currentQ;

      // Confirmed Rule: On composite questions, convert Chém Đôi into +5 seconds!
      if (q.isComposite) {
        run.timeLeft = Math.min(run.currentTimeLimit + 5, run.timeLeft + 5);
        run.currentTimeLimit = Math.max(run.currentTimeLimit, run.timeLeft);
        SLAudio.playFreeze();
        SLArt.triggerCombatFX("freeze");
        showPopup("⏳ CÂU TỔNG HỢP → +5 GIÂY!", "heal");
        updateTimerUI();
      } else {
        const wrongKeys = SLQuestions.shuffle(
          ["A", "B", "C", "D"].filter(k => k !== q.correctKey && !run.eliminatedKeys.includes(k))
        );
        run.eliminatedKeys.push(...wrongKeys.slice(0, 2));
        SLAudio.playSlash();
        SLArt.triggerCombatFX("hit");
        showPopup("⚔ CHÉM ĐÔI: LOẠI 2 ĐÁP ÁN!", "crit");
        renderAnswersGrid();
      }
      updateSkillsUI();
    } else if (skillId === "time_freeze") {
      run.skillCharges[skillId] = 0;
      run.frozen = true;
      SLAudio.playFreeze();
      SLArt.triggerCombatFX("freeze");
      showPopup("❄️ NGƯNG ĐỌNG 10 GIÂY!", "heal");
      document.getElementById("arena-debuff-banner").innerHTML += `<span class="debuff-pill freeze">❄️ Thời gian đóng băng</span>`;
      updateTimerUI();
      updateSkillsUI();

      freezeTimeout = setTimeout(() => {
        if (!run) return;
        run.frozen = false;
        document.querySelectorAll(".debuff-pill.freeze").forEach(el => el.remove());
        updateTimerUI();
      }, 10000);
    }
  }

  /* ---- UI Updaters ---- */
  function updateMonsterHPUI() {
    const pct = Math.max(0, Math.min(100, (run.hp / run.maxHP) * 100));
    const fill = document.getElementById("hud-hp-fill");
    const trail = document.getElementById("hud-hp-trail");
    const txt = document.getElementById("hud-hp-text");
    if (fill) fill.style.width = `${pct}%`;
    if (trail) trail.style.width = `${pct}%`;
    if (txt) txt.textContent = `${run.hp} / ${run.maxHP} HP`;
  }

  function updateHeartsUI() {
    const el = document.getElementById("hud-hearts");
    if (!el || !run) return;
    let html = "";
    for (let i = 0; i < run.maxHearts; i++) {
      html += `<span class="heart-icon ${i < run.hearts ? "" : "lost"}">❤️</span>`;
    }
    el.innerHTML = html;
  }

  function updateComboUI() {
    const valEl = document.getElementById("hud-combo-val");
    const hintEl = document.getElementById("hud-combo-hint");
    const feverBox = document.getElementById("hud-fever-box");
    const rageFill = document.getElementById("hud-rage-fill");
    const rageText = document.getElementById("hud-rage-text");
    const root = document.getElementById("combat-root");
    if (!valEl || !run) return;

    const isFever = run.combo >= 5;
    valEl.textContent = `x${run.combo}`;
    valEl.className = "combo-val" + (isFever ? " fever" : "");
    hintEl.textContent = isFever ? "FEVER ĐANG CHÁY!" : `Còn ${5 - run.combo} → Fever`;

    feverBox.className = "fever-status-box" + (isFever ? " active" : "");
    feverBox.textContent = isFever
      ? "🔥 FEVER MODE: +50% SÁT THƯƠNG!"
      : `Fever Mode: ${Math.min(run.combo, 5)} / 5 Combo`;

    const ragePct = Math.min(100, (run.combo / 5) * 100);
    rageFill.style.width = `${ragePct}%`;
    rageText.textContent = isFever ? "TỐI ĐA (FEVER!)" : `${run.combo} / 5`;

    if (root) root.classList.toggle("fever-active", isFever);
  }

  function updateSkillsUI() {
    const dock = document.getElementById("hud-skills-dock");
    if (!dock || !run) return;
    if (run.equipped.length === 0) {
      dock.innerHTML = `<div style="font-size:12px;color:var(--text-muted);padding:6px;border:1px dashed rgba(148,163,184,0.25);border-radius:8px;text-align:center;">Vượt ải để thu thập Thẻ Kỹ Năng Huyền Thoại!</div>`;
      return;
    }

    dock.innerHTML = run.equipped.map(id => {
      const sk = SLSkills.get(id);
      const charges = run.skillCharges[id] || 0;
      const isPassive = sk.type === "passive";
      const usedText = charges > 0 ? (isPassive ? "Sẵn sàng" : "Dùng") : "Đã dùng";
      return `
        <button class="skill-use-btn ${isPassive && charges > 0 ? "passive-ready" : ""}"
                data-skill="${id}" ${charges <= 0 || isPassive ? "disabled" : ""}
                title="${sk.shortDesc}">
          <span><strong>${sk.name}</strong><br><small style="color:var(--text-muted);">${usedText}</small></span>
          <span class="key-cap">${sk.hotkey}</span>
        </button>
      `;
    }).join("");

    dock.querySelectorAll(".skill-use-btn").forEach(btn => {
      const id = btn.getAttribute("data-skill");
      if (SLSkills.get(id).type === "active") {
        btn.onclick = () => useSkill(id);
      }
    });
  }

  function animateMonster(cls) {
    const el = document.getElementById("monster-sprite");
    if (!el) return;
    el.classList.remove("anim-hurt", "anim-attack", "anim-death");
    void el.offsetWidth;
    el.classList.add(cls);
  }

  function triggerScreenShake() {
    const el = document.getElementById("arena-stage");
    if (!el) return;
    el.classList.remove("anim-shake");
    void el.offsetWidth;
    el.classList.add("anim-shake");
  }

  function showPopup(text, cls = "norm") {
    const layer = document.getElementById("dmg-popup-layer");
    if (!layer) return;
    const div = document.createElement("div");
    div.className = `dmg-popup ${cls}`;
    div.textContent = text;
    div.style.left = `${44 + Math.random() * 12}%`;
    layer.appendChild(div);
    setTimeout(() => div.remove(), 950);
  }

  /* ---- Pause Modal ---- */
  function togglePause() {
    if (!run) return;
    run.paused = !run.paused;
    const modal = document.getElementById("modal-overlay");
    if (run.paused) {
      SLAudio.playClick();
      modal.innerHTML = `
        <div class="rpg-panel modal-box compact" style="text-align:center;">
          <h2 class="fantasy-title" style="font-size:28px;margin-bottom:8px;">TẠM DỪNG TRẬN ĐẤU</h2>
          <p style="color:var(--text-muted);margin-bottom:18px;">Đồng hồ chiến đấu đã được đóng băng.</p>
          <div class="modal-actions" style="flex-direction:column;">
            <button class="btn btn-gold btn-lg" id="p-resume">▶ Tiếp Tục Chiến Đấu (ESC)</button>
            <button class="btn btn-ghost" id="p-restart">🔄 Đánh Lại Từ Đầu (Đảo Lại Câu Hỏi)</button>
            <button class="btn btn-crimson" id="p-exit">🚪 Rút Lui Về Bản Đồ</button>
          </div>
        </div>
      `;
      modal.classList.remove("hidden");
      document.getElementById("p-resume").onclick = () => togglePause();
      document.getElementById("p-restart").onclick = () => {
        modal.classList.add("hidden");
        const cfg = {
          mode: run.mode, chapter: run.chapter, stage: run.stage,
          bountyChapter: run.bountyChapter, bossRushQueue: run.bossRushQueue, bossRushCleared: run.bossRushCleared
        };
        start(cfg);
      };
      document.getElementById("p-exit").onclick = () => {
        modal.classList.add("hidden");
        const backChapter = run.chapter;
        const backMode = run.mode;
        abort();
        if (backMode === "campaign" || backMode === "boss") SLApp.go("stages", { chapter: backChapter });
        else if (backMode === "bounty") SLApp.go("bounty");
        else SLApp.go("menu");
      };
    } else {
      modal.classList.add("hidden");
    }
  }

  /* ---- Victory & Defeat Screens ---- */
  function handleVictory() {
    clearAllTimers();
    SLAudio.playVictory();

    const total = run.correctCount + run.wrongCount;
    const avgTime = total > 0 ? (run.totalElapsed / total) : 0;
    const rankRes = SLProgression.calculateRank({
      correctCount: run.correctCount,
      totalAnswered: total,
      heartsLeft: run.hearts,
      maxHearts: run.maxHearts,
      maxCombo: run.maxCombo,
      avgTime,
      wrongCount: run.wrongCount
    });

    let expGain = 60 + rankRes.score;
    let titleUnlocked = null;
    let leveledUp = false;
    let newLevel = SLStorage.get().level;

    if (run.mode === "campaign") {
      const r = SLProgression.recordStageClear(run.chapter, run.stage, rankRes, run.maxCombo);
      expGain = r.expGain; leveledUp = r.leveledUp; newLevel = r.newLevel;
    } else if (run.mode === "boss") {
      const r = SLProgression.recordBossClear(run.chapter, rankRes, run.maxCombo);
      expGain = r.expGain; leveledUp = r.leveledUp; newLevel = r.newLevel; titleUnlocked = r.titleUnlocked;
    } else if (run.mode === "boss_rush") {
      run.bossRushCleared += 1;
      SLStorage.update(st => {
        if (run.bossRushCleared > st.bossRushRecord.bestCleared) {
          st.bossRushRecord.bestCleared = run.bossRushCleared;
        }
      });
      const r = SLProgression.addExp(180);
      expGain = 180; leveledUp = r.leveledUp; newLevel = r.newLevel;
    } else {
      const r = SLProgression.addExp(expGain);
      leveledUp = r.leveledUp; newLevel = r.newLevel;
    }

    SLApp.updateTopNav();

    // Boss Rush chain to next boss if remaining
    if (run.mode === "boss_rush" && run.bossRushQueue.length > 0) {
      const nextBossCh = run.bossRushQueue[0];
      const remQueue = run.bossRushQueue.slice(1);
      const modal = document.getElementById("modal-overlay");
      modal.innerHTML = `
        <div class="rpg-panel modal-box compact" style="text-align:center;">
          <h2 class="fantasy-title" style="font-size:28px;">HẠ GỤC ${run.monsterName.toUpperCase()}!</h2>
          <p style="color:var(--text-soft);margin:8px 0 16px;">Bạn đã vượt qua Boss ${run.bossRushCleared}. Kỹ năng sẽ được hồi đầy cho trận kế tiếp!</p>
          <div class="modal-actions">
            <button class="btn btn-crimson btn-lg" id="br-next">⚔️ Tiếp Tục Gặp Boss Chương ${nextBossCh}</button>
            <button class="btn btn-ghost" id="br-stop">Dừng Lại</button>
          </div>
        </div>
      `;
      modal.classList.remove("hidden");
      document.getElementById("br-next").onclick = () => {
        modal.classList.add("hidden");
        start({ mode: "boss_rush", chapter: nextBossCh, bossRushQueue: remQueue, bossRushCleared: run.bossRushCleared });
      };
      document.getElementById("br-stop").onclick = () => {
        modal.classList.add("hidden");
        abort();
        SLApp.go("menu");
      };
      return;
    }

    const showSkillPicker = run.mode === "campaign" || run.mode === "boss";
    const offeredCards = showSkillPicker ? SLSkills.getOfferCards(SLStorage.get().equippedSkills) : [];
    const stNow = SLStorage.get();
    const expNeed = SLProgression.expForNextLevel(stNow.level);
    const expPct = Math.min(100, Math.round((stNow.exp / expNeed) * 100));

    let headingText = `CHIẾN THẮNG ẢI ${run.chapter}.${run.stage}`;
    if (run.mode === "boss") headingText = `HẠ GỤC BOSS CHƯƠNG ${run.chapter}!`;
    if (run.mode === "boss_rush") headingText = "CHINH PHỤC TOÀN BỘ BOSS RUSH!";
    if (run.mode === "bounty") headingText = "HOÀN THÀNH SĂN TRUY NÃ";

    const modal = document.getElementById("modal-overlay");
    modal.innerHTML = `
      <div class="rpg-panel modal-box">
        <div class="result-header">
          <h2>${headingText}</h2>
          <div style="color:var(--text-soft);font-size:13.5px;">
            ${run.monsterName} đã bị hạ gục${titleUnlocked ? ` • Danh hiệu mới: <strong style="color:var(--gold-bright);">${titleUnlocked}</strong>` : ""}
          </div>
        </div>

        <div class="result-summary-bar">
          <div style="text-align:center;">
            <div class="rank-badge rank-${rankRes.rank}" style="width:82px;height:82px;font-size:32px;">${rankRes.rank}</div>
            <div style="font-size:11px;color:var(--text-muted);margin-top:4px;">Xếp hạng</div>
          </div>
          <div>
            <div class="result-metrics">
              <div class="metric-cell"><div class="lbl">Chính xác</div><div class="val">${rankRes.accuracyPct}%</div></div>
              <div class="metric-cell"><div class="lbl">Tim còn lại</div><div class="val">${run.hearts} / ${run.maxHearts}</div></div>
              <div class="metric-cell"><div class="lbl">Combo tối đa</div><div class="val">x${run.maxCombo}</div></div>
              <div class="metric-cell"><div class="lbl">Tốc độ TB</div><div class="val">${avgTime.toFixed(1)}s</div></div>
            </div>
            <div style="margin-top:10px;">
              <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:4px;">
                <span style="color:#7dd3fc;font-weight:700;">EXP Cấp ${stNow.level}${leveledUp ? " (LÊN CẤP!)" : ""}</span>
                <span style="color:var(--gold-bright);font-weight:700;">+${expGain} EXP</span>
              </div>
              <div class="bar-track" style="height:8px;"><div class="bar-fill blue" style="width:${expPct}%;"></div></div>
              <div style="font-size:11.5px;color:var(--text-muted);margin-top:4px;">
                Điểm: ${rankRes.score}/105 (${rankRes.breakdown})
              </div>
            </div>
          </div>
        </div>

        ${showSkillPicker ? `
          <div style="text-align:center;font-family:var(--font-display);font-size:17px;font-weight:700;color:var(--gold-bright);margin-bottom:4px;">
            ✦ CHỌN 1 THẺ KỸ NĂNG HUYỀN THOẠI ✦
          </div>
          <div style="text-align:center;font-size:12px;color:var(--text-muted);margin-bottom:8px;">
            Đang trang bị: ${stNow.equippedSkills.length}/3 kỹ năng (tối đa 3 thẻ)
          </div>
          <div class="skill-cards-grid" id="victory-skill-grid">
            ${offeredCards.map(c => `
              <div class="skill-pick-card" data-sid="${c.id}">
                <div class="skill-pick-art">${SLArt.skillSVG(c.id)}</div>
                <div class="skill-pick-rarity">${c.rarity}</div>
                <div class="skill-pick-name">${c.name}</div>
                <div class="skill-pick-desc">${c.shortDesc}</div>
                <div style="font-size:11px;color:${c.alreadyOwned ? "#6ee7b7" : "var(--gold)"};font-weight:700;">
                  ${c.alreadyOwned ? "✓ Đang sở hữu" : "+ Thu thập thẻ"}
                </div>
              </div>
            `).join("")}
          </div>
          <div id="skill-pick-feedback" style="text-align:center;font-size:13px;color:#6ee7b7;min-height:20px;"></div>
        ` : ""}

        <div class="modal-actions">
          ${getVictoryActionButtons()}
        </div>
      </div>
    `;
    modal.classList.remove("hidden");

    if (showSkillPicker) {
      modal.querySelectorAll(".skill-pick-card").forEach(cardEl => {
        cardEl.onclick = () => {
          const sid = cardEl.getAttribute("data-sid");
          SLAudio.playCardSelect();
          SLSkills.equip(sid);
          modal.querySelectorAll(".skill-pick-card").forEach(el => {
            el.classList.toggle("selected", el === cardEl);
            el.classList.toggle("dimmed", el !== cardEl);
          });
          document.getElementById("skill-pick-feedback").textContent =
            `✦ Đã trang bị thẻ kỹ năng: ${SLSkills.get(sid).name}!`;
        };
      });
    }

    bindVictoryButtons();
  }

  function getVictoryActionButtons() {
    if (run.mode === "campaign") {
      const chGroups = SLQuestions.getGroups().filter(g => g.chapter === run.chapter);
      const hasNextStage = run.stage < chGroups.length;
      return `
        ${hasNextStage ? `<button class="btn btn-gold" id="v-next-stage">⚔️ Sang Ải ${run.chapter}.${run.stage + 1}</button>` : `<button class="btn btn-crimson" id="v-go-boss">🐉 Tiến Tới Boss Chương ${run.chapter}</button>`}
        <button class="btn btn-ghost" id="v-replay">🔄 Đánh Lại (Đảo Câu Mới)</button>
        <button class="btn btn-ghost" id="v-map">🗺 Về Chọn Ải</button>
      `;
    }
    if (run.mode === "boss") {
      const nextCh = run.chapter < 7 ? run.chapter + 1 : null;
      return `
        ${nextCh ? `<button class="btn btn-gold" id="v-next-ch">🌍 Mở Vùng Đất Chương ${nextCh}</button>` : `<button class="btn btn-gold" id="v-hall">🏆 Vào Đại Sảnh Huyền Thoại</button>`}
        <button class="btn btn-ghost" id="v-map">🗺 Bản Đồ Thế Giới</button>
      `;
    }
    if (run.mode === "bounty") {
      const left = SLProgression.getActiveBounties(run.bountyChapter).length;
      return `
        ${left > 0 ? `<button class="btn btn-crimson" id="v-bounty-again">🎯 Săn Tiếp (${left} mục tiêu còn lại)</button>` : ""}
        <button class="btn btn-gold" id="v-bounty-board">📜 Về Sổ Truy Nã</button>
      `;
    }
    return `<button class="btn btn-gold" id="v-menu">🏠 Về Trang Chủ</button>`;
  }

  function bindVictoryButtons() {
    const modal = document.getElementById("modal-overlay");
    const closeAnd = (fn) => {
      SLAudio.playClick();
      modal.classList.add("hidden");
      fn();
    };
    const nextStageBtn = document.getElementById("v-next-stage");
    if (nextStageBtn) nextStageBtn.onclick = () => closeAnd(() => start({ mode: "campaign", chapter: run.chapter, stage: run.stage + 1 }));

    const goBossBtn = document.getElementById("v-go-boss");
    if (goBossBtn) goBossBtn.onclick = () => closeAnd(() => {
      const ch = run.chapter;
      abort();
      SLApp.go("stages", { chapter: ch });
    });

    const replayBtn = document.getElementById("v-replay");
    if (replayBtn) replayBtn.onclick = () => closeAnd(() => start({ mode: run.mode, chapter: run.chapter, stage: run.stage }));

    const mapBtn = document.getElementById("v-map");
    if (mapBtn) mapBtn.onclick = () => closeAnd(() => {
      const ch = run.chapter;
      const isBoss = run.mode === "boss";
      abort();
      SLApp.go(isBoss ? "worldmap" : "stages", { chapter: ch });
    });

    const nextChBtn = document.getElementById("v-next-ch");
    if (nextChBtn) nextChBtn.onclick = () => closeAnd(() => {
      const nch = run.chapter + 1;
      abort();
      SLApp.go("stages", { chapter: nch });
    });

    const hallBtn = document.getElementById("v-hall");
    if (hallBtn) hallBtn.onclick = () => closeAnd(() => { abort(); SLApp.go("hall"); });

    const bountyAgain = document.getElementById("v-bounty-again");
    if (bountyAgain) bountyAgain.onclick = () => closeAnd(() => start({ mode: "bounty", bountyChapter: run.bountyChapter }));

    const bountyBoard = document.getElementById("v-bounty-board");
    if (bountyBoard) bountyBoard.onclick = () => closeAnd(() => { abort(); SLApp.go("bounty"); });

    const menuBtn = document.getElementById("v-menu");
    if (menuBtn) menuBtn.onclick = () => closeAnd(() => { abort(); SLApp.go("menu"); });
  }

  function handleDefeat(customMsg = null) {
    clearAllTimers();
    SLAudio.playDefeat();
    SLApp.updateTopNav();

    const isEndless = run.mode === "endless";
    const modal = document.getElementById("modal-overlay");
    modal.innerHTML = `
      <div class="rpg-panel modal-box compact" style="text-align:center;">
        <div class="result-header defeat">
          <h2>${isEndless ? "KẾT THÚC HÀNH TRÌNH THÁP VÔ TẬN" : "THẤT BẠI TRONG TRẬN CHIẾN"}</h2>
        </div>
        <p style="color:var(--text-soft);font-size:14px;margin-bottom:14px;">
          ${customMsg || (isEndless
            ? `Bạn đã dừng bước tại Tầng ${run.endlessFloor} với ${run.correctCount} câu trả lời đúng (Kỷ lục: Tầng ${SLStorage.get().endlessRecord.bestFloor}).`
            : "Sinh lực đã cạn kiệt! Các câu hỏi trả lời sai đã được ghi nhận vào Sổ Truy Nã để bạn tiêu diệt và phục thù.")}
        </p>
        <div class="result-metrics" style="grid-template-columns:repeat(3,1fr);margin-bottom:16px;">
          <div class="metric-cell"><div class="lbl">Đúng</div><div class="val" style="color:#34d399;">${run.correctCount}</div></div>
          <div class="metric-cell"><div class="lbl">Sai</div><div class="val" style="color:#f87171;">${run.wrongCount}</div></div>
          <div class="metric-cell"><div class="lbl">Combo Max</div><div class="val">x${run.maxCombo}</div></div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-gold" id="d-retry">⚔️ Phục Thù Ngay</button>
          <button class="btn btn-crimson" id="d-bounty">📜 Mở Sổ Truy Nã</button>
          <button class="btn btn-ghost" id="d-back">🗺 Quay Lại</button>
        </div>
      </div>
    `;
    modal.classList.remove("hidden");

    document.getElementById("d-retry").onclick = () => {
      SLAudio.playClick();
      modal.classList.add("hidden");
      start({
        mode: run.mode, chapter: run.chapter, stage: run.stage,
        bountyChapter: run.bountyChapter, bossRushQueue: run.bossRushQueue, bossRushCleared: run.bossRushCleared
      });
    };
    document.getElementById("d-bounty").onclick = () => {
      SLAudio.playClick();
      modal.classList.add("hidden");
      abort();
      SLApp.go("bounty");
    };
    document.getElementById("d-back").onclick = () => {
      SLAudio.playClick();
      modal.classList.add("hidden");
      const ch = run.chapter;
      const m = run.mode;
      abort();
      if (m === "campaign" || m === "boss") SLApp.go("stages", { chapter: ch });
      else SLApp.go("menu");
    };
  }

  /* ---- Global Keyboard Controls during Combat ---- */
  function handleKeyDown(e) {
    if (!run) return;
    const key = e.key.toUpperCase();
    if (key === "ESCAPE") {
      e.preventDefault();
      togglePause();
      return;
    }
    if (run.paused) return;

    if (run.waitingManualNext && key === "ENTER") {
      e.preventDefault();
      proceedNext();
      return;
    }

    if (run.answered) return;
    const mapKey = { "1": "A", "2": "B", "3": "C", "4": "D", "A": "A", "B": "B", "C": "C", "D": "D" };
    if (mapKey[key]) {
      e.preventDefault();
      selectAnswer(mapKey[key]);
    } else if (key === "Q") {
      e.preventDefault();
      useSkill("double_slash");
    } else if (key === "W") {
      e.preventDefault();
      useSkill("time_freeze");
    }
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return { start, abort, isActive, togglePause, handleKeyDown };
})();
