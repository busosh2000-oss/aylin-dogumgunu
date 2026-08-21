/*
  Sneaky Kiss Aylo — "Sneaky Date" tarzı bir yakalanma oyunu. Aylin ve
  Berkay bir bankta öpüşürken etraftakiler dönüp bakınca basılı tutup
  gizlenmen gerekiyor. Sadece oyun/sneaky-kiss-aylo/index.html sayfasında çalışır.
*/

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("kiss-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("kiss-overlay");
  const scoreEl = document.getElementById("kiss-score");
  const bestEl = document.getElementById("kiss-best");

  // draw everything on a fixed 380x180 logical grid, but back the canvas
  // with more real pixels so it stays crisp when stretched to fill the page
  const W = 380;
  const H = 180;
  const RENDER_SCALE = canvas.width / W || 2;
  ctx.scale(RENDER_SCALE, RENDER_SCALE);

  const FLOOR_Y = 150;

  const COLORS = {
    sky1: "#0f0819",
    sky2: "#3c1a63",
    ground: "#0f0819",
    groundLine: "#4a2a7a",
    grass: "#4d6a3f",
    moon: "#f2e9c9",
    moonShadow: "#d8c99e",
    lampPost: "#2d1451",
    lampGlow: "#ffe9b0",
    bench: "#5a3a22",
    benchLight: "#7a5233",
    skin: "#f2c9a0",
    brow: "#3a2415",
    eye: "#1a0a2e",
    mouth: "#c2467a",
    pants: "#241040",
    heart: "#ff8fc7",
    alertMark: "#ffd166",
  };

  // aylin: mor saç / berkay: sarı saç — ortada bankta öpüşen çift
  const AYLIN = { hair: "#c77dff", hairStyle: "straight", shirt: "#e0aaff" };
  const BERKAY = { hair: "#f2d675", hairStyle: "short", shirt: "#6b2fb3" };

  const BYSTANDER_DEFS = [
    { x: 30, hair: "#ffb347", hairStyle: "short", shirt: "#8a3ffc" }, // turuncu
    { x: 74, hair: "#ff8fc7", hairStyle: "curly", shirt: "#ffd166" }, // pembe
    { x: W - 74 - 18, hair: "#5a3a22", hairStyle: "straight", shirt: "#9d4edd" }, // kahverengi düz
    { x: W - 30 - 18, hair: "#7a4a2a", hairStyle: "curly", shirt: "#c77dff" }, // kahverengi kıvırcık
  ];

  const BENCH = { x: 150, w: 100 };

  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem("kiss-game-best-score"), 10) || 0;
  } catch (e) {
    bestScore = 0;
  }
  bestEl.textContent = `EN İYİ: ${bestScore}`;

  let state = "ready"; // "ready" | "running" | "over"
  let bystanders, timeAlive, exposedTime, score, hiding, heartBob, rafId, lastTime;

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
    return Math.min(t / 1800, 1); // ramps up over ~30s of survival
  }

  function scheduleBystander(b) {
    const d = difficultyOf(timeAlive);
    if (b.state === "alert") {
      b.state = "away";
      b.timer = 140 - d * 70 + Math.random() * 50;
    } else {
      b.state = "alert";
      b.alertAge = 0;
      b.timer = 35 + d * 25 + Math.random() * 20;
    }
  }

  function resetGame() {
    timeAlive = 0;
    exposedTime = 0;
    score = 0;
    hiding = false;
    heartBob = 0;
    bystanders = BYSTANDER_DEFS.map((def) => ({
      ...def,
      state: "away",
      timer: 60 + Math.random() * 200, // staggered starts
      alertAge: 0,
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
        /* localStorage unavailable, skip persisting */
      }
    }
    bestEl.textContent = `EN İYİ: ${bestScore}`;
    overlay.innerHTML = `
      <h3>YAKALANDINIZ!</h3>
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

  /* ---------- scenery ---------- */

  function drawLamp(x) {
    ctx.fillStyle = COLORS.lampPost;
    ctx.fillRect(x - 1, 60, 2, FLOOR_Y - 60);
    ctx.fillStyle = COLORS.lampGlow;
    const glow = ctx.createRadialGradient(x, 58, 1, x, 58, 16);
    glow.addColorStop(0, "rgba(255,233,176,0.9)");
    glow.addColorStop(1, "rgba(255,233,176,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(x - 16, 42, 32, 32);
    ctx.fillStyle = COLORS.lampGlow;
    ctx.beginPath();
    ctx.arc(x, 58, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawScene() {
    const sky = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    sky.addColorStop(0, COLORS.sky1);
    sky.addColorStop(1, COLORS.sky2);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, FLOOR_Y);

    // moon
    ctx.fillStyle = COLORS.moon;
    ctx.beginPath();
    ctx.arc(W - 40, 28, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.moonShadow;
    ctx.beginPath();
    ctx.arc(W - 45, 24, 3.4, 0, Math.PI * 2);
    ctx.fill();

    drawLamp(55);
    drawLamp(W - 55);

    // ground
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, FLOOR_Y, W, H - FLOOR_Y);
    ctx.fillStyle = COLORS.groundLine;
    ctx.fillRect(0, FLOOR_Y, W, 2);

    // little grass tufts along the floor line
    ctx.fillStyle = COLORS.grass;
    const tuftSpacing = 46;
    for (let x = 12; x < W - 12; x += tuftSpacing) {
      if (x > BENCH.x - 20 && x < BENCH.x + BENCH.w + 20) continue; // keep it clear under the bench
      ctx.fillRect(x, FLOOR_Y - 6, 2, 6);
      ctx.fillRect(x + 4, FLOOR_Y - 9, 2, 9);
      ctx.fillRect(x + 8, FLOOR_Y - 5, 2, 5);
    }
  }

  function drawBench() {
    const bx = BENCH.x;
    const bw = BENCH.w;
    // back posts
    ctx.fillStyle = COLORS.bench;
    roundedRect(bx + 6, 100, 4, 32, 1);
    roundedRect(bx + bw - 10, 100, 4, 32, 1);
    // backrest
    ctx.fillStyle = COLORS.benchLight;
    roundedRect(bx, 100, bw, 6, 2);
    // seat
    ctx.fillStyle = COLORS.bench;
    roundedRect(bx - 5, 128, bw + 10, 8, 2);
    ctx.fillStyle = COLORS.benchLight;
    ctx.fillRect(bx - 5, 128, bw + 10, 2);
    // front legs
    ctx.fillStyle = COLORS.bench;
    ctx.fillRect(bx, 136, 5, FLOOR_Y - 136);
    ctx.fillRect(bx + bw - 5, 136, 5, FLOOR_Y - 136);
  }

  /* ---------- characters ---------- */

  function drawHead(x, headTop, hairColor, hairStyle, facing) {
    const cx = x + 7;
    const cy = headTop + 6;
    const r = 6.5;

    if (facing === "away") {
      // back of the head — solid hair, a little fuller than the face view
      ctx.fillStyle = hairColor;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 0.6, 0, Math.PI * 2);
      ctx.fill();
      if (hairStyle === "curly") {
        ctx.beginPath();
        ctx.arc(cx - r, cy + 1, 2.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + r, cy + 1, 2.6, 0, Math.PI * 2);
        ctx.fill();
      } else if (hairStyle === "straight") {
        roundedRect(x - 0.5, headTop + 3, 2.5, 9, 1);
        roundedRect(x + 12, headTop + 3, 2.5, 9, 1);
      }
      return;
    }

    // face — round skin base
    ctx.fillStyle = COLORS.skin;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // hair cap on top, drawn after the skin so it frames the face
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 0.4, Math.PI, 0);
    ctx.fill();
    if (hairStyle === "straight") {
      roundedRect(x - 0.5, headTop + 3, 2.5, 9, 1);
      roundedRect(x + 12, headTop + 3, 2.5, 9, 1);
    } else if (hairStyle === "curly") {
      ctx.beginPath();
      ctx.arc(cx - r, cy - 1, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r, cy - 1, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - r + 1, cy + 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r - 1, cy + 3, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // face — eyebrows, eyes, smiling mouth
    ctx.fillStyle = COLORS.brow;
    ctx.fillRect(cx - 4, cy - 2, 2, 1);
    ctx.fillRect(cx + 2, cy - 2, 2, 1);
    ctx.fillStyle = COLORS.eye;
    ctx.fillRect(cx - 4, cy, 1.6, 1.6);
    ctx.fillRect(cx + 2.4, cy, 1.6, 1.6);
    ctx.fillStyle = COLORS.mouth;
    ctx.beginPath();
    ctx.arc(cx, cy + 3, 2, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.lineWidth = 1;
    ctx.strokeStyle = COLORS.mouth;
    ctx.stroke();
  }

  function drawPerson(x, headTop, opts) {
    const { hair, hairStyle, shirt, facing, seated } = opts;
    const torsoTop = headTop + 11;
    const torsoH = seated ? 20 : 22;
    const legH = seated ? 5 : 26;

    // torso (drawn first so the round head overlaps its top edge nicely)
    ctx.fillStyle = shirt;
    roundedRect(x, torsoTop, 14, torsoH, 4);
    // legs
    ctx.fillStyle = COLORS.pants;
    roundedRect(x + 1, torsoTop + torsoH - 2, 5, legH, 2);
    roundedRect(x + 8, torsoTop + torsoH - 2, 5, legH, 2);

    drawHead(x, headTop, hair, hairStyle, facing);
  }

  function drawBystanders() {
    bystanders.forEach((b) => {
      drawPerson(b.x, 82, {
        hair: b.hair,
        hairStyle: b.hairStyle,
        shirt: b.shirt,
        facing: b.state === "alert" ? "toward" : "away",
        seated: false,
      });
      if (b.state === "alert" && b.alertAge < 14) {
        ctx.fillStyle = COLORS.alertMark;
        ctx.fillRect(b.x + 6, 64, 3, 9);
        ctx.fillRect(b.x + 6, 75, 3, 3);
      }
    });
  }

  function drawCouple() {
    const cx = W / 2;
    const headTop = 96;
    if (hiding) {
      drawPerson(cx - 24, headTop, { ...AYLIN, facing: "away", seated: true });
      drawPerson(cx + 10, headTop, { ...BERKAY, facing: "away", seated: true });
    } else {
      drawPerson(cx - 15, headTop, { ...AYLIN, facing: "toward", seated: true });
      drawPerson(cx + 1, headTop, { ...BERKAY, facing: "toward", seated: true });
      // little bouncing heart above them while they're kissing
      const bob = Math.sin(heartBob) * 3;
      ctx.fillStyle = COLORS.heart;
      const hy = 78 + bob;
      ctx.fillRect(cx - 6, hy, 4, 4);
      ctx.fillRect(cx + 2, hy, 4, 4);
      ctx.fillRect(cx - 4, hy + 3, 8, 4);
      ctx.fillRect(cx - 2, hy + 6, 4, 3);
    }
  }

  function update(dt) {
    timeAlive += dt;
    if (!hiding) {
      exposedTime += dt; // only racking up points while actually kissing (at risk)
      heartBob += dt * 0.15;
    }
    score = Math.floor(exposedTime / 6);
    scoreEl.textContent = `SKOR: ${score}`;

    bystanders.forEach((b) => {
      if (b.state === "alert") b.alertAge += dt;
      b.timer -= dt;
      if (b.timer <= 0) scheduleBystander(b);
    });

    if (!hiding) {
      const caught = bystanders.some((b) => b.state === "alert");
      if (caught) {
        endGame();
        return;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
    drawScene();
    drawBench();
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
