/* ============================================================
   PROGRESSION, RANKING, BOUNTY BOARD & ACHIEVEMENTS ENGINE
   ============================================================ */

const SLProgression = (() => {
  const ACHIEVEMENTS = [
    { id: "first_victory", name: "Chiến Công Đầu Tiên", desc: "Hoàn thành ải chiến dịch đầu tiên.", icon: "⚔️" },
    { id: "combo_5", name: "Bùng Nổ Fever", desc: "Đạt chuỗi Combo 5 kích hoạt Fever Mode.", icon: "🔥" },
    { id: "combo_10", name: "Bất Khả Chiến Bại", desc: "Đạt chuỗi Combo 10 liên tiếp.", icon: "⚡" },
    { id: "rank_ss", name: "Hoàn Mỹ Tuyệt Đối", desc: "Đạt xếp hạng SS trong một ải chiến dịch.", icon: "👑" },
    { id: "bounty_hunter", name: "Thợ Săn Tiền Thưởng", desc: "Tiêu diệt thành công một câu hỏi trong Sổ Truy Nã (đúng 2 lần liên tiếp).", icon: "🎯" },
    { id: "boss_slayer_1", name: "Kẻ Hạ Gục Vệ Thần", desc: "Đánh bại Boss đầu tiên của chiến dịch.", icon: "🐉" },
    { id: "campaign_clear", name: "Huyền Thoại Tri Thức", desc: "Đánh bại Final Boss Chúa Tể Định Mệnh và phá đảo chiến dịch.", icon: "🏆" },
    { id: "scholar_100", name: "Học Giả Chăm Chỉ", desc: "Trả lời đúng tích lũy 100 lượt câu hỏi.", icon: "📜" },
    { id: "exam_pass", name: "Vượt Vũ Môn", desc: "Hoàn thành một bài Thi Thử đạt từ 8.0 điểm trở lên.", icon: "🎓" },
    { id: "tower_10", name: "Chinh Phục Tháp Cổ", desc: "Vượt qua tầng 10 trong chế độ Tháp Vô Tận.", icon: "🗼" }
  ];

  function expForNextLevel(level) {
    return 150 + (level - 1) * 90;
  }

  function addExp(amount) {
    let leveledUp = false;
    let newLevel = 1;
    SLStorage.update(st => {
      st.exp += Math.max(0, Math.round(amount));
      while (st.exp >= expForNextLevel(st.level)) {
        st.exp -= expForNextLevel(st.level);
        st.level += 1;
        leveledUp = true;
      }
      newLevel = st.level;
    });
    return { leveledUp, newLevel };
  }

  function unlockAchievement(id) {
    const st = SLStorage.get();
    if (st.achievements.includes(id)) return false;
    const def = ACHIEVEMENTS.find(a => a.id === id);
    if (!def) return false;
    SLStorage.update(s => {
      if (!s.achievements.includes(id)) s.achievements.push(id);
    });
    if (window.SLApp && window.SLApp.toast) {
      window.SLApp.toast(`Thành tích mới: ${def.icon} ${def.name}`, "success");
    }
    return true;
  }

  /**
   * Transparent Rank Formula (Max 105 pts -> SS/S/A/B/C)
   */
  function calculateRank({ correctCount, totalAnswered, heartsLeft, maxHearts, maxCombo, avgTime, wrongCount }) {
    const acc = totalAnswered > 0 ? (correctCount / totalAnswered) : 0;
    const accPts = Math.round(acc * 45);
    const heartPts = Math.round((heartsLeft / Math.max(1, maxHearts)) * 30);
    const comboPts = Math.min(15, Math.round(maxCombo * 2.5));
    const speedPts = avgTime <= 4.5 ? 15 : avgTime <= 7 ? 12 : avgTime <= 10 ? 9 : avgTime <= 13 ? 6 : 3;
    const penalty = wrongCount * 4;
    const score = Math.max(0, Math.min(105, accPts + heartPts + comboPts + speedPts - penalty));

    let rank = "C";
    if (score >= 95 && wrongCount === 0) rank = "SS";
    else if (score >= 82) rank = "S";
    else if (score >= 68) rank = "A";
    else if (score >= 52) rank = "B";

    return {
      rank,
      score,
      accuracyPct: Math.round(acc * 100),
      breakdown: `Chính xác ${accPts} + Tim ${heartPts} + Combo ${comboPts} + Tốc độ ${speedPts} - Sai ${penalty}`
    };
  }

  /**
   * Record every answered question into Stats & Bounty Board.
   * Rule: Wrong answer creates/reactivates Bounty record (never deleted).
   * To clear a Bounty target, player must answer it right 2 CONSECUTIVE times!
   */
  function recordAnswer(q, isCorrect, chosenText, elapsedSec, isBountyHunt = false) {
    let bountyJustCleared = false;
    SLStorage.update(st => {
      st.totalAnswered += 1;
      if (isCorrect) st.totalCorrect += 1;

      if (!st.questionStats[q.id]) {
        st.questionStats[q.id] = { attempts: 0, correct: 0, wrong: 0, totalTime: 0 };
      }
      const qs = st.questionStats[q.id];
      qs.attempts += 1;
      qs.totalTime += Math.max(0.2, Number(elapsedSec) || 0);
      if (isCorrect) qs.correct += 1;
      else qs.wrong += 1;

      if (!isCorrect) {
        const existing = st.bounty[q.id];
        st.bounty[q.id] = {
          id: q.id,
          chapter: q.chapter,
          stage: q.stage,
          wrongCount: existing ? existing.wrongCount + 1 : 1,
          lastWrongText: chosenText || "(Hết thời gian)",
          consecutiveCorrect: 0,
          status: "active",
          updatedAt: Date.now()
        };
      } else if (st.bounty[q.id] && st.bounty[q.id].status === "active") {
        // Count consecutive clears during Bounty Hunt (or when re-encountered)
        st.bounty[q.id].consecutiveCorrect += 1;
        st.bounty[q.id].updatedAt = Date.now();
        if (st.bounty[q.id].consecutiveCorrect >= 2) {
          st.bounty[q.id].status = "cleared";
          bountyJustCleared = true;
        }
      }
    });

    if (bountyJustCleared) {
      unlockAchievement("bounty_hunter");
    }
    const st = SLStorage.get();
    if (st.totalCorrect >= 100) unlockAchievement("scholar_100");
    return { bountyJustCleared };
  }

  function getAllBounties() {
    const st = SLStorage.get();
    return Object.values(st.bounty).sort((a, b) => b.updatedAt - a.updatedAt);
  }

  function getActiveBounties(chapter = null) {
    return getAllBounties().filter(b =>
      b.status === "active" && (chapter === null || Number(b.chapter) === Number(chapter))
    );
  }

  function isChapterUnlocked(chapter) {
    const st = SLStorage.get();
    if (st.settings.unlockAllMode) return true;
    return st.unlockedChapters.includes(Number(chapter));
  }

  function isStageUnlocked(chapter, stage) {
    const st = SLStorage.get();
    if (st.settings.unlockAllMode) return true;
    if (!isChapterUnlocked(chapter)) return false;
    if (Number(stage) === 1) return true;
    const prevKey = `${chapter}-${Number(stage) - 1}`;
    return !!st.clearedStages[prevKey];
  }

  function isBossUnlocked(chapter) {
    const st = SLStorage.get();
    const groups = SLQuestions.getGroups().filter(g => g.chapter === Number(chapter));
    const allStagesCleared = st.settings.unlockAllMode || groups.every(g => !!st.clearedStages[`${chapter}-${g.stage}`]);
    const activeBounties = getActiveBounties(chapter);
    return {
      allStagesCleared,
      activeBountyCount: activeBounties.length,
      canFight: allStagesCleared && activeBounties.length === 0
    };
  }

  function recordStageClear(chapter, stage, rankResult, maxCombo) {
    const key = `${chapter}-${stage}`;
    const rankOrder = { C: 1, B: 2, A: 3, S: 4, SS: 5 };
    const expGain = 80 + rankResult.score + maxCombo * 6;

    SLStorage.update(st => {
      const prev = st.clearedStages[key];
      const keepPrevRank = prev && (rankOrder[prev.rank] || 0) > (rankOrder[rankResult.rank] || 0);
      st.clearedStages[key] = {
        rank: keepPrevRank ? prev.rank : rankResult.rank,
        score: Math.max(prev ? prev.score : 0, rankResult.score),
        accuracy: Math.max(prev ? prev.accuracy : 0, rankResult.accuracyPct),
        bestCombo: Math.max(prev ? prev.bestCombo : 0, maxCombo),
        attempts: (prev ? prev.attempts : 0) + 1
      };
      if (maxCombo > st.bestComboEver) st.bestComboEver = maxCombo;
    });

    const lvlRes = addExp(expGain);
    unlockAchievement("first_victory");
    if (rankResult.rank === "SS") unlockAchievement("rank_ss");
    if (maxCombo >= 5) unlockAchievement("combo_5");
    if (maxCombo >= 10) unlockAchievement("combo_10");

    return { expGain, ...lvlRes };
  }

  function recordBossClear(chapter, rankResult, maxCombo) {
    const expGain = 220 + rankResult.score * 2;
    const chMeta = SLQuestions.getChapterMeta(chapter);

    SLStorage.update(st => {
      if (!st.clearedBosses.includes(Number(chapter))) {
        st.clearedBosses.push(Number(chapter));
      }
      const nextCh = Number(chapter) + 1;
      if (nextCh <= 7 && !st.unlockedChapters.includes(nextCh)) {
        st.unlockedChapters.push(nextCh);
      }
      if (chMeta && chMeta.titleReward && !st.titles.includes(chMeta.titleReward)) {
        st.titles.push(chMeta.titleReward);
      }
      if (maxCombo > st.bestComboEver) st.bestComboEver = maxCombo;
    });

    const lvlRes = addExp(expGain);
    unlockAchievement("boss_slayer_1");
    if (Number(chapter) === 7) unlockAchievement("campaign_clear");
    if (rankResult.rank === "SS") unlockAchievement("rank_ss");

    return { expGain, titleUnlocked: chMeta ? chMeta.titleReward : null, ...lvlRes };
  }

  function isEndlessUnlocked() {
    const st = SLStorage.get();
    return st.settings.unlockAllMode || st.clearedBosses.includes(7);
  }

  function getMasterySummary() {
    const st = SLStorage.get();
    const all = SLQuestions.getAll();
    let seen = 0, mastered = 0, totalTime = 0, totalAtt = 0;
    for (const q of all) {
      const qs = st.questionStats[q.id];
      if (qs && qs.attempts > 0) {
        seen++;
        totalTime += qs.totalTime;
        totalAtt += qs.attempts;
        if (qs.correct >= 1 && (!st.bounty[q.id] || st.bounty[q.id].status === "cleared")) {
          mastered++;
        }
      }
    }
    return {
      totalQuestions: all.length,
      seen,
      mastered,
      avgSpeed: totalAtt > 0 ? (totalTime / totalAtt).toFixed(1) : "0.0",
      accuracy: st.totalAnswered > 0 ? Math.round((st.totalCorrect / st.totalAnswered) * 100) : 0,
      clearedStagesCount: Object.keys(st.clearedStages).length,
      clearedBossesCount: st.clearedBosses.length,
      activeBountyCount: getActiveBounties().length
    };
  }

  return {
    ACHIEVEMENTS,
    expForNextLevel, addExp, unlockAchievement,
    calculateRank, recordAnswer,
    getAllBounties, getActiveBounties,
    isChapterUnlocked, isStageUnlocked, isBossUnlocked, isEndlessUnlocked,
    recordStageClear, recordBossClear, getMasterySummary
  };
})();
