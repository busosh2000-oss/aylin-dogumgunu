/*
  Sneaky Kiss Aylo — sinema salonu versiyonu. Aylin ve Berkay karanlık
  salonda öpüşürken, yan koltuklardaki izleyiciler zaman zaman filmden
  gözlerini ayırıp bakıyor. Bakarken basılı tutup eğilerek gizlenmen,
  güvenliyken bırakıp öpüşmeye devam etmen gerekiyor. Sadece
  oyun/sneaky-kiss-aylo/index.html sayfasında çalışır.
*/

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("kiss-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("kiss-overlay");
  const scoreEl = document.getElementById("kiss-score");
  const bestEl = document.getElementById("kiss-best");

  // 380x180 mantıksal ızgara üzerinde çiziyoruz, canvas daha fazla gerçek
  // piksel taşıyor ki büyütülünce net kalsın
  const W = 380;
  const H = 180;
  const RENDER_SCALE = canvas.width / W || 2;
  ctx.scale(RENDER_SCALE, RENDER_SCALE);

  const FLOOR_Y = 150;
  const SCREEN = { x: W / 2 - 72, y: 10, w: 144, h: 46 };

  const COLORS = {
    wall1: "#170a12",
    wall2: "#2c0f1e",
    curtain: "#5c0f27",
    curtainDark: "#38071a",
    curtainLight: "#8c2140",
    screenGlow: "#eef4ff",
    screenGlowSoft: "#a9c6f2",
    carpet: "#190a12",
    carpetPattern: "#2c1220",
    floorLine: "#7a2542",
    seatRed: "#7a1130",
    seatRedLight: "#ab2a4d",
    seatDark: "#360c1b",
    frame: "#1b1013",
    skin: "#f7cda6",
    blush: "#ff9fb8",
    brow: "#3a2415",
    eye: "#241426",
    mouth: "#c2467a",
    mouthDeep: "#8f2f56",
    pants: "#241026",
    heart: "#ff6f9c",
    heart2: "#ff9fc0",
    alertBubble: "#ffd166",
  };

  // aylin: mor saç, uzun / berkay: sarı saç, kısa — ortada öpüşen çift
  const AYLIN = { hair: "#c77dff", hairStyle: "long", shirt: "#e0aaff", girl: true };
  const BERKAY = { hair: "#f2d675", hairStyle: "short", shirt: "#5b8ee0", girl: false };

  const BYSTANDER_DEFS = [
    { x: 26, hair: "#ffb347", hairStyle: "ponytail", shirt: "#ffcf8f", girl: true }, // turuncu saçlı kız
    { x: 70, hair: "#ff8fc7", hairStyle: "curly", shirt: "#8fe3c7", girl: true }, // pembe kıvırcık
    { x: W - 70 - 18, hair: "#6b4a2f", hairStyle: "short", shirt: "#7f95c9", girl: false }, // kahverengi düz
    { x: W - 26 - 18, hair: "#7a4a2a", hairStyle: "curly", shirt: "#e39a6b", girl: false }, // kahverengi kıvırcık
  ];

  const SEAT_MAIN = { x: 150, w: 100 };
  const SEAT_W = 20;

  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem("kiss-game-best-score"), 10) || 0;
  } catch (e) {
    bestScore = 0;
  }
  bestEl.textContent = `EN İYİ: ${bestScore}`;

  let state = "ready"; // "ready" | "running" | "over"
  let bystanders, timeAlive, exposedTime, score, hiding, heartTimer, hearts, rafId, lastTime;

  // Bir koltuktakinin tamamen dönmesi ~50 kare (≈0.85s) sürer — bu, oyuncuya
  // gerçek bir tepki verme payı bırakır ("çok hızlı bakma" hatasının düzeltmesi).
  const TURN_STEP = 1 / 50;

  function shade(hex, amt) {
    // hex rengi biraz koyulaştırıp/açarak saç hattı gibi ince bir kontur rengi üretir
    const c = hex.replace("#", "");
    const num = parseInt(c.length === 3 ? c.split("").map((ch) => ch + ch).join("") : c, 16);
    let r = (num >> 16) + amt;
    let g = ((num >> 8) & 0xff) + amt;
    let b = (num & 0xff) + amt;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `rgb(${r},${g},${b})`;
  }

  function roundedRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fill();
  }

  function difficultyOf(t) {
    return Math.min(t / 2700, 1); // ~45s hayatta kalmayla zorluk tavan yapar
  }

  function activeThreatCount() {
    return bystanders.reduce((n, b) => n + (b.state === "alert" ? 1 : 0), 0);
  }

  function scheduleBystander(b) {
    const d = difficultyOf(timeAlive);
    if (b.state === "alert") {
      b.state = "away";
      b.timer = 150 - d * 60 + Math.random() * 60; // güvenli pencere ~1.5-3.5s
    } else {
      // aynı anda bakabilecek kişi sayısını sınırla ki tüm koltuklar birden
      // dönüp oyunu oynanmaz hale getirmesin
      const maxThreats = d < 0.5 ? 1 : 2;
      if (activeThreatCount() >= maxThreats) {
        b.timer = 14 + Math.random() * 16; // biraz sonra tekrar dene
        return;
      }
      b.state = "alert";
      b.timer = 50 + d * 20 + Math.random() * 20; // bakma süresi
    }
  }

  function resetGame() {
    timeAlive = 0;
    exposedTime = 0;
    score = 0;
    hiding = false;
    heartTimer = 0;
    hearts = [];
    bystanders = BYSTANDER_DEFS.map((def) => ({
      ...def,
      state: "away",
      visualTurn: 0,
      timer: 130 + Math.random() * 240, // yumuşak başlangıç
    }));
  }

  function startGame() {
    resetGame();
    state = "running";
    overlay.classList.add("hidden");
    lastTime = performance.now ? performance.now() : Date.now();
    if (rafId) cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(loop);
  }

  function endGame() {
    state = "over";
    if (score > bestScore) {
      bestScore = score;
      try {
        localStorage.setItem("kiss-game-best-score", String(bestScore));
      } catch (e) {
        /* localStorage yoksa sorun değil */
      }
    }
    bestEl.textContent = `EN İYİ: ${bestScore}`;
    overlay.innerHTML = `
      <h3>YAKALANDINIZ! 🍿</h3>
      <p>Skor: ${score}${score >= bestScore && score > 0 ? " — Yeni rekor! 🎉" : ""}</p>
      <button id="kiss-restart-btn" class="pixel-btn">TEKRAR OYNA ▶</button>
    `;
    overlay.classList.remove("hidden");
    document.getElementById("kiss-restart-btn").addEventListener("click", startGame);
  }

  function setHiding(value) {
    if (state === "running") hiding = value;
  }

  function handleStart() {
    if (state === "ready" || state === "over") startGame();
  }

  /* ---------- sahne ---------- */

  function drawCurtain(x, dir) {
    const w = 46;
    const grad = ctx.createLinearGradient(x, 0, x + w * dir, 0);
    grad.addColorStop(0, COLORS.curtainLight);
    grad.addColorStop(0.55, COLORS.curtain);
    grad.addColorStop(1, COLORS.curtainDark);
    ctx.fillStyle = grad;
    ctx.fillRect(Math.min(x, x + w * dir), 0, w, FLOOR_Y);
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let i = 1; i < 5; i++) {
      const fx = x + (w / 5) * i * dir;
      ctx.fillRect(fx - 1, 0, 2, FLOOR_Y);
    }
  }

  function drawScreen(t) {
    const flicker = 0.82 + 0.05 * Math.sin(t * 0.09) + 0.03 * Math.sin(t * 0.23 + 1.3);
    ctx.save();
    ctx.globalAlpha = flicker;
    const g = ctx.createLinearGradient(0, SCREEN.y, 0, SCREEN.y + SCREEN.h);
    g.addColorStop(0, COLORS.screenGlow);
    g.addColorStop(1, COLORS.screenGlowSoft);
    ctx.fillStyle = g;
    roundedRect(SCREEN.x, SCREEN.y, SCREEN.w, SCREEN.h, 3);
    ctx.restore();

    // projeksiyon ışık huzmeleri
    ctx.save();
    ctx.globalAlpha = 0.05;
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(SCREEN.x + 14, SCREEN.y + SCREEN.h);
    ctx.lineTo(SCREEN.x - 30, FLOOR_Y);
    ctx.lineTo(SCREEN.x + 40, FLOOR_Y);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(SCREEN.x + SCREEN.w - 14, SCREEN.y + SCREEN.h);
    ctx.lineTo(SCREEN.x + SCREEN.w - 40, FLOOR_Y);
    ctx.lineTo(SCREEN.x + SCREEN.w + 30, FLOOR_Y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawScene(t) {
    const wall = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    wall.addColorStop(0, COLORS.wall1);
    wall.addColorStop(1, COLORS.wall2);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, FLOOR_Y);

    drawScreen(t);
    drawCurtain(0, 1);
    drawCurtain(W, -1);

    // taban / halı
    ctx.fillStyle = COLORS.carpet;
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    ctx.fillStyle = COLORS.carpetPattern;
    for (let x = 10; x < W - 10; x += 20) {
      ctx.save();
      ctx.translate(x, FLOOR_Y + 15);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-3, -3, 6, 6);
      ctx.restore();
    }
    ctx.fillStyle = COLORS.floorLine;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(0, FLOOR_Y, W, 2);
    ctx.globalAlpha = 1;
  }

  function drawSeat(x, w, main) {
    const backTop = 96;
    const backH = 34;
    ctx.fillStyle = COLORS.frame;
    roundedRect(x - 4, backTop + 6, 4, 30, 2);
    roundedRect(x + w, backTop + 6, 4, 30, 2);

    const backGrad = ctx.createLinearGradient(x, backTop, x, backTop + backH);
    backGrad.addColorStop(0, main ? COLORS.seatRedLight : COLORS.seatRed);
    backGrad.addColorStop(1, COLORS.seatDark);
    ctx.fillStyle = backGrad;
    roundedRect(x, backTop, w, backH, 6);

    if (main) {
      ctx.fillStyle = COLORS.seatDark;
      roundedRect(x + w / 2 - 1.5, backTop + 4, 3, backH - 8, 1.5);
    }

    ctx.fillStyle = COLORS.seatRed;
    roundedRect(x - 3, 130, w + 6, 9, 3);
    ctx.fillStyle = COLORS.seatRedLight;
    ctx.globalAlpha = 0.5;
    ctx.fillRect(x - 3, 130, w + 6, 2);
    ctx.globalAlpha = 1;

    ctx.fillStyle = COLORS.frame;
    ctx.fillRect(x, 138, 4, FLOOR_Y - 138);
    ctx.fillRect(x + w - 4, 138, 4, FLOOR_Y - 138);
  }

  /* ---------- karakterler ---------- */

  function drawHair(cx, cy, r, hair, style, back) {
    const outline = shade(hair, -55);
    ctx.fillStyle = hair;
    ctx.strokeStyle = outline;
    ctx.lineWidth = 0.7;
    switch (style) {
      case "long":
        ctx.beginPath();
        ctx.arc(cx, cy - 1, r + 0.8, Math.PI, back ? Math.PI * 2 : 0);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx - r - 1, cy - 2);
        ctx.quadraticCurveTo(cx - r - 4, cy + 10, cx - r + 1, cy + 16);
        ctx.quadraticCurveTo(cx - r + 3, cy + 9, cx - r + 2, cy - 1);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(cx + r + 1, cy - 2);
        ctx.quadraticCurveTo(cx + r + 4, cy + 10, cx + r - 1, cy + 16);
        ctx.quadraticCurveTo(cx + r - 3, cy + 9, cx + r - 2, cy - 1);
        ctx.closePath();
        ctx.fill();
        break;
      case "ponytail":
        ctx.beginPath();
        ctx.arc(cx, cy - 1, r + 0.6, Math.PI, back ? Math.PI * 2 : 0);
        ctx.fill();
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(back ? cx : cx + r + 2, cy + 3, 3.4, 7, 0.3, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        break;
      case "curly":
        // sadece kafanın etrafında yumuşak tutamlar — tam daire ÇEKMİYORUZ,
        // yoksa önden bakışta yüzü tamamen kapatıp gözleri/ağzı gömüyor
        [
          [-r, -2],
          [r, -2],
          [-r + 1.5, 3],
          [r - 1.5, 3],
          [0, -r - 1],
        ].forEach(([dx, dy]) => {
          ctx.beginPath();
          ctx.arc(cx + dx, cy + dy, 2.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
        });
        break;
      case "short":
      default:
        ctx.beginPath();
        ctx.arc(cx, cy, r + 0.4, Math.PI, 0);
        ctx.fill();
        ctx.stroke();
        if (!back) {
          ctx.fillRect(cx - r + 1, cy - 1, 2.2, 4);
          ctx.fillRect(cx + r - 3.2, cy - 1, 2.2, 4);
        }
        break;
    }
  }

  function drawHead(x, headTop, hair, hairStyle, turn, opts) {
    const cx = x + 7;
    const cy = headTop + 6;
    const r = 6.6;
    const girl = opts && opts.girl;
    const surprised = !!(opts && opts.surprised && turn > 0.6);
    const kiss = !!(opts && opts.kiss && turn > 0.5);

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1 - 0.3 * Math.sin(turn * Math.PI), 1); // dönerken profile daralma illüzyonu
    ctx.translate(-cx, -cy);

    // arkadan görünüş (dönüş ilerledikçe soluyor)
    if (turn < 0.96) {
      ctx.globalAlpha = 1 - turn;
      ctx.fillStyle = hair;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 0.6, 0, Math.PI * 2);
      ctx.fill();
      drawHair(cx, cy, r, hair, hairStyle, true);
    }

    // önden görünüş (dönüş ilerledikçe belirginleşir)
    if (turn > 0.04) {
      ctx.globalAlpha = turn;
      ctx.fillStyle = COLORS.skin;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      drawHair(cx, cy, r, hair, hairStyle, false);

      ctx.fillStyle = COLORS.brow;
      if (surprised) {
        ctx.fillRect(cx - 4.2, cy - 3, 2, 0.9);
        ctx.fillRect(cx + 2.2, cy - 3, 2, 0.9);
      } else {
        ctx.fillRect(cx - 4, cy - 2, 2, 0.8);
        ctx.fillRect(cx + 2, cy - 2, 2, 0.8);
      }

      if (kiss) {
        // sevgi dolu, kapalı gözler + öpücük dudak
        ctx.strokeStyle = COLORS.brow;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cx - 4.6, cy + 0.8);
        ctx.quadraticCurveTo(cx - 3.4, cy - 0.4, cx - 2.2, cy + 0.8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 2.2, cy + 0.8);
        ctx.quadraticCurveTo(cx + 3.4, cy - 0.4, cx + 4.6, cy + 0.8);
        ctx.stroke();
        ctx.fillStyle = COLORS.mouth;
        ctx.beginPath();
        ctx.ellipse(cx, cy + 3, 1.7, 1.2, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (surprised) {
        ctx.fillStyle = COLORS.eye;
        ctx.beginPath();
        ctx.arc(cx - 3.2, cy + 0.6, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + 3.2, cy + 0.6, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.mouthDeep;
        ctx.beginPath();
        ctx.arc(cx, cy + 3.2, 1.1, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = COLORS.eye;
        ctx.fillRect(cx - 4, cy, 1.6, 1.6);
        ctx.fillRect(cx + 2.4, cy, 1.6, 1.6);
        if (girl) {
          ctx.fillRect(cx - 4.6, cy - 0.6, 1.4, 0.7);
          ctx.fillRect(cx + 3.2, cy - 0.6, 1.4, 0.7);
        }
        ctx.strokeStyle = COLORS.mouth;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy + 2.6, 2, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.stroke();
      }

      ctx.fillStyle = COLORS.blush;
      ctx.globalAlpha = turn * 0.5;
      ctx.beginPath();
      ctx.arc(cx - 3.8, cy + 2.4, 1.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + 3.8, cy + 2.4, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawPerson(x, headTop, opts) {
    const { hair, hairStyle, shirt, turn, seated, girl, surprised, kiss } = opts;
    const torsoTop = headTop + 11;
    const torsoH = seated ? 20 : 22;
    const legH = seated ? 5 : 24;

    ctx.fillStyle = shirt;
    roundedRect(x, torsoTop, 14, torsoH, 4);
    ctx.fillStyle = COLORS.pants;
    roundedRect(x + 1, torsoTop + torsoH - 2, 5, legH, 2);
    roundedRect(x + 8, torsoTop + torsoH - 2, 5, legH, 2);

    drawHead(x, headTop, hair, hairStyle, turn == null ? 1 : turn, { girl, surprised, kiss });
  }

  function drawBystanders() {
    bystanders.forEach((b) => {
      drawSeat(b.x - 3, SEAT_W, false);
      drawPerson(b.x, 90, {
        hair: b.hair,
        hairStyle: b.hairStyle,
        shirt: b.shirt,
        turn: b.visualTurn,
        seated: true,
        girl: b.girl,
        surprised: b.state === "alert",
      });
      if (b.visualTurn > 0.12) {
        ctx.save();
        ctx.globalAlpha = Math.min(1, b.visualTurn * 1.3);
        ctx.fillStyle = COLORS.alertBubble;
        roundedRect(b.x + 9, 68, 10, 10, 5);
        ctx.fillStyle = "#3a2415";
        ctx.font = "8px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("!", b.x + 14, 76);
        ctx.restore();
      }
    });
  }

  function drawHeartShape(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, 2.6);
    ctx.bezierCurveTo(-6, -3, -3, -7, 0, -3.4);
    ctx.bezierCurveTo(3, -7, 6, -3, 0, 2.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawCouple() {
    const cx = W / 2;
    drawSeat(SEAT_MAIN.x, SEAT_MAIN.w, true);

    if (hiding) {
      // koltuğun arkasına eğiliyorlar — sadece saçlarının tepesi görünür
      ctx.save();
      ctx.beginPath();
      ctx.rect(cx - 32, 90, 64, 16);
      ctx.clip();
      drawPerson(cx - 24, 100, { ...AYLIN, turn: 0, seated: true });
      drawPerson(cx + 10, 100, { ...BERKAY, turn: 0, seated: true });
      ctx.restore();
    } else {
      drawPerson(cx - 15, 94, { ...AYLIN, turn: 1, seated: true, kiss: true });
      drawPerson(cx + 1, 94, { ...BERKAY, turn: 1, seated: true, kiss: true });

      hearts.forEach((h) => {
        ctx.save();
        ctx.globalAlpha = Math.max(0, h.alpha);
        ctx.fillStyle = h.big ? COLORS.heart : COLORS.heart2;
        drawHeartShape(cx + h.x, h.y, h.scale);
        ctx.restore();
      });
    }
  }

  function update(dt) {
    timeAlive += dt;

    if (!hiding) {
      exposedTime += dt; // sadece öpüşürken (riskteyken) puan birikir
      heartTimer += dt;
      if (heartTimer > 22) {
        heartTimer = 0;
        hearts.push({
          x: (Math.random() - 0.5) * 12,
          y: 80,
          alpha: 1,
          scale: 0.7 + Math.random() * 0.5,
          vy: -0.28 - Math.random() * 0.12,
          big: Math.random() > 0.5,
        });
      }
    }
    hearts.forEach((h) => {
      h.y += h.vy * dt;
      h.alpha -= dt * 0.012;
    });
    hearts = hearts.filter((h) => h.alpha > 0);

    score = Math.floor(exposedTime / 6);
    scoreEl.textContent = `SKOR: ${score}`;

    bystanders.forEach((b) => {
      b.timer -= dt;
      if (b.timer <= 0) scheduleBystander(b);

      const target = b.state === "alert" ? 1 : 0;
      if (b.visualTurn < target) {
        b.visualTurn = Math.min(target, b.visualTurn + TURN_STEP * dt);
      } else if (b.visualTurn > target) {
        b.visualTurn = Math.max(target, b.visualTurn - TURN_STEP * dt);
      }
    });

    if (!hiding) {
      // sadece kişi GERÇEKTEN dönüp bakmayı bitirmişse (visualTurn > 0.82)
      // yakalanma sayılır — ani "anında bakma" hissi böyle ortadan kalkıyor
      const caught = bystanders.some((b) => b.state === "alert" && b.visualTurn > 0.82);
      if (caught) {
        endGame();
        return;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawScene(timeAlive);
    drawBystanders();
    drawCouple();
  }

  function loop(now) {
    const dt = Math.max(0, Math.min((now - lastTime) / 16.67, 2.5));
    lastTime = now;
    if (state === "running") {
      update(dt);
      render();
      rafId = requestAnimationFrame(loop);
    }
  }

  function renderReadyFrame() {
    resetGame();
    render();
  }

  renderReadyFrame();

  canvas.addEventListener("click", handleStart);
  // overlay canvas'ın TAM üstünde durduğu için tıklamaları/dokunuşları yakalıyor —
  // canvas'a hiç ulaşmadan "dokun ya da tıkla" metnine basılabilsin diye burada da dinliyoruz
  overlay.addEventListener("click", handleStart);
  overlay.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      handleStart();
    },
    { passive: false }
  );
  canvas.addEventListener("pointerdown", () => setHiding(true));
  canvas.addEventListener("pointerup", () => setHiding(false));
  canvas.addEventListener("pointerleave", () => setHiding(false));
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      handleStart();
      setHiding(true);
    },
    { passive: false }
  );
  canvas.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      setHiding(false);
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      if (state === "running") setHiding(true);
      else handleStart();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") setHiding(false);
  });
});
