/* ============================================================
   MAIN APPLICATION CONTROLLER & SPA ROUTER
   All Screens: Menu, Profile, WorldMap, Stages, Bounty, Hall,
   Knowledge Codex, Practice, Exam, Boss Rush, Settings
   ============================================================ */

const SLApp = (() => {
  let currentScreen = "menu";
  let currentParams = {};
  let practiceState = null;
  let examState = null;
  let examTimerHandle = null;

  function init() {
    if (!window.SL_DATA || !window.SL_DATA.questions || window.SL_DATA.questions.length !== 230) {
      document.getElementById("screen-viewport").innerHTML = `
        <div class="rpg-panel" style="padding:28px;text-align:center;">
          <h2 class="fantasy-title">Lỗi nạp dữ liệu câu hỏi</h2>
          <p style="margin-top:8px;color:#fca5a5;">Không tìm thấy đủ 230 câu hỏi trong <code>data/questions_data.js</code>.</p>
        </div>
      `;
      return;
    }

    SLArt.initAmbientBg();
    bindTopNav();
    updateTopNav();
    go("menu");

    document.addEventListener("keydown", (e) => {
      if (SLCombat.isActive()) {
        SLCombat.handleKeyDown(e);
        return;
      }
      if (currentScreen === "practice" && practiceState) {
        handlePracticeKey(e);
      }
    });
  }

  function bindTopNav() {
    document.getElementById("nav-crest-slot").innerHTML = SLArt.heroCrestSVG();
    document.getElementById("nav-brand").onclick = () => { SLAudio.playClick(); leaveIfCombat(() => go("menu")); };
    document.getElementById("nav-hero-pill").onclick = () => { SLAudio.playClick(); leaveIfCombat(() => go("profile")); };

    document.querySelectorAll(".nav-btn[data-nav]").forEach(btn => {
      btn.onclick = () => {
        SLAudio.playClick();
        const target = btn.getAttribute("data-nav");
        leaveIfCombat(() => go(target));
      };
    });
  }

  function leaveIfCombat(fn) {
    if (SLCombat.isActive()) {
      SLCombat.abort();
      document.getElementById("modal-overlay").classList.add("hidden");
    }
    if (examTimerHandle) { clearInterval(examTimerHandle); examTimerHandle = null; }
    fn();
  }

  function updateTopNav() {
    const st = SLStorage.get();
    const activeB = SLProgression.getActiveBounties().length;
    const lvlEl = document.getElementById("nav-hero-lvl");
    const nameEl = document.getElementById("nav-hero-name");
    const badgeEl = document.getElementById("nav-bounty-badge");

    if (lvlEl) lvlEl.textContent = `Lv.${st.level}`;
    if (nameEl) nameEl.textContent = st.heroName;
    if (badgeEl) {
      badgeEl.textContent = activeB;
      badgeEl.style.display = activeB > 0 ? "inline-block" : "none";
    }

    document.querySelectorAll(".nav-btn[data-nav]").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-nav") === currentScreen);
    });
  }

  function toast(msg, type = "info") {
    const box = document.getElementById("toast-container");
    if (!box) return;
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = msg;
    box.appendChild(el);
    setTimeout(() => el.remove(), 3400);
  }

  function go(screen, params = {}) {
    if (examTimerHandle && screen !== "exam") {
      clearInterval(examTimerHandle);
      examTimerHandle = null;
    }
    currentScreen = screen;
    currentParams = params;
    updateTopNav();

    const vp = document.getElementById("screen-viewport");
    vp.className = "screen-viewport screen-enter";
    window.scrollTo({ top: 0, behavior: "instant" });

    switch (screen) {
      case "menu": renderMenu(vp); break;
      case "worldmap": renderWorldMap(vp); break;
      case "stages": renderStages(vp, params.chapter || 3); break;
      case "bounty": renderBountyBoard(vp); break;
      case "profile": renderProfile(vp); break;
      case "hall": renderHallOfLegends(vp); break;
      case "codex": renderCodex(vp); break;
      case "practice": renderPracticeSetup(vp, params); break;
      case "exam": renderExamSetup(vp); break;
      case "settings": renderSettings(vp); break;
      default: renderMenu(vp);
    }
  }

  /* ============================================================
     01. MAIN MENU
     ============================================================ */
  function renderMenu(vp) {
    const st = SLStorage.get();
    const sum = SLProgression.getMasterySummary();
    const endlessOpen = SLProgression.isEndlessUnlocked();
    const unlockedBosses = [3, 4, 5, 6, 7].filter(ch => SLProgression.isChapterUnlocked(ch));

    vp.innerHTML = `
      <section class="menu-hero">
        <div>
          <div class="menu-eyebrow">⚔️ Action RPG • Roguelike • Quiz Battle • 100% Offline</div>
          <h1 class="menu-main-title">SOCIALISM LEGENDS</h1>
          <div class="menu-subtitle">The Knowledge Awakening — Hành Trình Chinh Phục Tri Thức</div>
          <p class="menu-desc">
            Chinh phục 5 vùng đất huyền bí, vượt qua 21 ải thử thách và 5 trận Boss cuối chương với trọn bộ 230 câu hỏi Chủ nghĩa xã hội khoa học (Câu 71 – Câu 300). Đảo vị trí đáp án và thứ tự câu hỏi tự động ở mọi lượt chơi.
          </p>
          <div class="menu-actions">
            <button class="btn btn-gold btn-lg" id="m-campaign">⚔️ ${sum.clearedStagesCount > 0 ? "Tiếp Tục Chiến Dịch" : "Bắt Đầu Hành Trình"}</button>
            <button class="btn btn-blue btn-lg" id="m-practice">📖 Luyện Tập Tự Do</button>
            <button class="btn btn-ghost btn-lg" id="m-codex">📚 Sổ Tay Tri Thức</button>
          </div>
          <div class="menu-stats-strip">
            <div class="mini-stat"><div class="val">${sum.clearedStagesCount}/21</div><div class="lbl">Ải đã vượt</div></div>
            <div class="mini-stat"><div class="val">${sum.clearedBossesCount}/5</div><div class="lbl">Boss đã hạ</div></div>
            <div class="mini-stat"><div class="val">${sum.mastered}/230</div><div class="lbl">Câu đã thuộc</div></div>
            <div class="mini-stat"><div class="val" style="color:${sum.activeBountyCount > 0 ? "#fca5a5" : "#6ee7b7"};">${sum.activeBountyCount}</div><div class="lbl">Câu Truy Nã</div></div>
          </div>
        </div>
        <div class="menu-emblem-box">
          <div style="width:170px;height:170px;filter:drop-shadow(0 0 28px rgba(212,166,74,0.35));">${SLArt.heroCrestSVG()}</div>
          <div style="text-align:center;">
            <div style="font-family:var(--font-display);font-size:18px;color:var(--gold-bright);">${escapeHtml(st.heroName)}</div>
            <div style="font-size:12.5px;color:var(--text-muted);">Cấp ${st.level} • ${st.titles[st.titles.length - 1] || "Người Khai Mở"}</div>
          </div>
        </div>
      </section>

      <div class="mode-grid">
        <div class="rpg-card mode-card clickable" id="card-worldmap">
          <div class="mode-card-head"><div class="mode-icon">🗺️</div><span class="mode-tag gold">5 Chương • 21 Ải</span></div>
          <h3>Bản Đồ Chiến Dịch</h3>
          <p>Khám phá 5 vùng đất Dark Fantasy từ Khởi Nguyên đến Vương Quốc Gia Đình, thu thập thẻ kỹ năng Roguelike và hạ gục 5 Boss.</p>
        </div>

        <div class="rpg-card mode-card clickable" id="card-bounty">
          <div class="mode-card-head"><div class="mode-icon">🎯</div><span class="mode-tag ${sum.activeBountyCount > 0 ? "danger" : "emerald"}">${sum.activeBountyCount} Mục tiêu</span></div>
          <h3>Sổ Truy Nã (Bounty)</h3>
          <p>Truy lùng mọi câu hỏi từng trả lời sai. Phải trả lời đúng 2 lần liên tiếp để tiêu diệt Quái Tinh Anh và mở khóa cổng Boss.</p>
        </div>

        <div class="rpg-card mode-card clickable" id="card-practice">
          <div class="mode-card-head"><div class="mode-icon">🧘</div><span class="mode-tag emerald">Không áp lực</span></div>
          <h3>Luyện Tập & Ôn Thông Minh</h3>
          <p>Học từng chương hoặc ôn tập thông minh các câu hay sai/chậm nhất mà không mất tim, không giới hạn thời gian.</p>
        </div>

        <div class="rpg-card mode-card clickable" id="card-exam">
          <div class="mode-card-head"><div class="mode-icon">📝</div><span class="mode-tag">Trộn 230 Câu</span></div>
          <h3>Chế Độ Thi Thử</h3>
          <p>Tạo đề thi ngẫu nhiên 30 / 50 / 100 / 230 câu có đồng hồ đếm ngược, chấm thang điểm 10 và tự động đẩy câu sai vào Sổ Truy Nã.</p>
        </div>

        <div class="rpg-card mode-card clickable" id="card-bossrush">
          <div class="mode-card-head"><div class="mode-icon">🐉</div><span class="mode-tag danger">Kỷ lục: ${st.bossRushRecord.bestCleared}/5</span></div>
          <h3>Boss Rush</h3>
          <p>Khiêu chiến liên tiếp các Boss đã mở khóa (${unlockedBosses.length}/5 Boss sẵn sàng) với kỹ năng hồi đầy sau mỗi trận.</p>
        </div>

        <div class="rpg-card mode-card clickable" id="card-endless">
          <div class="mode-card-head"><div class="mode-icon">🗼</div><span class="mode-tag ${endlessOpen ? "gold" : "locked"}">${endlessOpen ? `Kỷ lục Tầng ${st.endlessRecord.bestFloor}` : "Chưa mở khóa"}</span></div>
          <h3>Tháp Vô Tận (Hardcore)</h3>
          <p>Chế độ sinh tồn chỉ 1 mạng duy nhất, câu hỏi trộn liên hoàn 230 câu, đồng hồ tăng tốc dần. Mở khóa sau khi hạ Final Boss (hoặc bật Mở khóa tự do).</p>
        </div>
      </div>
    `;

    document.getElementById("m-campaign").onclick = () => { SLAudio.playClick(); go("worldmap"); };
    document.getElementById("m-practice").onclick = () => { SLAudio.playClick(); go("practice"); };
    document.getElementById("m-codex").onclick = () => { SLAudio.playClick(); go("codex"); };

    document.getElementById("card-worldmap").onclick = () => { SLAudio.playClick(); go("worldmap"); };
    document.getElementById("card-bounty").onclick = () => { SLAudio.playClick(); go("bounty"); };
    document.getElementById("card-practice").onclick = () => { SLAudio.playClick(); go("practice"); };
    document.getElementById("card-exam").onclick = () => { SLAudio.playClick(); go("exam"); };
    document.getElementById("card-bossrush").onclick = () => {
      SLAudio.playClick();
      const avail = [3, 4, 5, 6, 7].filter(ch => SLProgression.isChapterUnlocked(ch));
      if (avail.length === 0) return toast("Hãy mở khóa ít nhất 1 chương trước!", "danger");
      SLCombat.start({ mode: "boss_rush", chapter: avail[0], bossRushQueue: avail.slice(1), bossRushCleared: 0 });
    };
    document.getElementById("card-endless").onclick = () => {
      SLAudio.playClick();
      if (!endlessOpen) {
        toast("Hãy đánh bại Final Boss Chương 7 (hoặc bật 'Mở khóa tự do' trong Cài đặt) để vào Tháp Vô Tận!", "danger");
        return;
      }
      SLCombat.start({ mode: "endless" });
    };
  }

  /* ============================================================
     03. WORLD MAP (5 REALMS)
     ============================================================ */
  function renderWorldMap(vp) {
    const st = SLStorage.get();

    const cards = SLQuestions.CHAPTERS.map(ch => {
      const unlocked = SLProgression.isChapterUnlocked(ch.chapter);
      const groups = SLQuestions.getGroups().filter(g => g.chapter === ch.chapter);
      const totalQ = SLQuestions.getByChapter(ch.chapter).length;
      const clearedCnt = groups.filter(g => !!st.clearedStages[`${ch.chapter}-${g.stage}`]).length;
      const bossDead = st.clearedBosses.includes(ch.chapter);
      const bountyCnt = SLProgression.getActiveBounties(ch.chapter).length;
      const pct = Math.round(((clearedCnt + (bossDead ? 1 : 0)) / (groups.length + 1)) * 100);

      return `
        <div class="realm-card ${ch.themeClass} ${unlocked ? "" : "locked"}" data-ch="${ch.chapter}">
          <div class="realm-top">
            <span class="realm-chap-pill">Chương ${ch.chapter}</span>
            ${bossDead ? `<span class="mode-tag emerald">✓ Đã hạ Boss</span>` : (bountyCnt > 0 ? `<span class="mode-tag danger">🎯 ${bountyCnt} Truy Nã</span>` : `<span class="mode-tag gold">${groups.length} ải</span>`)}
          </div>
          <div class="realm-emblem">${SLArt.realmEmblemSVG(ch.chapter)}</div>
          <div class="realm-name">${ch.realmName}</div>
          <div class="realm-sub">${ch.subtitle}</div>
          <div class="realm-meta-row">
            <span>Ải: ${clearedCnt}/${groups.length}</span>
            <span>${totalQ} câu hỏi</span>
          </div>
          <div class="bar-track"><div class="bar-fill gold" style="width:${pct}%;"></div></div>
          <div style="font-size:12px;color:var(--text-muted);text-align:center;">
            Boss: <strong style="color:#fca5a5;">${SLBosses.get(ch.chapter).name}</strong>
          </div>
          ${!unlocked ? `
            <div class="realm-lock-overlay">
              <div style="font-size:28px;">🔒</div>
              <div style="font-weight:700;color:var(--gold-bright);">Chưa Mở Khóa</div>
              <div style="font-size:12px;color:var(--text-soft);">Hạ gục Boss Chương ${ch.chapter - 1} để mở vùng đất này</div>
            </div>
          ` : ""}
        </div>
      `;
    }).join("");

    vp.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="fantasy-title">BẢN ĐỒ THẾ GIỚI – 5 VÙNG ĐẤT TRI THỨC</h1>
          <p>Chọn vùng đất đã mở khóa để vào chinh phục các ải và khiêu chiến Boss cuối chương.</p>
        </div>
        <button class="btn btn-ghost" id="wm-back">← Trang Chủ</button>
      </div>
      <div class="world-map-grid">${cards}</div>
    `;

    document.getElementById("wm-back").onclick = () => { SLAudio.playClick(); go("menu"); };
    vp.querySelectorAll(".realm-card").forEach(el => {
      el.onclick = () => {
        const ch = Number(el.getAttribute("data-ch"));
        if (!SLProgression.isChapterUnlocked(ch)) {
          SLAudio.playWrong();
          toast(`Hãy đánh bại Boss Chương ${ch - 1} (hoặc bật 'Mở khóa tự do' trong Cài đặt)!`, "danger");
          return;
        }
        SLAudio.playClick();
        go("stages", { chapter: ch });
      };
    });
  }

  /* ============================================================
     04. STAGE SELECTION
     ============================================================ */
  function renderStages(vp, chapter) {
    const st = SLStorage.get();
    const chMeta = SLQuestions.getChapterMeta(chapter);
    const groups = SLQuestions.getGroups().filter(g => g.chapter === Number(chapter));
    const boss = SLBosses.get(chapter);
    const bossGate = SLProgression.isBossUnlocked(chapter);
    const bossDead = st.clearedBosses.includes(Number(chapter));

    let pathHtml = "";
    groups.forEach((g, idx) => {
      const unlocked = SLProgression.isStageUnlocked(chapter, g.stage);
      const rec = st.clearedStages[`${chapter}-${g.stage}`];
      const mName = chMeta.monsterNames[idx % chMeta.monsterNames.length];
      const displayQCount = g.count <= 4 ? `${g.count} gốc + 3 ôn` : (g.count <= 6 ? `${g.count} gốc + 2 ôn` : `${g.count} câu`);

      pathHtml += `
        <div class="stage-node ${unlocked ? "" : "locked"} ${rec ? "cleared" : ""}" data-stage="${g.stage}">
          ${rec ? `<div class="rank-badge rank-${rec.rank} stage-rank-corner">${rec.rank}</div>` : ""}
          <div class="stage-node-code">Ải ${chapter}.${g.stage} ${unlocked ? "" : "🔒"}</div>
          <div class="stage-node-art">${SLArt.monsterSVG(chapter, g.stage)}</div>
          <div style="font-family:var(--font-display);font-size:15px;color:var(--gold-bright);">${mName}</div>
          <div class="stage-node-title">${g.groupTitle}</div>
          <div class="stage-node-meta">Câu ${g.startId}–${g.endId} • ${displayQCount}</div>
          <button class="btn ${rec ? "btn-ghost" : "btn-gold"} btn-sm" style="width:100%;margin-top:auto;" ${unlocked ? "" : "disabled"}>
            ${unlocked ? (rec ? "🔄 Đánh Lại" : "⚔️ Khiêu Chiến") : "🔒 Đang Khóa"}
          </button>
        </div>
      `;

      // Connector line to next stage or boss
      const lineLit = !!rec || st.settings.unlockAllMode;
      pathHtml += `<div class="stage-connector"><div class="stage-connector-line ${lineLit ? "unlocked" : ""}"></div></div>`;
    });

    // Final Boss Node
    pathHtml += `
      <div class="stage-node boss-node ${bossGate.canFight ? "" : "locked"}" id="node-boss">
        ${bossDead ? `<div class="rank-badge rank-SS stage-rank-corner">✓</div>` : ""}
        <div class="stage-node-code" style="color:#fca5a5;">BOSS CHƯƠNG ${chapter} ${bossGate.canFight ? "" : "🔒"}</div>
        <div class="stage-node-art">${SLArt.bossSVG(chapter)}</div>
        <div style="font-family:var(--font-display);font-size:16.5px;color:#fef08a;">${boss.name}</div>
        <div class="stage-node-title" style="color:#fecaca;">${boss.questionCount} câu • ${boss.timePerQuestion} giây/câu</div>
        <div class="stage-node-meta" style="color:#fda4af;">Debuff: ${boss.debuffs.map(d => SLBosses.getDebuff(d).name).join(", ")}</div>
        <button class="btn btn-crimson btn-sm" style="width:100%;margin-top:auto;" ${bossGate.canFight ? "" : "disabled"}>
          ${bossGate.canFight ? (bossDead ? "🔥 Tái Đấu Boss" : "🐉 Quyết Chiến Boss") : "🔒 Chưa Đủ Điều Kiện"}
        </button>
      </div>
    `;

    vp.innerHTML = `
      <div class="stage-realm-banner ${chMeta.themeClass}">
        <div style="display:flex;align-items:center;gap:16px;">
          <div style="width:62px;height:62px;">${SLArt.realmEmblemSVG(chapter)}</div>
          <div>
            <div style="font-size:12px;font-weight:800;color:var(--gold-bright);letter-spacing:0.8px;">CHƯƠNG ${chapter}</div>
            <h1 class="fantasy-title" style="font-size:28px;">${chMeta.realmName}</h1>
            <div style="color:var(--text-soft);font-size:13.5px;">${chMeta.subtitle}</div>
          </div>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-blue btn-sm" id="st-practice-ch">📖 Luyện Tập Chương ${chapter}</button>
          <button class="btn btn-ghost btn-sm" id="st-back-wm">← Bản Đồ Thế Giới</button>
        </div>
      </div>

      <div class="stage-pathway">${pathHtml}</div>

      ${bossGate.activeBountyCount > 0 ? `
        <div class="boss-gate-alert">
          <div>
            <strong>⚠ Cổng Boss Chương ${chapter} đang bị phong ấn!</strong>
            Bạn còn <strong>${bossGate.activeBountyCount} câu hỏi chưa tiêu diệt</strong> trong Sổ Truy Nã thuộc Chương ${chapter}. Hãy tiêu diệt chúng (đúng 2 lần liên tiếp) trước khi vào đấu Boss.
          </div>
          <button class="btn btn-crimson btn-sm" id="st-hunt-bounty">🎯 Săn Truy Nã Chương ${chapter} Ngay</button>
        </div>
      ` : (!bossGate.allStagesCleared ? `
        <div style="margin-top:14px;text-align:center;color:var(--text-muted);font-size:13px;">
          Hoàn thành toàn bộ ${groups.length} ải của Chương ${chapter} để mở phong ấn cổng Boss <strong>${boss.name}</strong>.
        </div>
      ` : "")}
    `;

    document.getElementById("st-back-wm").onclick = () => { SLAudio.playClick(); go("worldmap"); };
    document.getElementById("st-practice-ch").onclick = () => { SLAudio.playClick(); go("practice", { chapter }); };

    const huntBtn = document.getElementById("st-hunt-bounty");
    if (huntBtn) {
      huntBtn.onclick = () => {
        SLAudio.playClick();
        SLCombat.start({ mode: "bounty", bountyChapter: chapter });
      };
    }

    vp.querySelectorAll(".stage-node[data-stage]").forEach(el => {
      el.onclick = () => {
        const sNum = Number(el.getAttribute("data-stage"));
        if (!SLProgression.isStageUnlocked(chapter, sNum)) {
          SLAudio.playWrong();
          toast(`Hãy hoàn thành Ải ${chapter}.${sNum - 1} trước!`, "danger");
          return;
        }
        SLAudio.playClick();
        SLCombat.start({ mode: "campaign", chapter, stage: sNum });
      };
    });

    document.getElementById("node-boss").onclick = () => {
      if (!bossGate.canFight) {
        SLAudio.playWrong();
        if (bossGate.activeBountyCount > 0) {
          toast(`Còn ${bossGate.activeBountyCount} câu Truy Nã ở Chương ${chapter} chưa tiêu diệt!`, "danger");
        } else {
          toast("Hãy vượt qua tất cả các ải trong chương trước khi đấu Boss!", "danger");
        }
        return;
      }
      SLAudio.playClick();
      SLCombat.start({ mode: "boss", chapter });
    };
  }

  /* ============================================================
     06. BOUNTY BOARD (SỔ TRUY NÃ)
     ============================================================ */
  function renderBountyBoard(vp) {
    let tab = "active";
    let chFilter = "all";

    function draw() {
      const allB = SLProgression.getAllBounties();
      const activeCnt = allB.filter(b => b.status === "active").length;
      const clearedCnt = allB.filter(b => b.status === "cleared").length;

      const filtered = allB.filter(b => {
        if (tab === "active" && b.status !== "active") return false;
        if (tab === "cleared" && b.status !== "cleared") return false;
        if (chFilter !== "all" && Number(b.chapter) !== Number(chFilter)) return false;
        return true;
      });

      vp.innerHTML = `
        <div class="section-header">
          <div>
            <h1 class="fantasy-title">SỔ TRUY NÃ – BOUNTY BOARD</h1>
            <p>Mọi câu hỏi trả lời sai đều được lưu vĩnh viễn để ôn tập. Trả lời đúng <strong>2 lần liên tiếp</strong> trong vòng Săn Truy Nã để đánh dấu "Đã tiêu diệt" và mở cổng Boss.</p>
          </div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button class="btn btn-crimson" id="bb-hunt" ${activeCnt === 0 ? "disabled" : ""}>
              🎯 Săn Quái Tinh Anh (${activeCnt})
            </button>
            <button class="btn btn-ghost" id="bb-back">← Trang Chủ</button>
          </div>
        </div>

        <div class="filter-bar">
          <button class="tab-btn ${tab === "active" ? "active" : ""}" data-tab="active">🔥 Đang Truy Nã (${activeCnt})</button>
          <button class="tab-btn ${tab === "cleared" ? "active" : ""}" data-tab="cleared">✓ Đã Tiêu Diệt (${clearedCnt})</button>
          <button class="tab-btn ${tab === "all" ? "active" : ""}" data-tab="all">📜 Toàn Bộ Lịch Sử (${allB.length})</button>
          <select class="rpg-select" id="bb-ch-filter">
            <option value="all" ${chFilter === "all" ? "selected" : ""}>Tất cả các chương</option>
            ${[3, 4, 5, 6, 7].map(c => `<option value="${c}" ${String(chFilter) === String(c) ? "selected" : ""}>Chương ${c}</option>`).join("")}
          </select>
        </div>

        <div class="bounty-list">
          ${filtered.length === 0 ? `
            <div class="rpg-card" style="text-align:center;padding:34px;color:var(--text-muted);">
              ${activeCnt === 0 && tab === "active"
                ? "✨ Tuyệt vời! Hiện không còn mục tiêu truy nã nào đang mở. Cổng Boss hoàn toàn thông thoáng!"
                : "Chưa có bản ghi nào trong mục lọc này."}
            </div>
          ` : filtered.map(b => {
            const q = SLQuestions.getById(b.id);
            if (!q) return "";
            const isCleared = b.status === "cleared";
            return `
              <div class="bounty-item ${isCleared ? "cleared" : ""}">
                <div class="bounty-meta">
                  <span><strong>Câu #${q.id}</strong> • Chương ${q.chapter} • Ải ${q.chapter}.${q.stage} (${q.groupTitle})</span>
                  <span>
                    Sai: <strong style="color:#fca5a5;">${b.wrongCount} lần</strong> •
                    Tiến độ diệt: <strong style="color:${isCleared ? "#6ee7b7" : "#fde047"};">${isCleared ? "✓ ĐÃ TIÊU DIỆT (2/2)" : `${b.consecutiveCorrect} / 2 đúng liên tiếp`}</strong>
                  </span>
                </div>
                <div class="bounty-q">${escapeHtml(q.question)}</div>
                <div class="bounty-ans-row">
                  <span class="ans-correct-pill">✓ Đáp án đúng: ${escapeHtml(q.answers[q.correctAnswer])}</span>
                  <span class="ans-wrong-pill">✖ Lần sai gần nhất: ${escapeHtml(b.lastWrongText)}</span>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      `;

      document.getElementById("bb-back").onclick = () => { SLAudio.playClick(); go("menu"); };
      document.getElementById("bb-hunt").onclick = () => {
        SLAudio.playClick();
        SLCombat.start({ mode: "bounty", bountyChapter: chFilter === "all" ? null : Number(chFilter) });
      };
      vp.querySelectorAll(".tab-btn[data-tab]").forEach(btn => {
        btn.onclick = () => { SLAudio.playClick(); tab = btn.getAttribute("data-tab"); draw(); };
      });
      document.getElementById("bb-ch-filter").onchange = (e) => { chFilter = e.target.value; draw(); };
    }
    draw();
  }

  /* ============================================================
     02. CHARACTER PROFILE
     ============================================================ */
  function renderProfile(vp) {
    const st = SLStorage.get();
    const sum = SLProgression.getMasterySummary();
    const expNeed = SLProgression.expForNextLevel(st.level);
    const expPct = Math.min(100, Math.round((st.exp / expNeed) * 100));

    vp.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="fantasy-title">HỒ SƠ CHIẾN BINH TRI THỨC</h1>
          <p>Quản lý nhân vật, cấp độ, kỹ năng đang trang bị và bộ sưu tập Boss đã chinh phục.</p>
        </div>
        <button class="btn btn-ghost" id="pr-back">← Trang Chủ</button>
      </div>

      <div class="two-col-grid">
        <div class="rpg-panel" style="padding:22px;text-align:center;">
          <div style="width:128px;height:128px;margin:0 auto 12px;border-radius:16px;overflow:hidden;border:2px solid var(--gold);">
            ${SLArt.heroAvatarSVG()}
          </div>
          <h2 class="fantasy-title" style="font-size:24px;">${escapeHtml(st.heroName)}</h2>
          <div style="color:#7dd3fc;font-size:13px;font-weight:700;margin:4px 0 12px;">
            ${st.titles[st.titles.length - 1] || "Người Khai Mở"}
          </div>

          <div style="display:flex;gap:8px;margin-bottom:16px;">
            <input class="rpg-input" id="pr-name-input" value="${escapeHtml(st.heroName)}" maxlength="28" style="flex:1;" placeholder="Đổi tên nhân vật...">
            <button class="btn btn-gold btn-sm" id="pr-save-name">Lưu</button>
          </div>

          <div style="text-align:left;margin-bottom:16px;">
            <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;">
              <strong>Cấp ${st.level}</strong>
              <span style="color:var(--gold-bright);">${st.exp} / ${expNeed} EXP</span>
            </div>
            <div class="bar-track"><div class="bar-fill blue" style="width:${expPct}%;"></div></div>
          </div>

          <div class="grid-2" style="gap:8px;">
            <div class="mini-stat"><div class="val">${sum.accuracy}%</div><div class="lbl">Chính xác</div></div>
            <div class="mini-stat"><div class="val">x${st.bestComboEver}</div><div class="lbl">Combo kỷ lục</div></div>
            <div class="mini-stat"><div class="val">${sum.avgSpeed}s</div><div class="lbl">Tốc độ TB</div></div>
            <div class="mini-stat"><div class="val">${sum.mastered}/230</div><div class="lbl">Câu đã thuộc</div></div>
          </div>
        </div>

        <div style="display:flex;flex-direction:column;gap:18px;">
          <!-- Equipped Skills -->
          <div class="rpg-panel" style="padding:20px;">
            <h3 class="fantasy-title" style="font-size:20px;margin-bottom:10px;">Thẻ Kỹ Năng Đang Trang Bị (${st.equippedSkills.length}/3)</h3>
            ${st.equippedSkills.length === 0 ? `
              <p style="color:var(--text-muted);font-size:13.5px;">Chưa trang bị thẻ nào. Hãy vượt qua các ải chiến dịch để thu thập Thẻ Kỹ Năng Huyền Thoại!</p>
            ` : `
              <div class="grid-3">
                ${st.equippedSkills.map(id => {
                  const sk = SLSkills.get(id);
                  return `
                    <div class="rpg-card" style="text-align:center;">
                      <div style="width:52px;height:52px;margin:0 auto 6px;">${SLArt.skillSVG(id)}</div>
                      <div style="font-family:var(--font-display);font-size:16px;color:var(--gold-bright);">${sk.name}</div>
                      <div style="font-size:12px;color:var(--text-muted);margin:6px 0 10px;">${sk.shortDesc}</div>
                      <button class="btn btn-ghost btn-sm pr-unequip" data-sid="${id}">Gỡ Thẻ</button>
                    </div>
                  `;
                }).join("")}
              </div>
            `}
          </div>

          <!-- Titles -->
          <div class="rpg-panel" style="padding:20px;">
            <h3 class="fantasy-title" style="font-size:20px;margin-bottom:10px;">Danh Hiệu Đã Đạt (${st.titles.length})</h3>
            <div style="display:flex;flex-wrap:wrap;gap:8px;">
              ${st.titles.map(t => `<span class="mode-tag gold" style="font-size:13px;padding:5px 12px;">🏅 ${escapeHtml(t)}</span>`).join("")}
            </div>
          </div>

          <!-- Boss Collection -->
          <div class="rpg-panel" style="padding:20px;">
            <h3 class="fantasy-title" style="font-size:20px;margin-bottom:12px;">Bộ Sưu Tập Boss Đã Tiêu Diệt (${st.clearedBosses.length}/5)</h3>
            <div class="grid-3">
              ${SLBosses.getAll().map(b => {
                const slain = st.clearedBosses.includes(b.chapter);
                return `
                  <div class="rpg-card" style="text-align:center;${slain ? "border-color:rgba(16,185,129,0.5);" : "opacity:0.45;filter:grayscale(0.9);"}">
                    <div style="width:76px;height:76px;margin:0 auto;">${SLArt.bossSVG(b.chapter)}</div>
                    <div style="font-family:var(--font-display);font-size:15px;color:${slain ? "var(--gold-bright)" : "var(--text-muted)"};margin-top:6px;">${b.name}</div>
                    <div style="font-size:11.5px;color:var(--text-muted);">Chương ${b.chapter} • ${slain ? "✓ Đã hạ gục" : "Chưa chinh phục"}</div>
                  </div>
                `;
              }).join("")}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById("pr-back").onclick = () => { SLAudio.playClick(); go("menu"); };
    document.getElementById("pr-save-name").onclick = () => {
      const val = document.getElementById("pr-name-input").value.trim();
      if (!val) return;
      SLStorage.update(s => { s.heroName = val; });
      updateTopNav();
      toast("Đã cập nhật tên chiến binh!", "success");
      renderProfile(vp);
    };
    vp.querySelectorAll(".pr-unequip").forEach(btn => {
      btn.onclick = () => {
        SLAudio.playClick();
        SLSkills.unequip(btn.getAttribute("data-sid"));
        renderProfile(vp);
      };
    });
  }

  /* ============================================================
     08. HALL OF LEGENDS
     ============================================================ */
  function renderHallOfLegends(vp) {
    const st = SLStorage.get();
    const sum = SLProgression.getMasterySummary();

    const rankCounts = { SS: 0, S: 0, A: 0, B: 0, C: 0 };
    Object.values(st.clearedStages).forEach(r => { if (rankCounts[r.rank] !== undefined) rankCounts[r.rank]++; });

    const weakest = Object.values(st.bounty)
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 8);

    vp.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="fantasy-title">ĐẠI SẢNH HUYỀN THOẠI – HALL OF LEGENDS</h1>
          <p>Thống kê xếp hạng, thành tích, kỷ lục Tháp Vô Tận, lịch sử Thi Thử và phân tích lỗ hổng kiến thức.</p>
        </div>
        <button class="btn btn-ghost" id="hl-back">← Trang Chủ</button>
      </div>

      <div class="grid-3" style="margin-bottom:20px;">
        <div class="rpg-card" style="text-align:center;">
          <div style="font-size:12px;color:var(--text-muted);">TIẾN ĐỘ CHIẾN DỊCH</div>
          <div class="fantasy-title" style="font-size:32px;margin:4px 0;">${Math.round(((sum.clearedStagesCount + sum.clearedBossesCount) / 26) * 100)}%</div>
          <div style="font-size:12.5px;color:var(--text-soft);">${sum.clearedStagesCount}/21 ải • ${sum.clearedBossesCount}/5 Boss</div>
        </div>
        <div class="rpg-card" style="text-align:center;">
          <div style="font-size:12px;color:var(--text-muted);">PHÂN BỐ XẾP HẠNG ẢI</div>
          <div style="display:flex;justify-content:center;gap:10px;margin:10px 0;font-weight:800;">
            <span style="color:#fef08a;">SS: ${rankCounts.SS}</span>
            <span style="color:#fcd34d;">S: ${rankCounts.S}</span>
            <span style="color:#7dd3fc;">A: ${rankCounts.A}</span>
            <span style="color:#6ee7b7;">B: ${rankCounts.B}</span>
            <span style="color:#cbd5e1;">C: ${rankCounts.C}</span>
          </div>
          <div style="font-size:12px;color:var(--text-muted);">Tổng trả lời: ${st.totalAnswered} lượt (${sum.accuracy}% đúng)</div>
        </div>
        <div class="rpg-card" style="text-align:center;">
          <div style="font-size:12px;color:var(--text-muted);">KỶ LỤC CHẾ ĐỘ ĐẶC BIỆT</div>
          <div style="margin:8px 0;font-size:14px;">
            🗼 Tháp Vô Tận: <strong style="color:var(--gold-bright);">Tầng ${st.endlessRecord.bestFloor}</strong><br>
            🐉 Boss Rush: <strong style="color:#fca5a5;">${st.bossRushRecord.bestCleared}/5 Boss</strong>
          </div>
        </div>
      </div>

      <div class="rpg-panel" style="padding:20px;margin-bottom:20px;">
        <h3 class="fantasy-title" style="font-size:20px;margin-bottom:12px;">Thành Tích (${st.achievements.length}/${SLProgression.ACHIEVEMENTS.length})</h3>
        <div class="grid-2">
          ${SLProgression.ACHIEVEMENTS.map(a => {
            const done = st.achievements.includes(a.id);
            return `
              <div class="rpg-card" style="display:flex;align-items:center;gap:12px;${done ? "border-color:var(--gold-bright);" : "opacity:0.5;"}">
                <div style="font-size:28px;">${a.icon}</div>
                <div>
                  <div style="font-weight:700;color:${done ? "var(--gold-bright)" : "var(--text-soft)"};">${a.name} ${done ? "✓" : ""}</div>
                  <div style="font-size:12.5px;color:var(--text-muted);">${a.desc}</div>
                </div>
              </div>
            `;
          }).join("")}
        </div>
      </div>

      <div class="grid-2">
        <div class="rpg-panel" style="padding:20px;">
          <h3 class="fantasy-title" style="font-size:20px;margin-bottom:10px;">Câu Hỏi Thường Xuyên Sai Nhất</h3>
          ${weakest.length === 0 ? `<p style="color:var(--text-muted);font-size:13.5px;">Chưa có dữ liệu câu sai. Phong độ quá ấn tượng!</p>` : `
            <div style="display:flex;flex-direction:column;gap:10px;">
              ${weakest.map(b => {
                const q = SLQuestions.getById(b.id);
                if (!q) return "";
                return `
                  <div style="padding:10px;border-radius:8px;background:rgba(9,14,26,0.75);border:1px solid rgba(239,68,68,0.28);">
                    <div style="font-size:12px;color:#fca5a5;font-weight:700;">Câu #${q.id} (Ch.${q.chapter}) • Sai ${b.wrongCount} lần</div>
                    <div style="font-size:13.5px;margin:3px 0;">${escapeHtml(q.question)}</div>
                    <div style="font-size:12.5px;color:#6ee7b7;">✓ ${escapeHtml(q.answers[q.correctAnswer])}</div>
                  </div>
                `;
              }).join("")}
            </div>
          `}
        </div>

        <div class="rpg-panel" style="padding:20px;">
          <h3 class="fantasy-title" style="font-size:20px;margin-bottom:10px;">Lịch Sử Thi Thử (${st.examHistory.length})</h3>
          ${st.examHistory.length === 0 ? `<p style="color:var(--text-muted);font-size:13.5px;">Chưa có bài thi thử nào. Hãy thử sức ở Chế độ Thi Thử!</p>` : `
            <div style="display:flex;flex-direction:column;gap:8px;">
              ${st.examHistory.slice().reverse().slice(0, 10).map(ex => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-radius:8px;background:rgba(9,14,26,0.75);border:1px solid rgba(212,166,74,0.22);">
                  <div>
                    <div style="font-weight:700;font-size:13.5px;">Đề ${ex.total} câu (${ex.correct}/${ex.total} đúng)</div>
                    <div style="font-size:11.5px;color:var(--text-muted);">${ex.date} • ${Math.floor(ex.durationSec / 60)}p ${ex.durationSec % 60}s</div>
                  </div>
                  <div class="fantasy-title" style="font-size:22px;color:${ex.score10 >= 8 ? "#34d399" : ex.score10 >= 5 ? "#fde047" : "#f87171"};">${ex.score10.toFixed(2)}</div>
                </div>
              `).join("")}
            </div>
          `}
        </div>
      </div>
    `;

    document.getElementById("hl-back").onclick = () => { SLAudio.playClick(); go("menu"); };
  }

  /* ============================================================
     SỔ TAY TRI THỨC (KNOWLEDGE CODEX – ALL 230 VERIFIED QUESTIONS)
     ============================================================ */
  function renderCodex(vp) {
    let searchTxt = "";
    let chFilter = "all";
    let statusFilter = "all";

    function drawList() {
      const st = SLStorage.get();
      const all = SLQuestions.getAll();
      const kw = searchTxt.trim().toLowerCase();

      const filtered = all.filter(q => {
        if (chFilter !== "all" && Number(q.chapter) !== Number(chFilter)) return false;
        const b = st.bounty[q.id];
        const qs = st.questionStats[q.id];
        const isWeak = b && (b.status === "active" || b.wrongCount > 0);
        const isMastered = qs && qs.correct >= 1 && (!b || b.status === "cleared");
        const isUnseen = !qs || qs.attempts === 0;

        if (statusFilter === "weak" && !isWeak) return false;
        if (statusFilter === "mastered" && !isMastered) return false;
        if (statusFilter === "unseen" && !isUnseen) return false;

        if (kw) {
          const hay = (`câu ${q.id} ${q.question} ${Object.values(q.answers).join(" ")} ${q.groupTitle}`).toLowerCase();
          if (!hay.includes(kw)) return false;
        }
        return true;
      });

      const listEl = document.getElementById("codex-list");
      const countEl = document.getElementById("codex-count");
      if (countEl) countEl.textContent = `Hiển thị ${filtered.length} / 230 câu hỏi gốc`;

      listEl.innerHTML = filtered.map(q => {
        const b = st.bounty[q.id];
        const qs = st.questionStats[q.id];
        const tag = b && b.status === "active"
          ? `<span class="mode-tag danger">Đang Truy Nã</span>`
          : (qs && qs.correct > 0 ? `<span class="mode-tag emerald">Đã học (${qs.correct}/${qs.attempts})</span>` : `<span class="mode-tag locked">Chưa gặp</span>`);

        return `
          <div class="rpg-card" style="padding:14px 16px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;font-size:12px;color:var(--text-muted);">
              <span><strong style="color:var(--gold-bright);">Câu ${q.id}</strong> • Chương ${q.chapter} • Nhóm ${q.groupCode}: ${escapeHtml(q.groupTitle)}</span>
              ${tag}
            </div>
            <div style="font-weight:600;margin-bottom:8px;font-size:14.5px;">${escapeHtml(q.question)}</div>
            <div class="ans-correct-pill" style="display:inline-block;">✓ Đáp án chuẩn (${q.correctAnswer}): ${escapeHtml(q.answers[q.correctAnswer])}</div>
          </div>
        `;
      }).join("");
    }

    vp.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="fantasy-title">SỔ TAY TRI THỨC – 230 CÂU HỎI CHUẨN</h1>
          <p>Tra cứu nguyên văn 230 câu hỏi (Câu 71 – Câu 300) kèm đáp án chuẩn đã đối chiếu 100% từ tài liệu gốc.</p>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <button class="btn btn-gold" id="cx-smart">🧠 Ôn Tập Thông Minh (Câu Hay Sai & Chậm)</button>
          <button class="btn btn-ghost" id="cx-back">← Trang Chủ</button>
        </div>
      </div>

      <div class="filter-bar">
        <input class="rpg-input" id="cx-search" placeholder="Tìm từ khóa hoặc số câu (vd: 191, dân chủ, gia đình)..." style="flex:1;min-width:240px;">
        <select class="rpg-select" id="cx-ch">
          <option value="all">Tất cả 5 chương (230 câu)</option>
          ${[3, 4, 5, 6, 7].map(c => `<option value="${c}">Chương ${c} – ${SLQuestions.getChapterMeta(c).realmName}</option>`).join("")}
        </select>
        <select class="rpg-select" id="cx-st">
          <option value="all">Mọi trạng thái</option>
          <option value="weak">Hay sai / Truy Nã</option>
          <option value="mastered">Đã học</option>
          <option value="unseen">Chưa gặp</option>
        </select>
      </div>
      <div id="codex-count" style="font-size:12.5px;color:var(--text-muted);margin-bottom:12px;"></div>
      <div id="codex-list" style="display:flex;flex-direction:column;gap:10px;"></div>
    `;

    document.getElementById("cx-back").onclick = () => { SLAudio.playClick(); go("menu"); };
    document.getElementById("cx-smart").onclick = () => { SLAudio.playClick(); go("practice", { smart: true }); };
    document.getElementById("cx-search").oninput = (e) => { searchTxt = e.target.value; drawList(); };
    document.getElementById("cx-ch").onchange = (e) => { chFilter = e.target.value; drawList(); };
    document.getElementById("cx-st").onchange = (e) => { statusFilter = e.target.value; drawList(); };

    drawList();
  }

  /* ============================================================
     PRACTICE MODE (LUYỆN TẬP KHÔNG ÁP LỰC & ÔN THÔNG MINH)
     ============================================================ */
  function renderPracticeSetup(vp, params = {}) {
    if (params.smart) {
      startPracticeSession("smart", null);
      return;
    }
    if (params.chapter) {
      startPracticeSession("chapter", params.chapter);
      return;
    }

    vp.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="fantasy-title">CHẾ ĐỘ LUYỆN TẬP KHÔNG ÁP LỰC</h1>
          <p>Không giới hạn thời gian, không mất tim, công bố đáp án ngay lập tức, tự động đảo thứ tự câu hỏi và vị trí đáp án ở mỗi lượt.</p>
        </div>
        <button class="btn btn-ghost" id="pt-back">← Trang Chủ</button>
      </div>

      <div class="grid-3">
        <div class="rpg-card clickable" id="pt-smart" style="border-color:var(--gold-bright);">
          <div style="font-size:28px;margin-bottom:6px;">🧠</div>
          <h3 class="fantasy-title" style="font-size:19px;">Ôn Tập Thông Minh (25 câu)</h3>
          <p style="font-size:13px;color:var(--text-muted);margin-top:6px;">Tự động gom các câu bạn hay sai nhất, trả lời chậm nhất và câu chưa gặp để rèn trọng tâm.</p>
        </div>

        <div class="rpg-card clickable" id="pt-all">
          <div style="font-size:28px;margin-bottom:6px;">📚</div>
          <h3 class="fantasy-title" style="font-size:19px;">Toàn Bộ 230 Câu (Trộn Đều)</h3>
          <p style="font-size:13px;color:var(--text-muted);margin-top:6px;">Luyện tổng hợp toàn bộ Câu 71 – Câu 300 theo thứ tự ngẫu nhiên.</p>
        </div>

        ${SLQuestions.CHAPTERS.map(ch => `
          <div class="rpg-card clickable pt-ch-card" data-ch="${ch.chapter}">
            <div style="width:42px;height:42px;margin-bottom:8px;">${SLArt.realmEmblemSVG(ch.chapter)}</div>
            <h3 class="fantasy-title" style="font-size:18px;">Chương ${ch.chapter}: ${ch.realmName}</h3>
            <p style="font-size:12.5px;color:var(--text-muted);margin-top:6px;">${SLQuestions.getByChapter(ch.chapter).length} câu hỏi • ${ch.subtitle}</p>
          </div>
        `).join("")}
      </div>
    `;

    document.getElementById("pt-back").onclick = () => { SLAudio.playClick(); go("menu"); };
    document.getElementById("pt-smart").onclick = () => { SLAudio.playClick(); startPracticeSession("smart", null); };
    document.getElementById("pt-all").onclick = () => { SLAudio.playClick(); startPracticeSession("all", null); };
    vp.querySelectorAll(".pt-ch-card").forEach(c => {
      c.onclick = () => { SLAudio.playClick(); startPracticeSession("chapter", Number(c.getAttribute("data-ch"))); };
    });
  }

  function startPracticeSession(kind, chapter) {
    let deck = [];
    let label = "";
    if (kind === "smart") {
      deck = SLQuestions.buildSmartReviewDeck(25);
      label = "Ôn Tập Thông Minh (25 câu trọng tâm)";
    } else if (kind === "chapter") {
      deck = SLQuestions.shuffle(SLQuestions.getByChapter(chapter)).map(q => SLQuestions.prepareQuestion(q));
      label = `Luyện Tập Chương ${chapter} – ${SLQuestions.getChapterMeta(chapter).realmName}`;
    } else {
      deck = SLQuestions.shuffle(SLQuestions.getAll()).map(q => SLQuestions.prepareQuestion(q));
      label = "Luyện Tập Tổng Hợp 230 Câu";
    }

    practiceState = { label, deck, idx: 0, correct: 0, wrong: 0, answered: false };
    renderPracticeCard();
  }

  function renderPracticeCard() {
    const vp = document.getElementById("screen-viewport");
    const ps = practiceState;
    if (!ps || ps.idx >= ps.deck.length) {
      vp.innerHTML = `
        <div class="rpg-panel" style="max-width:620px;margin:24px auto;padding:28px;text-align:center;">
          <h2 class="fantasy-title" style="font-size:30px;">HOÀN THÀNH PHIÊN LUYỆN TẬP!</h2>
          <p style="color:var(--text-soft);margin:8px 0 18px;">${ps.label}</p>
          <div class="result-metrics" style="grid-template-columns:repeat(3,1fr);margin-bottom:18px;">
            <div class="metric-cell"><div class="lbl">Tổng câu</div><div class="val">${ps.deck.length}</div></div>
            <div class="metric-cell"><div class="lbl">Đúng</div><div class="val" style="color:#34d399;">${ps.correct}</div></div>
            <div class="metric-cell"><div class="lbl">Sai</div><div class="val" style="color:#f87171;">${ps.wrong}</div></div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-gold" id="pt-done-again">🔄 Luyện Lại (Đảo Câu Mới)</button>
            <button class="btn btn-ghost" id="pt-done-back">← Chọn Chủ Đề Khác</button>
          </div>
        </div>
      `;
      document.getElementById("pt-done-again").onclick = () => {
        SLAudio.playClick();
        const fresh = SLQuestions.shuffle(ps.deck).map(q => SLQuestions.prepareQuestion(SLQuestions.getById(q.id)));
        practiceState = { ...ps, deck: fresh, idx: 0, correct: 0, wrong: 0, answered: false };
        renderPracticeCard();
      };
      document.getElementById("pt-done-back").onclick = () => { SLAudio.playClick(); practiceState = null; go("practice"); };
      return;
    }

    const q = ps.deck[ps.idx];
    const pct = Math.round(((ps.idx + 1) / ps.deck.length) * 100);

    vp.innerHTML = `
      <div class="section-header" style="margin-bottom:14px;">
        <div>
          <h1 class="fantasy-title" style="font-size:24px;">${ps.label}</h1>
          <p>Câu ${ps.idx + 1} / ${ps.deck.length} • Đúng: <strong style="color:#34d399;">${ps.correct}</strong> • Sai: <strong style="color:#f87171;">${ps.wrong}</strong></p>
        </div>
        <button class="btn btn-ghost btn-sm" id="pt-exit">← Thoát Luyện Tập</button>
      </div>

      <div class="bar-track" style="margin-bottom:16px;"><div class="bar-fill emerald" style="width:${pct}%;"></div></div>

      <div class="question-box">
        <div class="question-meta-bar">
          <span class="q-chip">Câu #${q.id} • Chương ${q.chapter} • Nhóm ${q.groupCode}: ${escapeHtml(q.groupTitle)}</span>
          <span style="font-size:12px;">Phím tắt: 1–4 / A–D chọn • Enter sang câu kế</span>
        </div>
        <div class="question-text">${escapeHtml(q.question)}</div>
        <div class="answers-grid" id="pt-answers">
          ${["A", "B", "C", "D"].map(k => `
            <button class="answer-btn" data-key="${k}">
              <span class="answer-letter">${k}</span>
              <span>${escapeHtml(q.displayAnswers[k])}</span>
            </button>
          `).join("")}
        </div>
        <div id="pt-feedback" style="margin-top:14px;display:none;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px;">
          <div id="pt-fb-text" style="font-weight:700;"></div>
          <button class="btn btn-gold" id="pt-next-btn">Câu Tiếp Theo (Enter) →</button>
        </div>
      </div>
    `;

    document.getElementById("pt-exit").onclick = () => { SLAudio.playClick(); practiceState = null; go("practice"); };
    vp.querySelectorAll("#pt-answers .answer-btn").forEach(btn => {
      btn.onclick = () => choosePracticeAnswer(btn.getAttribute("data-key"));
    });
    document.getElementById("pt-next-btn").onclick = () => {
      SLAudio.playClick();
      ps.idx += 1;
      ps.answered = false;
      renderPracticeCard();
    };
  }

  function choosePracticeAnswer(key) {
    const ps = practiceState;
    if (!ps || ps.answered) return;
    ps.answered = true;
    const q = ps.deck[ps.idx];
    const ok = key === q.correctKey;

    if (ok) { ps.correct += 1; SLAudio.playSlash(); }
    else { ps.wrong += 1; SLAudio.playWrong(); }

    SLProgression.recordAnswer(q, ok, q.displayAnswers[key], 5, false);
    updateTopNav();

    document.querySelectorAll("#pt-answers .answer-btn").forEach(btn => {
      btn.disabled = true;
      const k = btn.getAttribute("data-key");
      if (k === q.correctKey) btn.classList.add("correct");
      else if (k === key && !ok) btn.classList.add("wrong");
    });

    const fb = document.getElementById("pt-feedback");
    const txt = document.getElementById("pt-fb-text");
    fb.style.display = "flex";
    txt.innerHTML = ok
      ? `<span style="color:#34d399;">✓ Chính xác! Kiến thức thuộc Chương ${q.chapter} – ${escapeHtml(q.groupTitle)}.</span>`
      : `<span style="color:#fca5a5;">✖ Chưa chính xác! Đáp án đúng là <strong>${q.correctKey}</strong> (đã lưu vào Sổ Truy Nã).</span>`;
  }

  function handlePracticeKey(e) {
    const k = e.key.toUpperCase();
    if (!practiceState) return;
    if (practiceState.answered && k === "ENTER") {
      e.preventDefault();
      practiceState.idx += 1;
      practiceState.answered = false;
      renderPracticeCard();
      return;
    }
    const mapKey = { "1": "A", "2": "B", "3": "C", "4": "D", "A": "A", "B": "B", "C": "C", "D": "D" };
    if (!practiceState.answered && mapKey[k]) {
      e.preventDefault();
      choosePracticeAnswer(mapKey[k]);
    }
  }

  /* ============================================================
     EXAM MODE (THI THỬ TRỘN 230 CÂU)
     ============================================================ */
  function renderExamSetup(vp) {
    vp.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="fantasy-title">CHẾ ĐỘ THI THỬ – EXAM MODE</h1>
          <p>Trộn ngẫu nhiên từ kho 230 câu hỏi, đảo toàn bộ phương án A–D, có đồng hồ làm bài và chấm điểm chi tiết.</p>
        </div>
        <button class="btn btn-ghost" id="ex-back">← Trang Chủ</button>
      </div>

      <div class="grid-2" style="max-width:860px;margin:0 auto;">
        <div class="rpg-card clickable ex-preset" data-n="30" data-min="20">
          <div class="mode-tag">Nhanh</div>
          <h3 class="fantasy-title" style="font-size:21px;margin:8px 0 4px;">Đề 30 Câu • 20 Phút</h3>
          <p style="font-size:13px;color:var(--text-muted);">Kiểm tra nhanh kiến thức tổng hợp cả 5 chương.</p>
        </div>
        <div class="rpg-card clickable ex-preset" data-n="50" data-min="35">
          <div class="mode-tag gold">Chuẩn Đề Thi Đại Học</div>
          <h3 class="fantasy-title" style="font-size:21px;margin:8px 0 4px;">Đề 50 Câu • 35 Phút</h3>
          <p style="font-size:13px;color:var(--text-muted);">Cấu trúc sát đề thi kết thúc học phần CNXHKH.</p>
        </div>
        <div class="rpg-card clickable ex-preset" data-n="100" data-min="60">
          <div class="mode-tag emerald">Nâng Cao</div>
          <h3 class="fantasy-title" style="font-size:21px;margin:8px 0 4px;">Đề 100 Câu • 60 Phút</h3>
          <p style="font-size:13px;color:var(--text-muted);">Rèn sức bền và độ phủ kiến thức diện rộng.</p>
        </div>
        <div class="rpg-card clickable ex-preset" data-n="230" data-min="120" style="border-color:rgba(239,68,68,0.5);">
          <div class="mode-tag danger">Tổng Ôn Toàn Tập</div>
          <h3 class="fantasy-title" style="font-size:21px;margin:8px 0 4px;">Toàn Bộ 230 Câu • 120 Phút</h3>
          <p style="font-size:13px;color:var(--text-muted);">Thi quét sạch 100% ngân hàng câu hỏi (Câu 71 – Câu 300).</p>
        </div>
      </div>
    `;

    document.getElementById("ex-back").onclick = () => { SLAudio.playClick(); go("menu"); };
    vp.querySelectorAll(".ex-preset").forEach(el => {
      el.onclick = () => {
        SLAudio.playClick();
        startExam(Number(el.getAttribute("data-n")), Number(el.getAttribute("data-min")));
      };
    });
  }

  function startExam(count, minutes) {
    if (examTimerHandle) clearInterval(examTimerHandle);
    const deck = SLQuestions.buildExamDeck(count);
    examState = {
      deck,
      answers: {}, // { index: 'A'|'B'|'C'|'D' }
      idx: 0,
      totalSec: minutes * 60,
      leftSec: minutes * 60,
      submitted: false
    };

    examTimerHandle = setInterval(() => {
      if (!examState || examState.submitted) return;
      examState.leftSec = Math.max(0, examState.leftSec - 1);
      const tEl = document.getElementById("ex-timer");
      if (tEl) tEl.textContent = formatMinSec(examState.leftSec);
      if (examState.leftSec <= 0) {
        submitExam();
      }
    }, 1000);

    renderExamScreen();
  }

  function renderExamScreen() {
    const vp = document.getElementById("screen-viewport");
    const ex = examState;
    const q = ex.deck[ex.idx];
    const answeredCount = Object.keys(ex.answers).length;

    vp.innerHTML = `
      <div class="section-header" style="margin-bottom:14px;">
        <div>
          <h1 class="fantasy-title" style="font-size:24px;">THI THỬ (${ex.deck.length} CÂU)</h1>
          <p>Đã làm: <strong>${answeredCount}/${ex.deck.length}</strong> câu • Thời gian còn lại: <strong id="ex-timer" style="color:var(--gold-bright);">${formatMinSec(ex.leftSec)}</strong></p>
        </div>
        <div style="display:flex;gap:10px;">
          ${!ex.submitted ? `<button class="btn btn-gold" id="ex-submit">✔ Nộp Bài & Chấm Điểm</button>` : `<button class="btn btn-gold" id="ex-new">🔄 Đề Thi Mới</button>`}
          <button class="btn btn-ghost" id="ex-exit">Thoát</button>
        </div>
      </div>

      ${ex.submitted ? renderExamScoreBanner(ex) : ""}

      <div class="two-col-grid" style="grid-template-columns:1fr 310px;">
        <div class="question-box">
          <div class="question-meta-bar">
            <span class="q-chip">Câu thi ${ex.idx + 1} / ${ex.deck.length} (Gốc #${q.id} • Ch.${q.chapter})</span>
          </div>
          <div class="question-text">${escapeHtml(q.question)}</div>
          <div class="answers-grid" id="ex-answers">
            ${["A", "B", "C", "D"].map(k => {
              const picked = ex.answers[ex.idx] === k;
              let cls = "";
              if (ex.submitted) {
                if (k === q.correctKey) cls = "correct";
                else if (picked && k !== q.correctKey) cls = "wrong";
              } else if (picked) {
                cls = "correct"; // highlight selected
              }
              return `
                <button class="answer-btn ${cls}" data-key="${k}" ${ex.submitted ? "disabled" : ""}>
                  <span class="answer-letter">${k}</span>
                  <span>${escapeHtml(q.displayAnswers[k])}</span>
                </button>
              `;
            }).join("")}
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:14px;">
            <button class="btn btn-ghost btn-sm" id="ex-prev" ${ex.idx === 0 ? "disabled" : ""}>← Câu Trước</button>
            <button class="btn btn-ghost btn-sm" id="ex-next" ${ex.idx === ex.deck.length - 1 ? "disabled" : ""}>Câu Sau →</button>
          </div>
        </div>

        <div class="rpg-panel" style="padding:14px;">
          <div style="font-weight:700;font-size:13px;color:var(--gold-bright);margin-bottom:8px;">BẢNG ĐIỀU HƯỚNG CÂU HỎI</div>
          <div class="exam-nav-grid" id="ex-grid">
            ${ex.deck.map((item, i) => {
              const ans = ex.answers[i];
              let cls = i === ex.idx ? "current " : "";
              if (ex.submitted) {
                cls += (ans === item.correctKey ? "graded-ok" : "graded-bad");
              } else if (ans) {
                cls += "answered";
              }
              return `<button class="exam-q-dot ${cls}" data-i="${i}">${i + 1}</button>`;
            }).join("")}
          </div>
        </div>
      </div>
    `;

    document.getElementById("ex-exit").onclick = () => {
      if (examTimerHandle) { clearInterval(examTimerHandle); examTimerHandle = null; }
      examState = null;
      go("exam");
    };
    const subBtn = document.getElementById("ex-submit");
    if (subBtn) subBtn.onclick = () => submitExam();
    const newBtn = document.getElementById("ex-new");
    if (newBtn) newBtn.onclick = () => go("exam");

    document.getElementById("ex-prev").onclick = () => { if (ex.idx > 0) { ex.idx--; renderExamScreen(); } };
    document.getElementById("ex-next").onclick = () => { if (ex.idx < ex.deck.length - 1) { ex.idx++; renderExamScreen(); } };

    vp.querySelectorAll("#ex-answers .answer-btn").forEach(btn => {
      btn.onclick = () => {
        if (ex.submitted) return;
        SLAudio.playClick();
        ex.answers[ex.idx] = btn.getAttribute("data-key");
        renderExamScreen();
      };
    });

    vp.querySelectorAll("#ex-grid .exam-q-dot").forEach(btn => {
      btn.onclick = () => { ex.idx = Number(btn.getAttribute("data-i")); renderExamScreen(); };
    });
  }

  function submitExam() {
    if (!examState || examState.submitted) return;
    if (examTimerHandle) { clearInterval(examTimerHandle); examTimerHandle = null; }
    examState.submitted = true;

    let correct = 0;
    const durationSec = Math.max(1, examState.totalSec - examState.leftSec);
    const avgPerQ = durationSec / examState.deck.length;

    examState.deck.forEach((q, i) => {
      const picked = examState.answers[i];
      const ok = picked === q.correctKey;
      if (ok) correct++;
      SLProgression.recordAnswer(q, ok, picked ? q.displayAnswers[picked] : "(Bỏ trống)", avgPerQ, false);
    });

    const score10 = (correct / examState.deck.length) * 10;
    examState.result = { correct, total: examState.deck.length, score10, durationSec };

    SLStorage.update(st => {
      st.examHistory.push({
        date: new Date().toLocaleString("vi-VN"),
        total: examState.deck.length,
        correct,
        score10,
        durationSec
      });
    });

    SLProgression.addExp(correct * 5);
    if (score10 >= 8) SLProgression.unlockAchievement("exam_pass");
    updateTopNav();
    SLAudio.playVictory();
    renderExamScreen();
  }

  function renderExamScoreBanner(ex) {
    const r = ex.result;
    return `
      <div class="rpg-panel" style="padding:16px 20px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;border-color:${r.score10 >= 8 ? "#34d399" : "var(--gold)"};">
        <div>
          <div style="font-size:12px;color:var(--text-muted);">KẾT QUẢ CHẤM THI</div>
          <div class="fantasy-title" style="font-size:28px;">Điểm: ${r.score10.toFixed(2)} / 10.00 (${r.correct}/${r.total} câu đúng)</div>
          <div style="font-size:13px;color:var(--text-soft);">Các câu làm sai hoặc bỏ trống đã được tự động thêm vào Sổ Truy Nã để bạn ôn lại. Bấm vào ô đỏ bên phải để xem lại từng câu.</div>
        </div>
        <button class="btn btn-crimson btn-sm" onclick="SLApp.go('bounty')">🎯 Xem Sổ Truy Nã</button>
      </div>
    `;
  }

  /* ============================================================
     SETTINGS & SAVE MANAGER
     ============================================================ */
  function renderSettings(vp) {
    const st = SLStorage.get();
    const s = st.settings;

    vp.innerHTML = `
      <div class="section-header">
        <div>
          <h1 class="fantasy-title">CÀI ĐẶT & QUẢN LÝ TIẾN TRÌNH</h1>
          <p>Tùy chỉnh thông số chiến đấu, tốc độ chuyển câu, âm thanh và sao lưu tệp dữ liệu lưu game.</p>
        </div>
        <button class="btn btn-ghost" id="set-back">← Trang Chủ</button>
      </div>

      <div class="grid-2">
        <div class="rpg-panel" style="padding:20px;">
          <h3 class="fantasy-title" style="font-size:20px;margin-bottom:8px;">Thông Số Chiến Đấu</h3>

          <div class="setting-row">
            <div class="setting-info"><h4>Thời gian mỗi câu tiêu chuẩn (giây)</h4><p>Áp dụng cho các ải chiến dịch (mặc định 15s).</p></div>
            <input type="number" class="rpg-input" id="s-time" min="8" max="45" value="${s.baseTime}" style="width:86px;">
          </div>

          <div class="setting-row">
            <div class="setting-info"><h4>Số tim tối đa mỗi ải</h4><p>Chọn 3 tim (chuẩn) hoặc 5 tim (dễ thở hơn).</p></div>
            <select class="rpg-select" id="s-hearts">
              <option value="3" ${s.maxHearts === 3 ? "selected" : ""}>3 Tim (Chuẩn)</option>
              <option value="5" ${s.maxHearts === 5 ? "selected" : ""}>5 Tim (Dễ)</option>
            </select>
          </div>

          <div class="setting-row">
            <div class="setting-info"><h4>Hệ số sát thương (%) theo tốc độ</h4><p>0–4s / 5–8s / 9–12s / 13–15s</p></div>
            <div style="display:flex;gap:6px;">
              <input type="number" class="rpg-input" id="s-d1" value="${s.dmgTier1}" style="width:66px;" title="0-4s">
              <input type="number" class="rpg-input" id="s-d2" value="${s.dmgTier2}" style="width:66px;" title="5-8s">
              <input type="number" class="rpg-input" id="s-d3" value="${s.dmgTier3}" style="width:66px;" title="9-12s">
              <input type="number" class="rpg-input" id="s-d4" value="${s.dmgTier4}" style="width:66px;" title="13-15s">
            </div>
          </div>

          <div class="setting-row">
            <div class="setting-info"><h4>Chờ bấm Enter thủ công sau mỗi câu</h4><p>Tắt (mặc định): tự động chuyển nhanh sau 1.5s khi sai.</p></div>
            <label class="switch"><input type="checkbox" id="s-manual" ${s.manualNext ? "checked" : ""}><span class="slider"></span></label>
          </div>

          <div class="setting-row">
            <div class="setting-info"><h4>Mở khóa tự do (Chế độ Ôn thi nhanh)</h4><p>Cho phép truy cập ngay cả 5 chương, 21 ải và Tháp Vô Tận mà không cần chờ vượt từng chương.</p></div>
            <label class="switch"><input type="checkbox" id="s-unlock" ${s.unlockAllMode ? "checked" : ""}><span class="slider"></span></label>
          </div>

          <div class="setting-row">
            <div class="setting-info"><h4>Âm thanh chiến đấu (Web Audio API)</h4><p>Bật/tắt và chỉnh âm lượng hiệu ứng.</p></div>
            <div style="display:flex;align-items:center;gap:10px;">
              <input type="range" id="s-vol" min="0.1" max="1" step="0.05" value="${s.volume}">
              <label class="switch"><input type="checkbox" id="s-sound" ${s.soundEnabled ? "checked" : ""}><span class="slider"></span></label>
            </div>
          </div>

          <div style="margin-top:14px;">
            <button class="btn btn-gold" id="s-save-btn">💾 Lưu Cài Đặt</button>
          </div>
        </div>

        <div class="rpg-panel" style="padding:20px;">
          <h3 class="fantasy-title" style="font-size:20px;margin-bottom:8px;">Lưu Trữ & Sao Lưu Dữ Liệu</h3>
          <p style="font-size:13px;color:var(--text-muted);margin-bottom:14px;">
            Tiến trình game được tự động lưu vào trình duyệt (LocalStorage) ngay cả khi F5 hoặc đóng Chrome/Edge. Bạn nên xuất file Save để sao lưu hoặc chuyển sang máy tính khác.
          </p>

          <div style="display:flex;flex-direction:column;gap:10px;">
            <button class="btn btn-emerald" id="s-export">⬇ Xuất File Lưu Game (.json)</button>
            <label class="btn btn-blue" style="cursor:pointer;">
              ⬆ Nhập File Lưu Game (.json)
              <input type="file" id="s-import" accept=".json" style="display:none;">
            </label>
            <button class="btn btn-ghost" id="s-copy-backup">📋 Sao Chép Chuỗi Sao Lưu Vào Clipboard</button>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.1);margin:6px 0;">
            <button class="btn btn-crimson" id="s-reset">🗑 Đặt Lại Toàn Bộ Tiến Trình (Reset Game)</button>
          </div>

          <div class="rpg-card" style="margin-top:16px;font-size:12.5px;color:var(--text-muted);">
            <strong style="color:var(--gold-bright);">Kiểm toán dữ liệu tích hợp:</strong><br>
            • Tổng câu hỏi nạp thành công: <strong>${SLQuestions.getAll().length} / 230</strong> (Câu 71 – Câu 300)<br>
            • Cơ cấu: 5 Chương • 21 Ải • 5 Boss<br>
            • Chế độ chạy: 100% Offline trên Chrome / Edge
          </div>
        </div>
      </div>
    `;

    document.getElementById("set-back").onclick = () => { SLAudio.playClick(); go("menu"); };
    document.getElementById("s-save-btn").onclick = () => {
      SLStorage.update(stObj => {
        stObj.settings.baseTime = Math.max(8, Math.min(45, Number(document.getElementById("s-time").value) || 15));
        stObj.settings.maxHearts = Number(document.getElementById("s-hearts").value) || 3;
        stObj.settings.dmgTier1 = Number(document.getElementById("s-d1").value) || 200;
        stObj.settings.dmgTier2 = Number(document.getElementById("s-d2").value) || 150;
        stObj.settings.dmgTier3 = Number(document.getElementById("s-d3").value) || 120;
        stObj.settings.dmgTier4 = Number(document.getElementById("s-d4").value) || 100;
        stObj.settings.manualNext = document.getElementById("s-manual").checked;
        stObj.settings.unlockAllMode = document.getElementById("s-unlock").checked;
        stObj.settings.soundEnabled = document.getElementById("s-sound").checked;
        stObj.settings.volume = Number(document.getElementById("s-vol").value) || 0.55;
      });
      SLAudio.playClick();
      toast("Đã lưu toàn bộ cài đặt!", "success");
    };

    document.getElementById("s-export").onclick = () => {
      SLAudio.playClick();
      SLStorage.exportSaveFile();
      toast("Đã xuất file lưu game (.json)!", "success");
    };

    document.getElementById("s-import").onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          SLStorage.importSaveJson(reader.result);
          updateTopNav();
          toast("Nhập dữ liệu lưu game thành công!", "success");
          renderSettings(vp);
        } catch (err) {
          toast("Lỗi nhập file: " + err.message, "danger");
        }
      };
      reader.readAsText(file, "utf-8");
    };

    document.getElementById("s-copy-backup").onclick = () => {
      const txt = JSON.stringify(SLStorage.get());
      if (navigator.clipboard) {
        navigator.clipboard.writeText(txt).then(() => toast("Đã sao chép dữ liệu sao lưu vào Clipboard!", "success"));
      } else {
        toast("Trình duyệt không hỗ trợ Clipboard tự động, hãy dùng nút Xuất File.", "info");
      }
    };

    document.getElementById("s-reset").onclick = () => {
      const modal = document.getElementById("modal-overlay");
      modal.innerHTML = `
        <div class="rpg-panel modal-box compact" style="text-align:center;">
          <h2 class="fantasy-title" style="color:#f87171;font-size:26px;">XÁC NHẬN ĐẶT LẠI GAME?</h2>
          <p style="color:var(--text-soft);margin:10px 0 18px;font-size:14px;">
            Toàn bộ cấp độ, ải đã vượt, Boss đã hạ, thành tích và Sổ Truy Nã sẽ bị xóa về ban đầu. Bạn có chắc chắn không?
          </p>
          <div class="modal-actions">
            <button class="btn btn-crimson" id="cf-reset-yes">🗑 Xác Nhận Xóa Toàn Bộ</button>
            <button class="btn btn-ghost" id="cf-reset-no">Hủy Bỏ</button>
          </div>
        </div>
      `;
      modal.classList.remove("hidden");
      document.getElementById("cf-reset-no").onclick = () => modal.classList.add("hidden");
      document.getElementById("cf-reset-yes").onclick = () => {
        modal.classList.add("hidden");
        SLStorage.resetAll();
        updateTopNav();
        toast("Đã đặt lại toàn bộ tiến trình game!", "info");
        go("menu");
      };
    };
  }

  function formatMinSec(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  function escapeHtml(str) {
    return String(str || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return { init, go, toast, updateTopNav };
})();

window.SLApp = SLApp;
window.addEventListener("DOMContentLoaded", () => SLApp.init());
