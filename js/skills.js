/* ============================================================
   ROGUELIKE SKILL ENGINE (Max 3 Equipped, 1 Use Per Stage/Boss)
   ============================================================ */

const SLSkills = (() => {
  const CATALOG = {
    double_slash: {
      id: "double_slash",
      name: "Chém Đôi",
      rarity: "Huyền Thoại",
      type: "active",
      hotkey: "Q",
      shortDesc: "Loại bỏ 2 đáp án sai. Gặp câu tổng hợp tự chuyển thành +5 giây thời gian.",
      effectLabel: "Chủ động • 1 lần/ải"
    },
    time_freeze: {
      id: "time_freeze",
      name: "Ngưng Đọng",
      rarity: "Cổ Ngữ Băng",
      type: "active",
      hotkey: "W",
      shortDesc: "Đóng băng đồng hồ đếm ngược trong 10 giây, giữ nguyên mức sát thương hiện tại.",
      effectLabel: "Chủ động • 1 lần/ải"
    },
    aegis_shield: {
      id: "aegis_shield",
      name: "Khiên Hộ Mệnh",
      rarity: "Thánh Giáp",
      type: "passive",
      hotkey: "Tự động",
      shortDesc: "Tự động chặn 1 lần mất tim khi trả lời sai/hết giờ và bảo toàn toàn bộ Combo.",
      effectLabel: "Bị động • 1 lần/ải"
    },
    vampiric_drain: {
      id: "vampiric_drain",
      name: "Hút Máu",
      rarity: "Huyết Ấn",
      type: "passive",
      hotkey: "Tự động",
      shortDesc: "Trả lời đúng 4 câu liên tiếp sẽ tự động hồi lại 1 tim (tối đa 1 lần/ải).",
      effectLabel: "Bị động • 1 lần/ải"
    }
  };

  function get(id) { return CATALOG[id] || null; }
  function getAll() { return Object.values(CATALOG); }

  /**
   * Offer 3 unique skill cards after clearing a stage.
   * Prioritizes unequipped skills so duplicates are avoided.
   */
  function getOfferCards(equippedIds = []) {
    const ownedSet = new Set(equippedIds);
    const unowned = getAll().filter(s => !ownedSet.has(s.id));
    const owned = getAll().filter(s => ownedSet.has(s.id));

    const shuffledUnowned = SLQuestions.shuffle(unowned);
    const shuffledOwned = SLQuestions.shuffle(owned);
    const pool = [...shuffledUnowned, ...shuffledOwned];
    return pool.slice(0, 3).map(card => ({
      ...card,
      alreadyOwned: ownedSet.has(card.id)
    }));
  }

  function equip(skillId, replaceSkillId = null) {
    return SLStorage.update(st => {
      if (!CATALOG[skillId]) return;
      if (st.equippedSkills.includes(skillId)) return;
      if (st.equippedSkills.length < 3) {
        st.equippedSkills.push(skillId);
      } else if (replaceSkillId) {
        const idx = st.equippedSkills.indexOf(replaceSkillId);
        if (idx !== -1) st.equippedSkills[idx] = skillId;
        else st.equippedSkills[2] = skillId;
      } else {
        st.equippedSkills.shift();
        st.equippedSkills.push(skillId);
      }
    });
  }

  function unequip(skillId) {
    return SLStorage.update(st => {
      st.equippedSkills = st.equippedSkills.filter(id => id !== skillId);
    });
  }

  return { CATALOG, get, getAll, getOfferCards, equip, unequip };
})();
