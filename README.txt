====================================================================
SOCIALISM LEGENDS – THE KNOWLEDGE AWAKENING (BẢN HOÀN CHỈNH v1.0)
Action RPG • Roguelike • Quiz Battle • 100% Offline trên Windows
====================================================================

1. HƯỚNG DẪN CHẠY GAME (KHÔNG CẦN CÀI SERVER HAY PHẦN MỀM)
   Bước 1: Giải nén toàn bộ tệp SOCIALISM-LEGENDS-v1.zip thành một thư mục.
   Bước 2: Mở thư mục SOCIALISM-LEGENDS vừa giải nén.
   Bước 3: Nhấp đúp vào tệp index.html để mở bằng Chrome hoặc Microsoft Edge.
   (Lưu ý: Giữ nguyên cấu trúc các thư mục css/, js/, data/ nằm cùng cấp với index.html).

2. CẤU TRÚC MÃ NGUỒN ĐÃ ĐÓNG GÓI
   SOCIALISM-LEGENDS/
   ├── index.html             (Điểm khởi chạy chính của game)
   ├── css/
   │   ├── main.css           (Giao diện tổng thể, font tiếng Việt chuẩn)
   │   ├── map.css            (Bản đồ 5 vùng đất & đường dẫn 21 ải)
   │   ├── combat.css         (Đấu trường chiến đấu, Boss, Thẻ kỹ năng)
   │   └── animations.css     (Hiệu ứng chuyển động, rung màn hình, popup)
   ├── js/
   │   ├── storage.js         (Lưu LocalStorage, xuất/nhập file save .json)
   │   ├── audio.js           (Âm thanh Web Audio API không cần file MP3)
   │   ├── art.js             (Đồ họa SVG 5 vùng đất, 21 quái, 5 Boss & Canvas VFX)
   │   ├── questions.js       (Bộ quản lý 230 câu, đảo câu hỏi & đảo đáp án thông minh)
   │   ├── skills.js          (4 thẻ kỹ năng Roguelike: Chém Đôi, Ngưng Đọng, Khiên, Hút Máu)
   │   ├── bosses.js          (5 trận Boss cuối chương & hệ thống Debuff)
   │   ├── progression.js     (EXP, Cấp độ, Xếp hạng SS–C, Sổ Truy Nã 2 lần liên tiếp)
   │   ├── combat.js          (Động cơ chiến đấu cho Chiến dịch, Boss, Truy Nã, Boss Rush, Tháp Vô Tận)
   │   └── game.js            (Điều hướng toàn bộ màn hình, Luyện tập, Thi thử, Sổ Tay, Cài đặt)
   ├── data/
   │   ├── questions.json     (Dữ liệu chuẩn 230 câu gốc Câu 71 – Câu 300)
   │   └── questions_data.js  (Bản bọc JS để chạy trực tiếp qua file:// không lỗi CORS)
   └── assets/                (Thư mục mở sẵn nếu muốn bổ sung ảnh/âm thanh riêng)

3. PHÍM TẮT KHI CHIẾN ĐẤU
   - Phím 1, 2, 3, 4 hoặc A, B, C, D: Chọn nhanh đáp án.
   - Phím Q: Kích hoạt kỹ năng Chém Đôi (tự thành +5s khi gặp câu tổng hợp).
   - Phím W: Kích hoạt kỹ năng Ngưng Đọng (đóng băng đồng hồ 10 giây).
   - Phím ESC: Tạm dừng trận đấu.
   - Phím Enter: Chuyển câu nhanh (khi bật chế độ chờ Enter hoặc trong Luyện Tập).

4. MẸO ÔN THI NHANH
   - Vào mục "Cài Đặt" -> bật công tắc "Mở khóa tự do (Chế độ Ôn thi nhanh)" nếu muốn
     vào thẳng bất kỳ chương nào (ví dụ Chương 6, Chương 7) hoặc chơi ngay Tháp Vô Tận.
