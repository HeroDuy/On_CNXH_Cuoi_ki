/* ============================================================
   QUESTION ENGINE – 230 Verified Questions, Smart Shuffling & Decks
   - Shuffles question order EVERY run (Run 1 != Run 2)
   - Shuffles A/B/C/D options EVERY question while keeping composite
     options ("Tất cả các đáp án trên...") logically at D!
   - Pads short stages (4–6q) to 7–8q using weak/slow/global pool
   ============================================================ */

const SLQuestions = (() => {
  const LETTERS = ["A", "B", "C", "D"];

  const CHAPTERS = [
    {
      chapter: 3,
      realmName: "Vùng Đất Khởi Nguyên",
      themeClass: "realm-ch3",
      arenaClass: "arena-bg-ch3",
      subtitle: "Chủ nghĩa xã hội & Thời kỳ quá độ lên CNXH",
      titleReward: "Người Khai Mở Khởi Nguyên",
      monsterNames: [
        "Thạch Nhân Khởi Nguyên",
        "Vệ Binh Quá Độ",
        "Kỵ Sĩ Ánh Bình Minh"
      ]
    },
    {
      chapter: 4,
      realmName: "Thành Trì Dân Chủ",
      themeClass: "realm-ch4",
      arenaClass: "arena-bg-ch4",
      subtitle: "Dân chủ XHCN & Nhà nước pháp quyền XHCN",
      titleReward: "Hộ Vệ Thành Trì Dân Chủ",
      monsterNames: [
        "Lính Canh Hy Lạp Cổ",
        "Hiệp Sĩ Dân Quyền",
        "Pháp Sư Công Lý",
        "Thống Lĩnh Hiến Pháp"
      ]
    },
    {
      chapter: 5,
      realmName: "Đế Chế Liên Minh",
      themeClass: "realm-ch5",
      arenaClass: "arena-bg-ch5",
      subtitle: "Cơ cấu xã hội – giai cấp & Liên minh giai cấp, tầng lớp",
      titleReward: "Thống Soái Đế Chế Liên Minh",
      monsterNames: [
        "Chiến Binh Thép Đen",
        "Đội Trưởng Liên Quân",
        "Kẻ Canh Lò Rèn",
        "Tướng Quân Hắc Thiết"
      ]
    },
    {
      chapter: 6,
      realmName: "Thánh Địa Đa Sắc",
      themeClass: "realm-ch6",
      arenaClass: "arena-bg-ch6",
      subtitle: "Vấn đề Dân tộc & Tôn giáo trong thời kỳ quá độ",
      titleReward: "Hiền Triết Thánh Địa Đa Sắc",
      monsterNames: [
        "Linh Hồn Cổ Tộc",
        "Sứ Giả Cương Lĩnh",
        "Hộ Pháp Sơn Cước",
        "Ảo Ảnh Tín Ngưỡng",
        "Kẻ Gác Đền Cổ",
        "Phán Quan Chân Lý"
      ]
    },
    {
      chapter: 7,
      realmName: "Vương Quốc Gia Đình",
      themeClass: "realm-ch7",
      arenaClass: "arena-bg-ch7",
      subtitle: "Vấn đề Gia đình trong thời kỳ quá độ lên CNXH",
      titleReward: "Huyền Thoại Tri Thức",
      monsterNames: [
        "Hộ Thần Tổ Ấm",
        "Vệ Sĩ Truyền Thống",
        "Kỵ Sĩ Hôn Nhân",
        "Thủ Lĩnh Thời Đại Mới"
      ]
    }
  ];

  function getAll() {
    return (window.SL_DATA && window.SL_DATA.questions) ? window.SL_DATA.questions : [];
  }

  function getGroups() {
    return (window.SL_DATA && window.SL_DATA.groups) ? window.SL_DATA.groups : [];
  }

  function getChapterMeta(chapter) {
    return CHAPTERS.find(c => c.chapter === Number(chapter)) || CHAPTERS[0];
  }

  function getStageMeta(chapter, stage) {
    return getGroups().find(g => g.chapter === Number(chapter) && g.stage === Number(stage));
  }

  function getById(id) {
    return getAll().find(q => q.id === Number(id));
  }

  function getByChapter(chapter) {
    return getAll().filter(q => q.chapter === Number(chapter));
  }

  function getByStage(chapter, stage) {
    return getAll().filter(q => q.chapter === Number(chapter) && q.stage === Number(stage));
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  function isCompositeText(text) {
    const s = (text || "").toLowerCase();
    return (
      s.includes("tất cả các đáp án") ||
      s.includes("bao gồm tất cả") ||
      s.includes("cả 3 đáp án") ||
      s.includes("cả ba đáp án") ||
      s.includes("đáp án trên đều")
    );
  }

  function isCompositeQuestion(q) {
    return LETTERS.some(l => isCompositeText(q.answers[l]));
  }

  /**
   * Prepare a question with freshly shuffled A/B/C/D options.
   * Preserves exact original text and tracks the exact correct answer key!
   * For composite questions, shuffles the 3 content choices into A/B/C
   * and anchors the composite option cleanly at D.
   */
  function prepareQuestion(q, opts = {}) {
    const composite = isCompositeQuestion(q);
    const items = LETTERS.map(origKey => ({
      origKey,
      text: q.answers[origKey],
      isCorrect: origKey === q.correctAnswer,
      isComp: isCompositeText(q.answers[origKey])
    }));

    let ordered;
    if (opts.noShuffleAnswers) {
      ordered = items;
    } else if (composite) {
      const normals = shuffle(items.filter(it => !it.isComp));
      const comps = items.filter(it => it.isComp);
      ordered = [...normals, ...comps];
    } else {
      ordered = shuffle(items);
    }

    const displayAnswers = {};
    let correctKey = "A";
    ordered.forEach((item, idx) => {
      const letter = LETTERS[idx];
      displayAnswers[letter] = item.text;
      if (item.isCorrect) correctKey = letter;
    });

    return {
      ...q,
      displayAnswers,
      correctKey,
      isComposite: composite,
      isReinforcement: !!opts.isReinforcement
    };
  }

  /**
   * Re-shuffle options mid-question (used by Boss Debuff "Đánh Lạc Hướng").
   * Never breaks composite questions!
   */
  function reshufflePreparedQuestion(pq) {
    if (pq.isComposite) {
      // Only shuffle A, B, C; keep D composite intact
      const normalKeys = ["A", "B", "C"];
      const entries = normalKeys.map(k => ({
        text: pq.displayAnswers[k],
        isCorrect: k === pq.correctKey
      }));
      const mixed = shuffle(entries);
      const nextDisplay = { D: pq.displayAnswers.D };
      let nextCorrect = pq.correctKey === "D" ? "D" : "A";
      mixed.forEach((e, i) => {
        const k = normalKeys[i];
        nextDisplay[k] = e.text;
        if (e.isCorrect) nextCorrect = k;
      });
      return { ...pq, displayAnswers: nextDisplay, correctKey: nextCorrect };
    }
    const entries = LETTERS.map(k => ({
      text: pq.displayAnswers[k],
      isCorrect: k === pq.correctKey
    }));
    const mixed = shuffle(entries);
    const nextDisplay = {};
    let nextCorrect = "A";
    mixed.forEach((e, i) => {
      const k = LETTERS[i];
      nextDisplay[k] = e.text;
      if (e.isCorrect) nextCorrect = k;
    });
    return { ...pq, displayAnswers: nextDisplay, correctKey: nextCorrect };
  }

  /**
   * Build Stage Deck:
   * - Includes 100% of core stage questions in shuffled order
   * - If stage has < 7 questions, pads to 7-8 questions using missed/slow/global questions
   */
  function buildStageDeck(chapter, stage) {
    const core = getByStage(chapter, stage);
    const coreIds = new Set(core.map(q => q.id));
    const deck = core.map(q => prepareQuestion(q, { isReinforcement: false }));

    const minTarget = core.length <= 4 ? 7 : (core.length <= 6 ? 8 : core.length);
    const need = Math.max(0, minTarget - core.length);

    if (need > 0) {
      const st = SLStorage.get();
      const all = getAll().filter(q => !coreIds.has(q.id));
      // Priority 1: active bounties or previously missed/slow questions across any chapter
      const scored = all.map(q => {
        const b = st.bounty[q.id];
        const qs = st.questionStats[q.id];
        let priority = Math.random() * 2;
        if (b && b.status === "active") priority += 20;
        else if (b && b.wrongCount > 0) priority += 10 + b.wrongCount * 2;
        if (qs && qs.attempts > 0 && (qs.totalTime / qs.attempts) > 9) priority += 6;
        if (q.chapter === Number(chapter)) priority += 3;
        return { q, priority };
      }).sort((a, b) => b.priority - a.priority);

      const extras = scored.slice(0, need).map(x => prepareQuestion(x.q, { isReinforcement: true }));
      deck.push(...extras);
    }

    return shuffle(deck);
  }

  /**
   * Build Boss Deck from chapter pool (prioritizing weak/slow questions in that chapter)
   */
  function buildBossDeck(chapter, count) {
    const st = SLStorage.get();
    const pool = getByChapter(chapter);
    const scored = pool.map(q => {
      const b = st.bounty[q.id];
      const qs = st.questionStats[q.id];
      let weight = Math.random() * 6;
      if (b && b.wrongCount > 0) weight += 12 + b.wrongCount * 2;
      if (qs && qs.attempts > 0 && (qs.totalTime / qs.attempts) > 8.5) weight += 5;
      return { q, weight };
    }).sort((a, b) => b.weight - a.weight);

    const chosen = scored.slice(0, Math.min(count, pool.length)).map(x => prepareQuestion(x.q));
    return shuffle(chosen);
  }

  /**
   * Build Smart Review Deck (most missed + slowest across all 230 questions)
   */
  function buildSmartReviewDeck(limit = 20) {
    const st = SLStorage.get();
    const all = getAll();
    const scored = all.map(q => {
      const b = st.bounty[q.id];
      const qs = st.questionStats[q.id];
      let score = Math.random();
      if (b && b.status === "active") score += 40 + b.wrongCount * 8;
      else if (b && b.wrongCount > 0) score += 20 + b.wrongCount * 5;
      if (qs && qs.attempts > 0) {
        const avg = qs.totalTime / qs.attempts;
        if (avg > 9) score += 12;
        else if (avg > 6) score += 5;
      } else {
        score += 3; // unseen questions
      }
      return { q, score };
    }).sort((a, b) => b.score - a.score);

    return shuffle(scored.slice(0, Math.min(limit, all.length)).map(x => prepareQuestion(x.q)));
  }

  function buildExamDeck(count) {
    const pool = shuffle(getAll());
    return pool.slice(0, Math.min(count, pool.length)).map(q => prepareQuestion(q));
  }

  return {
    CHAPTERS,
    getAll, getGroups, getChapterMeta, getStageMeta,
    getById, getByChapter, getByStage,
    shuffle, isCompositeQuestion,
    prepareQuestion, reshufflePreparedQuestion,
    buildStageDeck, buildBossDeck, buildSmartReviewDeck, buildExamDeck
  };
})();
