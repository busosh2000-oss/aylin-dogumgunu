/*
  Öpücük Oyunu — "Sneaky Date" tarzı bir yakalanma oyunu. Aylin ve Berkay
  bir bankta öpüşürken etraftakiler dönüp bakınca basılı tutup gizlenmen
  gerekiyor. Sadece opucuk-oyunu/index.html sayfasında çalışır.
*/

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("kiss-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("kiss-overlay");
  const scoreEl = document.getElementById("kiss-score");
  const bestEl = document.getElementById("kiss-best");

  const W = canvas.width;
  const H = canvas.height;
  const FLOOR_Y = 150;

  const COLORS = {
    sky1: "#0f0819",
    sky2: "#3c1a63",
    ground: "#0f0819",
    groundLine: "#4a2a7a",
    grass: "#4d6a3f",
    moon: "#f2e9c9",
    moonShadow: "#d8c99e",
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
    { x: 26, hair: "#ffb347", hairStyle: "short", shirt: "#8a3ffc" }, // turuncu
    { x: 66, hair: "#ff8fc7", hairStyle: "curly", shirt: "#ffd166" }, // pembe
    { x: W - 66 - 18, hair: "#5a3a22", hairStyle: "straight", shirt: "#9d4edd" }, // kahverengi düz
    { x: W - 26 - 18, hair: "#7a4a2a", hairStyle: "curly", shirt: "#c77dff" }, // kahverengi kıvırcık
  ];

  const BENCH = { x: 140, w: 100 };

  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem("kiss-game-best-score"), 10) || 0;
  } catch (e) {
    bestScore = 0;
  }
  bestEl.textContent = `EN İYİ: ${bestScore}`;

  let state = "ready"; // "ready" | "running" | "over"
  let bystanders, timeAlive, exposedTime, score, hiding, heartBob, rafId, lastTime;

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

  function drawScene() {
    const sky = ctx.createLinearGradient(0, 0, 0, FLOOR_Y);
    sky.addColorStop(0, COLORS.sky1);
    sky.addColorStop(1, COLORS.sky2);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, FLOOR_Y);

    // moon
    ctx.fillStyle = COLORS.moon;
    ctx.beginPath();
    ctx.arc(W - 40, 28, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.moonShadow;
    ctx.beginPath();
    ctx.arc(W - 44, 24, 3, 0, Math.PI * 2);
    ctx.fill();

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
    ctx.fillRect(bx + 6, 100, 4, 32);
    ctx.fillRect(bx + bw - 10, 100, 4, 32);
    // backrest
    ctx.fillStyle = COLORS.benchLight;
    ctx.fillRect(bx, 100, bw, 6);
    // seat
    ctx.fillStyle = COLORS.bench;
    ctx.fillRect(bx - 5, 128, bw + 10, 8);
    ctx.fillStyle = COLORS.benchLight;
    ctx.fillRect(bx - 5, 128, bw + 10, 2);
    // front legs
    ctx.fillStyle = COLORS.bench;
    ctx.fillRect(bx, 136, 5, FLOOR_Y - 136);
    ctx.fillRect(bx + bw - 5, 136, 5, FLOOR_Y - 136);
  }

  /* ---------- characters ---------- */

  function drawHead(x, headTop, hairColor, hairStyle, facing) {
    if (facing === "away") {
      // back of the head — solid hair, a little fuller than the face view
      ctx.fillStyle = hairColor;
      ctx.fillRect(x + 2, headTop - 1, 10, 12);
      if (hairStyle === "curly") {
        ctx.fillRect(x, headTop + 1, 2, 8);
        ctx.fillRect(x + 12, headTop + 1, 2, 8);
      } else if (hairStyle === "straight") {
        ctx.fillRect(x + 1, headTop + 2, 2, 9);
        ctx.fillRect(x + 11, headTop + 2, 2, 9);
      }
      return;
    }

    // rounded-ish face (skin) built from tapered rows
    ctx.fillStyle = COLORS.skin;
    ctx.fillRect(x + 4, headTop, 6, 2);
    ctx.fillRect(x + 2, headTop + 2, 10, 7);
    ctx.fillRect(x + 3, headTop + 9, 8, 2);

    // hair on top + sides, drawn after the skin so it frames the face
    ctx.fillStyle = hairColor;
    ctx.fillRect(x + 1, headTop - 1, 12, 3);
    if (hairStyle === "straight") {
      ctx.fillRect(x + 1, headTop + 2, 2, 9);
      ctx.fillRect(x + 11, headTop + 2, 2, 9);
    } else if (hairStyle === "curly") {
      ctx.fillRect(x, headTop, 3, 3);
      ctx.fillRect(x + 11, headTop, 3, 3);
      ctx.fillRect(x, headTop + 5, 3, 3);
      ctx.fillRect(x + 11, headTop + 5, 3, 3);
    }

    // face — eyebrows, eyes, smiling mouth
    ctx.fillStyle = COLORS.brow;
    ctx.fillRect(x + 3, headTop + 3, 2, 1);
    ctx.fillRect(x + 9, headTop + 3, 2, 1);
    ctx.fillStyle = COLORS.eye;
    ctx.fillRect(x + 3, headTop + 5, 2, 2);
    ctx.fillRect(x + 9, headTop + 5, 2, 2);
    ctx.fillStyle = COLORS.mouth;
    ctx.fillRect(x + 5, headTop + 8, 4, 1);
  }

  function drawPerson(x, headTop, opts) {
    const { hair, hairStyle, shirt, facing, seated } = opts;
    const torsoTop = headTop + 11;
    const torsoH = seated ? 20 : 22;
    const legH = seated ? 5 : 26;

    drawHead(x, headTop, hair, hairStyle, facing);

    // torso
    ctx.fillStyle = shirt;
    ctx.fillRect(x, torsoTop, 14, torsoH);
    // legs
    ctx.fillStyle = COLORS.pants;
    ctx.fillRect(x + 1, torsoTop + torsoH, 5, legH);
    ctx.fillRect(x + 8, torsoTop + torsoH, 5, legH);
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
