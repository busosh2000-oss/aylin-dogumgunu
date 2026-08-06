/*
  Aylo Game — Chrome'un "dinozor oyunu"nun Aylin temalı, pembe saçlı
  piksel karakterli versiyonu. Sadece oyun/index.html sayfasında çalışır.
*/

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("aylo-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("game-overlay");
  const scoreEl = document.getElementById("game-score");
  const bestEl = document.getElementById("game-best");

  const W = canvas.width;
  const H = canvas.height;
  const GROUND_Y = 84;

  const GRAVITY = 0.7;
  const JUMP_VELOCITY = -9.2;
  const BASE_SPEED = 3.2;
  const MAX_SPEED_BONUS = 4;

  const COLORS = {
    sky1: "#1a0a2e",
    sky2: "#3c1a63",
    star: "#e0aaff",
    ground: "#c77dff",
    groundTick: "#6b2fb3",
    skin: "#f2c9a0",
    hair: "#ff8fc7",
    hairDark: "#e05fa0",
    outfit: "#9d4edd",
    legs: "#2d1451",
    obstacle: "#0f0819",
    obstacleEdge: "#6b2fb3",
  };

  const STARS = Array.from({ length: 18 }, () => ({
    x: Math.random() * W,
    y: Math.random() * (GROUND_Y - 10),
    size: Math.random() < 0.5 ? 1 : 2,
  }));

  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem("aylo-best-score"), 10) || 0;
  } catch (e) {
    bestScore = 0;
  }
  bestEl.textContent = `EN İYİ: ${bestScore}`;

  let state = "ready"; // "ready" | "running" | "over"
  let player, obstacles, distance, score, speed, groundOffset, legFrame, legTimer, lastTime, nextSpawnIn, rafId;

  function resetGame() {
    player = {
      x: 28,
      w: 14,
      h: 20,
      y: GROUND_Y - 20,
      velocityY: 0,
      isJumping: false,
    };
    obstacles = [];
    distance = 0;
    score = 0;
    speed = BASE_SPEED;
    groundOffset = 0;
    legFrame = 0;
    legTimer = 0;
    nextSpawnIn = 90 + Math.random() * 60;
  }

  function jump() {
    if (!player.isJumping) {
      player.velocityY = JUMP_VELOCITY;
      player.isJumping = true;
    }
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
        localStorage.setItem("aylo-best-score", String(bestScore));
      } catch (e) {
        /* localStorage unavailable, skip persisting */
      }
    }
    bestEl.textContent = `EN İYİ: ${bestScore}`;
    overlay.innerHTML = `
      <h3>OYUN BİTTİ</h3>
      <p>Skor: ${score}${score >= bestScore && score > 0 ? " — Yeni rekor! 🎉" : ""}</p>
      <button id="game-restart-btn" class="pixel-btn">TEKRAR OYNA ▶</button>
    `;
    overlay.classList.remove("hidden");
    document.getElementById("game-restart-btn").addEventListener("click", startGame);
  }

  function handleInput() {
    if (state === "ready" || state === "over") {
      startGame();
    } else if (state === "running") {
      jump();
    }
  }

  function spawnObstacle() {
    const types = [
      { w: 6, h: 12 },
      { w: 8, h: 18 },
      { w: 5, h: 22 },
    ];
    const t = types[Math.floor(Math.random() * types.length)];
    obstacles.push({ x: W + 10, w: t.w, h: t.h });
    nextSpawnIn = 80 + Math.random() * 90;
  }

  function drawBackground() {
    ctx.fillStyle = COLORS.sky1;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COLORS.star;
    STARS.forEach((s) => ctx.fillRect(s.x, s.y, s.size, s.size));
  }

  function drawGround() {
    ctx.fillStyle = COLORS.ground;
    ctx.fillRect(0, GROUND_Y, W, 2);
    ctx.fillStyle = COLORS.groundTick;
    const tickSpacing = 18;
    const offset = groundOffset % tickSpacing;
    for (let x = -offset; x < W; x += tickSpacing) {
      ctx.fillRect(x, GROUND_Y + 3, 6, 2);
    }
  }

  function drawAylo() {
    const x = player.x;
    const y = player.y;
    // pigtails hanging behind head
    ctx.fillStyle = COLORS.hairDark;
    ctx.fillRect(x, y + 2, 3, 9);
    ctx.fillRect(x + 11, y + 2, 3, 9);
    // head
    ctx.fillStyle = COLORS.skin;
    ctx.fillRect(x + 3, y + 2, 8, 7);
    // hair top / bangs
    ctx.fillStyle = COLORS.hair;
    ctx.fillRect(x + 2, y, 10, 3);
    // body
    ctx.fillStyle = COLORS.outfit;
    ctx.fillRect(x + 3, y + 9, 8, 7);
    // legs
    ctx.fillStyle = COLORS.legs;
    if (player.isJumping) {
      ctx.fillRect(x + 4, y + 16, 6, 4);
    } else if (legFrame === 0) {
      ctx.fillRect(x + 3, y + 16, 3, 4);
      ctx.fillRect(x + 8, y + 16, 3, 4);
    } else {
      ctx.fillRect(x + 4, y + 16, 2, 4);
      ctx.fillRect(x + 7, y + 16, 4, 4);
    }
  }

  function drawObstacles() {
    obstacles.forEach((o) => {
      const oy = GROUND_Y - o.h;
      ctx.fillStyle = COLORS.obstacleEdge;
      ctx.fillRect(o.x - 1, oy - 1, o.w + 2, o.h + 2);
      ctx.fillStyle = COLORS.obstacle;
      ctx.fillRect(o.x, oy, o.w, o.h);
    });
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    speed = BASE_SPEED + Math.min(score * 0.0025, MAX_SPEED_BONUS);

    // physics
    player.velocityY += GRAVITY * dt;
    player.y += player.velocityY * dt;
    if (player.y >= GROUND_Y - player.h) {
      player.y = GROUND_Y - player.h;
      player.velocityY = 0;
      player.isJumping = false;
    }

    // run-cycle animation
    legTimer += dt;
    if (legTimer > 8) {
      legTimer = 0;
      legFrame = legFrame === 0 ? 1 : 0;
    }

    // world movement
    groundOffset = (groundOffset + speed * dt) % 10000;
    distance += speed * dt;
    score = Math.floor(distance / 6);
    scoreEl.textContent = `SKOR: ${score}`;

    obstacles.forEach((o) => (o.x -= speed * dt));
    obstacles = obstacles.filter((o) => o.x + o.w > -5);

    nextSpawnIn -= speed * dt;
    if (nextSpawnIn <= 0) spawnObstacle();

    // collision (a slightly inset hitbox keeps it feeling fair)
    const hitbox = { x: player.x + 3, y: player.y + 2, w: player.w - 6, h: player.h - 3 };
    for (const o of obstacles) {
      const obox = { x: o.x, y: GROUND_Y - o.h, w: o.w, h: o.h };
      if (rectsOverlap(hitbox, obox)) {
        endGame();
        break;
      }
    }
  }

  function render() {
    drawBackground();
    drawGround();
    drawObstacles();
    drawAylo();
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
    drawBackground();
    drawGround();
    drawAylo();
  }

  renderReadyFrame();

  canvas.addEventListener("click", handleInput);
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      handleInput();
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      handleInput();
    }
  });
});
