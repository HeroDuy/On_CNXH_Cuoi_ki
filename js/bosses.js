/* ============================================================
   BOSS SYSTEM – 5 Chapter Bosses + Scheduled Debuffs
   ============================================================ */

const SLBosses = (() => {
  const DEBUFFS = {
    disorient: {
      id: "disorient",
      name: "Đánh Lạc Hướng",
      desc: "Hoán đổi vị trí các phương án sau khi câu hỏi xuất hiện (bảo toàn đáp án chuẩn)."
    },
    fog: {
      id: "fog",
      name: "Sương Mù Hư Ảo",
      desc: "Che mờ 1 phương án trong 3 giây đầu tiên."
    },
    haste: {
      id: "haste",
      name: "Tăng Tốc Thời Không",
      desc: "Ép thời gian trả lời câu hỏi xuống còn 7 giây."
    }
  };

  const BOSSES = {
    3: {
      chapter: 3,
      id: "boss_ch3",
      name: "Kẻ Canh Giữ Khởi Nguyên",
      title: "Thạch Khôi Vệ Thần • Chương 3",
      questionCount: 8,
      timePerQuestion: 12,
      debuffs: ["fog", "disorient"],
      debuffInterval: 3,
      introQuote: "Chỉ kẻ thấu hiểu quy luật thời kỳ quá độ mới đủ tư cách bước qua cánh cổng này!"
    },
    4: {
      chapter: 4,
      id: "boss_ch4",
      name: "Bạo Chúa Thành Trì",
      title: "Kẻ Độc Tài Hắc Ám • Chương 4",
      questionCount: 10,
      timePerQuestion: 12,
      debuffs: ["disorient", "fog", "haste"],
      debuffInterval: 3,
      introQuote: "Dân chủ và pháp quyền ư? Hãy chứng minh bản lĩnh trước cơn thịnh nộ của ta!"
    },
    5: {
      chapter: 5,
      id: "boss_ch5",
      name: "Chiến Thần Liên Minh",
      title: "Bá Chủ Gai Đen • Chương 5",
      questionCount: 10,
      timePerQuestion: 10,
      debuffs: ["haste", "disorient", "fog"],
      debuffInterval: 2,
      introQuote: "Không có khối liên minh vững chắc, mọi lý luận đều sẽ vỡ vụn dưới lưỡi giáo của ta!"
    },
    6: {
      chapter: 6,
      id: "boss_ch6",
      name: "Long Thần Đa Sắc",
      title: "Hỏa Long Thánh Địa • Chương 6",
      questionCount: 15,
      timePerQuestion: 10,
      debuffs: ["fog", "disorient", "haste"],
      debuffInterval: 2,
      introQuote: "Ngọn lửa đa sắc sẽ thiêu rụi mọi sự mơ hồ về dân tộc và tôn giáo!"
    },
    7: {
      chapter: 7,
      id: "boss_ch7",
      name: "Chúa Tể Định Mệnh",
      title: "Final Boss • Ác Ma Chung Kết • Chương 7",
      questionCount: 15,
      timePerQuestion: 8,
      debuffs: ["haste", "disorient", "fog"],
      debuffInterval: 2,
      introQuote: "Thử thách cuối cùng của hành trình tri thức! Đánh bại ta để ghi danh vào Đại Sảnh Huyền Thoại!"
    }
  };

  function get(chapter) { return BOSSES[Number(chapter)] || null; }
  function getAll() { return [3, 4, 5, 6, 7].map(ch => BOSSES[ch]); }
  function getDebuff(id) { return DEBUFFS[id] || null; }

  /**
   * Determine scheduled debuff for a given 0-based question index in a Boss fight.
   */
  function getScheduledDebuff(boss, qIndex) {
    if (!boss || !boss.debuffs || boss.debuffs.length === 0) return null;
    if (qIndex === 0) return null; // First question clean so player settles in
    if ((qIndex + 1) % boss.debuffInterval !== 0) return null;
    const cycle = Math.floor(qIndex / boss.debuffInterval) % boss.debuffs.length;
    return DEBUFFS[boss.debuffs[cycle]] || null;
  }

  return { DEBUFFS, BOSSES, get, getAll, getDebuff, getScheduledDebuff };
})();
