/* ============================================================
   DARK FANTASY SVG ARTWORK & CANVAS 2D PARTICLE VFX ENGINE
   ============================================================ */

const SLArt = (() => {
  function heroCrestSVG() {
    return `<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="crestG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fde68a"/>
          <stop offset="55%" stop-color="#d4a64a"/>
          <stop offset="100%" stop-color="#7c5617"/>
        </linearGradient>
      </defs>
      <path d="M32 4 L56 14 V33 C56 47 45 56 32 61 C19 56 8 47 8 33 V14 Z" fill="#0f172a" stroke="url(#crestG)" stroke-width="3"/>
      <path d="M32 12 L48 19 V33 C48 43 40 50 32 54 C24 50 16 43 16 33 V19 Z" fill="#172540" opacity="0.9"/>
      <path d="M32 16 L35 28 L46 28 L37 35 L41 47 L32 40 L23 47 L27 35 L18 28 L29 28 Z" fill="url(#crestG)"/>
    </svg>`;
  }

  function heroAvatarSVG() {
    return `<svg viewBox="0 0 120 120" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="hBg" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="#1e3a5f"/>
          <stop offset="100%" stop-color="#090e1a"/>
        </radialGradient>
        <linearGradient id="hGold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="100%" stop-color="#b47b21"/>
        </linearGradient>
      </defs>
      <rect width="120" height="120" fill="url(#hBg)"/>
      <circle cx="60" cy="48" r="34" fill="#38bdf8" opacity="0.12"/>
      <!-- Shoulders / Cloak -->
      <path d="M16 118 C20 86 38 76 60 76 C82 76 100 86 104 118 Z" fill="#1e293b" stroke="url(#hGold)" stroke-width="2.5"/>
      <path d="M40 78 L60 98 L80 78" fill="none" stroke="url(#hGold)" stroke-width="2.5"/>
      <!-- Knight / Scholar Hood & Visor -->
      <path d="M32 56 C32 28 45 18 60 18 C75 18 88 28 88 56 L82 74 C74 80 46 80 38 74 Z" fill="#0f172a" stroke="url(#hGold)" stroke-width="2.5"/>
      <path d="M40 44 L60 36 L80 44 L76 60 L60 66 L44 60 Z" fill="#1e293b" stroke="#94a3b8" stroke-width="1.5"/>
      <!-- Glowing Eyes -->
      <ellipse cx="51" cy="50" rx="5" ry="2.6" fill="#38bdf8"/>
      <ellipse cx="69" cy="50" rx="5" ry="2.6" fill="#38bdf8"/>
      <!-- Crown Rune -->
      <polygon points="60,21 65,31 60,35 55,31" fill="url(#hGold)"/>
    </svg>`;
  }

  function realmEmblemSVG(chapter) {
    const palettes = {
      3: { c1: "#34d399", c2: "#065f46", icon: "M32 10 L46 28 L39 28 L48 44 L32 54 L16 44 L25 28 L18 28 Z" },
      4: { c1: "#60a5fa", c2: "#1e3a8a", icon: "M16 48 V24 L24 30 L32 14 L40 30 L48 24 V48 Z M14 50 H50 V55 H14 Z" },
      5: { c1: "#f87171", c2: "#7f1d1d", icon: "M18 16 L46 44 M46 16 L18 44 M32 12 L40 24 L32 52 L24 24 Z" },
      6: { c1: "#c084fc", c2: "#4c1d95", icon: "M32 10 L52 32 L32 54 L12 32 Z M32 20 L42 32 L32 44 L22 32 Z" },
      7: { c1: "#fbbf24", c2: "#78350f", icon: "M32 14 L50 30 H44 V50 H20 V30 H14 Z M28 50 V38 H36 V50 Z" }
    };
    const p = palettes[chapter] || palettes[3];
    return `<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="29" fill="${p.c2}" stroke="${p.c1}" stroke-width="2.5" opacity="0.9"/>
      <circle cx="32" cy="32" r="23" fill="none" stroke="${p.c1}" stroke-width="1" stroke-dasharray="4 3" opacity="0.65"/>
      <path d="${p.icon}" fill="${p.c1}" stroke="#fef3c7" stroke-width="1.4" stroke-linejoin="round"/>
    </svg>`;
  }

  function monsterSVG(chapter, stage) {
    const themes = {
      3: { body: "#1f3a37", armor: "#34d399", eye: "#fde047", aura: "#10b981" },
      4: { body: "#1d3154", armor: "#60a5fa", eye: "#38bdf8", aura: "#3b82f6" },
      5: { body: "#3d181e", armor: "#f87171", eye: "#fb923c", aura: "#ef4444" },
      6: { body: "#2f1947", armor: "#c084fc", eye: "#f472b6", aura: "#a855f7" },
      7: { body: "#3d2a12", armor: "#fbbf24", eye: "#fde047", aura: "#f59e0b" }
    };
    const t = themes[chapter] || themes[3];
    const variant = ((chapter * 3 + stage) % 4);

    if (variant === 0) {
      // Runic Golem Sentinel
      return `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="176" rx="64" ry="13" fill="#000" opacity="0.5"/>
        <circle cx="100" cy="100" r="76" fill="${t.aura}" opacity="0.12"/>
        <path d="M56 76 L34 114 L48 152 L72 138 L68 96 Z" fill="${t.body}" stroke="${t.armor}" stroke-width="3"/>
        <path d="M144 76 L166 114 L152 152 L128 138 L132 96 Z" fill="${t.body}" stroke="${t.armor}" stroke-width="3"/>
        <polygon points="62,62 138,62 148,140 122,168 78,168 52,140" fill="${t.body}" stroke="${t.armor}" stroke-width="3.5"/>
        <polygon points="74,28 126,28 134,66 66,66" fill="#0f172a" stroke="${t.armor}" stroke-width="3"/>
        <polygon points="84,44 96,49 84,54" fill="${t.eye}"/>
        <polygon points="116,44 104,49 116,54" fill="${t.eye}"/>
        <path d="M100 84 L116 108 L100 132 L84 108 Z" fill="${t.aura}" opacity="0.85" stroke="#fef08a" stroke-width="2"/>
      </svg>`;
    } else if (variant === 1) {
      // Dark Armored Knight
      return `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="178" rx="58" ry="12" fill="#000" opacity="0.5"/>
        <circle cx="100" cy="96" r="74" fill="${t.aura}" opacity="0.13"/>
        <path d="M44 166 L58 84 L100 72 L142 84 L156 166 Z" fill="${t.body}" stroke="${t.armor}" stroke-width="3"/>
        <path d="M40 86 L68 70 L66 102 Z" fill="#0f172a" stroke="${t.armor}" stroke-width="2.5"/>
        <path d="M160 86 L132 70 L134 102 Z" fill="#0f172a" stroke="${t.armor}" stroke-width="2.5"/>
        <!-- Helmet with Horns -->
        <path d="M72 34 L54 14 L68 48 Z M128 34 L146 14 L132 48 Z" fill="${t.armor}"/>
        <path d="M70 36 C70 20 130 20 130 36 L126 76 L100 86 L74 76 Z" fill="#0f172a" stroke="${t.armor}" stroke-width="3"/>
        <rect x="81" y="48" width="14" height="6" rx="2" fill="${t.eye}"/>
        <rect x="105" y="48" width="14" height="6" rx="2" fill="${t.eye}"/>
        <!-- Greatsword -->
        <path d="M158 34 L166 34 L169 124 L155 124 Z" fill="#cbd5e1" stroke="${t.armor}" stroke-width="2"/>
        <rect x="146" y="120" width="32" height="8" rx="3" fill="${t.armor}"/>
      </svg>`;
    } else if (variant === 2) {
      // Arcane Wraith Sorcerer
      return `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="176" rx="54" ry="11" fill="${t.aura}" opacity="0.28"/>
        <path d="M52 164 C56 105 64 68 100 30 C136 68 144 105 148 164 L126 148 L100 166 L74 148 Z" fill="${t.body}" stroke="${t.armor}" stroke-width="3"/>
        <ellipse cx="100" cy="68" rx="22" ry="26" fill="#050811" stroke="${t.armor}" stroke-width="2.5"/>
        <circle cx="91" cy="66" r="4.5" fill="${t.eye}"/>
        <circle cx="109" cy="66" r="4.5" fill="${t.eye}"/>
        <circle cx="100" cy="116" r="16" fill="none" stroke="${t.eye}" stroke-width="2.5"/>
        <circle cx="100" cy="116" r="7" fill="${t.aura}"/>
      </svg>`;
    } else {
      // Obsidian Wyrm / Gargoyle
      return `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="100" cy="178" rx="60" ry="12" fill="#000" opacity="0.5"/>
        <path d="M98 92 L22 44 L36 116 L84 126 Z" fill="${t.body}" stroke="${t.armor}" stroke-width="2.5"/>
        <path d="M102 92 L178 44 L164 116 L116 126 Z" fill="${t.body}" stroke="${t.armor}" stroke-width="2.5"/>
        <path d="M74 68 L100 32 L126 68 L118 156 L100 170 L82 156 Z" fill="#0f172a" stroke="${t.armor}" stroke-width="3"/>
        <polygon points="86,66 96,74 84,76" fill="${t.eye}"/>
        <polygon points="114,66 104,74 116,76" fill="${t.eye}"/>
        <path d="M88 100 L100 124 L112 100" fill="none" stroke="${t.eye}" stroke-width="3"/>
      </svg>`;
    }
  }

  function bossSVG(chapter) {
    if (chapter === 3) {
      // Boss 1: Kẻ Canh Giữ Khởi Nguyên – Colossal Runic Golem
      return `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="214" rx="82" ry="15" fill="#000" opacity="0.55"/>
        <circle cx="120" cy="118" r="96" fill="#10b981" opacity="0.14"/>
        <polygon points="48,74 16,134 40,188 72,162 66,98" fill="#172c2a" stroke="#34d399" stroke-width="3.5"/>
        <polygon points="192,74 224,134 200,188 168,162 174,98" fill="#172c2a" stroke="#34d399" stroke-width="3.5"/>
        <polygon points="62,64 178,64 190,164 150,206 90,206 50,164" fill="#132524" stroke="#6ee7b7" stroke-width="4"/>
        <polygon points="82,22 158,22 168,70 72,70" fill="#091416" stroke="#fbbf24" stroke-width="3.5"/>
        <polygon points="94,42 112,50 92,56" fill="#fde047"/>
        <polygon points="146,42 128,50 148,56" fill="#fde047"/>
        <polygon points="120,86 146,124 120,162 94,124" fill="#10b981" stroke="#fef08a" stroke-width="3"/>
        <circle cx="120" cy="124" r="14" fill="#fef08a"/>
      </svg>`;
    }
    if (chapter === 4) {
      // Boss 2: Bạo Chúa Thành Trì – Crowned Abyssal Tyrant
      return `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="214" rx="80" ry="14" fill="#000" opacity="0.55"/>
        <circle cx="120" cy="115" r="95" fill="#3b82f6" opacity="0.16"/>
        <!-- Royal Cape -->
        <path d="M40 206 L64 78 L176 78 L200 206 L150 190 L120 208 L90 190 Z" fill="#172554" stroke="#60a5fa" stroke-width="3"/>
        <!-- Crown -->
        <path d="M78 44 L86 14 L104 34 L120 8 L136 34 L154 14 L162 44 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="2.5"/>
        <!-- Tyrant Mask -->
        <path d="M78 44 H162 L152 96 L120 112 L88 96 Z" fill="#0b1329" stroke="#93c5fd" stroke-width="3"/>
        <polygon points="94,66 112,74 96,79" fill="#38bdf8"/>
        <polygon points="146,66 128,74 144,79" fill="#38bdf8"/>
        <!-- Scepter & Shield -->
        <line x1="196" y1="26" x2="196" y2="196" stroke="#f59e0b" stroke-width="6"/>
        <circle cx="196" cy="28" r="14" fill="#38bdf8" stroke="#fef08a" stroke-width="3"/>
      </svg>`;
    }
    if (chapter === 5) {
      // Boss 3: Chiến Thần Liên Minh – Spiked Obsidian Warlord
      return `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="120" cy="214" rx="84" ry="15" fill="#000" opacity="0.6"/>
        <circle cx="120" cy="116" r="96" fill="#ef4444" opacity="0.16"/>
        <!-- Spikes -->
        <polygon points="56,74 20,38 74,56" fill="#f87171"/>
        <polygon points="184,74 220,38 166,56" fill="#f87171"/>
        <polygon points="44,118 12,108 54,138" fill="#ef4444"/>
        <polygon points="196,118 228,108 186,138" fill="#ef4444"/>
        <path d="M54 74 L120 56 L186 74 L174 202 L120 186 L66 202 Z" fill="#1f1116" stroke="#ef4444" stroke-width="3.5"/>
        <path d="M84 30 L120 16 L156 30 L150 78 L120 92 L90 78 Z" fill="#09070c" stroke="#f87171" stroke-width="3"/>
        <rect x="94" y="48" width="20" height="7" rx="2" fill="#fb923c"/>
        <rect x="126" y="48" width="20" height="7" rx="2" fill="#fb923c"/>
        <path d="M120 100 L144 134 L120 166 L96 134 Z" fill="#dc2626" stroke="#fde047" stroke-width="2.5"/>
      </svg>`;
    }
    if (chapter === 6) {
      // Boss 4: Long Thần Đa Sắc – Prismatic Flame Dragon
      return `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="prismG" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#c084fc"/>
            <stop offset="50%" stop-color="#38bdf8"/>
            <stop offset="100%" stop-color="#f472b6"/>
          </linearGradient>
        </defs>
        <ellipse cx="120" cy="214" rx="84" ry="14" fill="#a855f7" opacity="0.28"/>
        <!-- Dragon Wings -->
        <path d="M116 112 L16 32 L30 132 L84 148 Z" fill="#2e1065" stroke="url(#prismG)" stroke-width="3"/>
        <path d="M124 112 L224 32 L210 132 L156 148 Z" fill="#2e1065" stroke="url(#prismG)" stroke-width="3"/>
        <!-- Dragon Neck & Head -->
        <path d="M90 196 C88 140 84 96 92 64 L120 26 L148 64 C156 96 152 140 150 196 Z" fill="#1e1b4b" stroke="url(#prismG)" stroke-width="3.5"/>
        <polygon points="94,48 72,18 106,42" fill="#f472b6"/>
        <polygon points="146,48 168,18 134,42" fill="#38bdf8"/>
        <polygon points="100,66 114,74 98,78" fill="#fde047"/>
        <polygon points="140,66 126,74 142,78" fill="#fde047"/>
        <circle cx="120" cy="134" r="20" fill="url(#prismG)" opacity="0.88"/>
      </svg>`;
    }
    // Boss 5: Final Boss – Chúa Tể Định Mệnh
    return `<svg viewBox="0 0 240 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="finalAura" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.5"/>
          <stop offset="60%" stop-color="#dc2626" stop-opacity="0.25"/>
          <stop offset="100%" stop-color="#000" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="120" cy="116" r="108" fill="url(#finalAura)"/>
      <!-- Blazing Horns -->
      <path d="M84 54 C54 32 42 14 54 6 C68 24 84 30 98 40 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/>
      <path d="M156 54 C186 32 198 14 186 6 C172 24 156 30 142 40 Z" fill="#f59e0b" stroke="#fef08a" stroke-width="2"/>
      <!-- Demon Wings -->
      <path d="M110 108 L18 52 L34 152 L92 158 Z" fill="#450a0a" stroke="#f97316" stroke-width="3"/>
      <path d="M130 108 L222 52 L206 152 L148 158 Z" fill="#450a0a" stroke="#f97316" stroke-width="3"/>
      <!-- Body -->
      <path d="M72 78 L120 56 L168 78 L158 206 L120 220 L82 206 Z" fill="#18080c" stroke="#fbbf24" stroke-width="3.5"/>
      <path d="M86 38 L120 24 L154 38 L146 86 L120 98 L94 86 Z" fill="#0d0508" stroke="#ef4444" stroke-width="3"/>
      <polygon points="96,56 114,66 96,70" fill="#fef08a"/>
      <polygon points="144,56 126,66 144,70" fill="#fef08a"/>
      <path d="M120 108 L144 142 L120 176 L96 142 Z" fill="#f97316" stroke="#fef08a" stroke-width="3"/>
    </svg>`;
  }

  function skillSVG(skillId) {
    if (skillId === "double_slash") {
      return `<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" fill="#2a1d0d" stroke="#f5d68a" stroke-width="2"/>
        <path d="M16 48 L48 16 M48 48 L16 16" stroke="#fde047" stroke-width="4.5" stroke-linecap="round"/>
        <path d="M38 14 L50 14 L50 26 M26 14 L14 14 L14 26" fill="none" stroke="#fb923c" stroke-width="3"/>
      </svg>`;
    }
    if (skillId === "time_freeze") {
      return `<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" fill="#0b2239" stroke="#7dd3fc" stroke-width="2"/>
        <path d="M32 12 V52 M12 32 H52 M18 18 L46 46 M46 18 L18 46" stroke="#38bdf8" stroke-width="3" stroke-linecap="round"/>
        <circle cx="32" cy="32" r="7" fill="#e0f2fe"/>
      </svg>`;
    }
    if (skillId === "aegis_shield") {
      return `<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <circle cx="32" cy="32" r="28" fill="#10253f" stroke="#60a5fa" stroke-width="2"/>
        <path d="M32 12 L49 19 V34 C49 44 41 51 32 55 C23 51 15 44 15 34 V19 Z" fill="#1e3a8a" stroke="#93c5fd" stroke-width="3"/>
        <path d="M32 22 V44 M23 32 H41" stroke="#fde68a" stroke-width="3.5" stroke-linecap="round"/>
      </svg>`;
    }
    // vampiric_drain
    return `<svg viewBox="0 0 64 64" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="32" r="28" fill="#2d1018" stroke="#fb7185" stroke-width="2"/>
      <path d="M32 50 C18 40 14 29 18 22 C22 15 29 17 32 23 C35 17 42 15 46 22 C50 29 46 40 32 50 Z" fill="#e11d48" stroke="#fda4af" stroke-width="2.5"/>
      <path d="M32 27 V40 M26 33.5 H38" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
    </svg>`;
  }

  /* Ambient Embers Background Canvas */
  function initAmbientBg() {
    const canvas = document.getElementById("bg-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0;
    const particles = [];

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    for (let i = 0; i < 42; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 2.2 + 0.7,
        vy: -(Math.random() * 0.45 + 0.15),
        vx: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.5 + 0.15,
        hue: Math.random() > 0.35 ? "245, 200, 100" : "56, 189, 248"
      });
    }

    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.hue}, ${p.alpha})`;
        ctx.fill();
      }
      requestAnimationFrame(tick);
    }
    tick();
  }

  /* Combat Canvas 2D VFX Burst Engine */
  let fxParticles = [];
  let fxSlashes = [];
  let fxRunning = false;

  function triggerCombatFX(type) {
    const canvas = document.getElementById("fx-canvas");
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width || 600;
    canvas.height = rect.height || 240;
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;

    const colors = {
      crit: ["#fde047", "#fb923c", "#ffffff"],
      hit: ["#38bdf8", "#f5d68a", "#e2e8f0"],
      wrong: ["#ef4444", "#991b1b", "#fca5a5"],
      freeze: ["#7dd3fc", "#38bdf8", "#e0f2fe"],
      heal: ["#34d399", "#10b981", "#a7f3d0"],
      death: ["#fde047", "#ef4444", "#a855f7", "#ffffff"]
    }[type] || ["#f5d68a", "#ffffff"];

    const count = type === "death" ? 55 : type === "crit" ? 36 : 22;
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = (Math.random() * 5.5 + 1.8) * (type === "crit" || type === "death" ? 1.4 : 1);
      fxParticles.push({
        x: cx + (Math.random() - 0.5) * 40,
        y: cy + (Math.random() - 0.5) * 40,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 1,
        decay: Math.random() * 0.03 + 0.02,
        size: Math.random() * 4.5 + 2,
        color: colors[i % colors.length]
      });
    }

    if (type === "crit" || type === "hit") {
      fxSlashes.push({
        x1: cx - 90, y1: cy + 55,
        x2: cx + 90, y2: cy - 55,
        life: 1,
        color: type === "crit" ? "#fde047" : "#38bdf8",
        width: type === "crit" ? 7 : 4
      });
      if (type === "crit") {
        fxSlashes.push({
          x1: cx - 75, y1: cy - 55,
          x2: cx + 75, y2: cy + 55,
          life: 1,
          color: "#fb923c",
          width: 5
        });
      }
    }

    if (!fxRunning) runFXLoop();
  }

  function runFXLoop() {
    fxRunning = true;
    function step() {
      const canvas = document.getElementById("fx-canvas");
      if (!canvas) { fxParticles = []; fxSlashes = []; fxRunning = false; return; }
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = fxSlashes.length - 1; i >= 0; i--) {
        const s = fxSlashes[i];
        ctx.save();
        ctx.globalAlpha = s.life;
        ctx.strokeStyle = s.color;
        ctx.lineWidth = s.width * s.life;
        ctx.shadowColor = s.color;
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(s.x1, s.y1);
        ctx.lineTo(s.x2, s.y2);
        ctx.stroke();
        ctx.restore();
        s.life -= 0.065;
        if (s.life <= 0) fxSlashes.splice(i, 1);
      }

      for (let i = fxParticles.length - 1; i >= 0; i--) {
        const p = fxParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08;
        p.life -= p.decay;
        if (p.life <= 0) { fxParticles.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (fxParticles.length > 0 || fxSlashes.length > 0) {
        requestAnimationFrame(step);
      } else {
        fxRunning = false;
      }
    }
    requestAnimationFrame(step);
  }

  return {
    heroCrestSVG, heroAvatarSVG, realmEmblemSVG,
    monsterSVG, bossSVG, skillSVG,
    initAmbientBg, triggerCombatFX
  };
})();
