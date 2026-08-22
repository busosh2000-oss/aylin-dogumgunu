/*
  Aylo Game — Chrome'un "dinozor oyunu"nun Aylin temalı, pembe saçlı
  piksel karakterli versiyonu. Sadece oyun/aylo-game/index.html sayfasında çalışır.
*/

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("aylo-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const overlay = document.getElementById("game-overlay");
  const scoreEl = document.getElementById("game-score");
  const bestEl = document.getElementById("game-best");

  // draw everything in a fixed 300x100 logical grid, but back the canvas
  // with more real pixels so it stays crisp when stretched to fill the page
  const W = 300;
  const H = 100;
  const RENDER_SCALE = canvas.width / W || 2;
  ctx.scale(RENDER_SCALE, RENDER_SCALE);

  const GROUND_Y = 84;

  // speed curve modeled on the real Chrome dino game (start 6, max 13,
  // +0.001/frame on a 600px-wide canvas) scaled down to our 300px stage
  const GRAVITY = 0.7;
  const JUMP_VELOCITY = -9.2;
  const BASE_SPEED = 3;
  const MAX_SPEED = 6.5;
  const ACCEL_PER_FRAME = 0.0005;

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
    obstacle: "#2d1451",
    obstacleEdge: "#6b2fb3",
    dragonBody: "#4d8c3f",
    dragonWing: "#2f5c26",
    dragonEye: "#ffd166",
  };

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

  const STARS = Array.from({ length: 18 }, () => ({
    x: Math.random() * W,
    y: Math.random() * (GROUND_Y - 10),
    size: Math.random() < 0.5 ? 1 : 1.6,
  }));

  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem("aylo-best-score"), 10) || 0;
  } catch (e) {
    bestScore = 0;
  }
  bestEl.textContent = `EN İYİ: ${bestScore}`;

  let state = "ready"; // "ready" | "running" | "over"
  let player, obstacles, distance, score, speed, timeAlive, groundOffset, legFrame, legTimer, wingFrame, wingTimer, lastTime, nextSpawnIn, rafId;

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
    timeAlive = 0;
    groundOffset = 0;
    legFrame = 0;
    legTimer = 0;
    wingFrame = 0;
    wingTimer = 0;
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
    if (Math.random() < 0.4) {
      // flying dragon: sometimes low (jump over it), sometimes high (just run under it)
      const flyingHigh = Math.random() < 0.5;
      const h = 9;
      const y = flyingHigh ? 12 + Math.random() * 8 : GROUND_Y - h;
      obstacles.push({ x: W + 10, w: 16, h, y, type: "dragon" });
    } else {
      const types = [
        { w: 6, h: 12 },
        { w: 8, h: 18 },
        { w: 5, h: 22 },
      ];
      const t = types[Math.floor(Math.random() * types.length)];
      obstacles.push({ x: W + 10, w: t.w, h: t.h, y: GROUND_Y - t.h, type: "block" });
    }
    nextSpawnIn = 70 + Math.random() * 80;
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
      roundedRect(x, GROUND_Y + 3, 6, 2, 1);
    }
  }

  function drawAylo() {
    const cx = player.x + player.w / 2;
    const headCy = player.y + 6;
    const headR = 6.5;

    // pigtails hanging beside the head
    ctx.fillStyle = COLORS.hairDark;
    ctx.beginPath();
    ctx.arc(cx - 8, headCy + 5, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 8, headCy + 5, 3.4, 0, Math.PI * 2);
    ctx.fill();

    // head — round face
    ctx.fillStyle = COLORS.skin;
    ctx.beginPath();
    ctx.arc(cx, headCy, headR, 0, Math.PI * 2);
    ctx.fill();

    // hair bangs on top
    ctx.fillStyle = COLORS.hair;
    ctx.beginPath();
    ctx.arc(cx, headCy, headR + 0.6, Math.PI, 0);
    ctx.fill();

    // tiny smiling face
    ctx.fillStyle = "#1a0a2e";
    ctx.fillRect(cx - 3, headCy - 0.5, 1.4, 1.4);
    ctx.fillRect(cx + 1.6, headCy - 0.5, 1.4, 1.4);

    // body
    ctx.fillStyle = COLORS.outfit;
    roundedRect(player.x + 2, headCy + headR - 1, 10, 8, 2);

    // legs
    ctx.fillStyle = COLORS.legs;
    const legY = headCy + headR + 6;
    if (player.isJumping) {
      roundedRect(cx - 3, legY, 6, 4, 1.5);
    } else if (legFrame === 0) {
      roundedRect(cx - 4, legY, 3, 4, 1);
      roundedRect(cx + 1, legY, 3, 4, 1);
    } else {
      roundedRect(cx - 3, legY, 2, 4, 1);
      roundedRect(cx, legY, 4, 4, 1);
    }
  }

  function drawObstacles() {
    obstacles.forEach((o) => {
      if (o.type === "dragon") {
        drawDragon(o);
        return;
      }
      ctx.fillStyle = COLORS.obstacleEdge;
      roundedRect(o.x - 1, o.y - 1, o.w + 2, o.h + 2, 2);
      ctx.fillStyle = COLORS.obstacle;
      roundedRect(o.x, o.y, o.w, o.h, 2);
    });
  }

  function drawDragon(o) {
    const x = o.x;
    const y = o.y;
    // wings — alternate up/down for a flapping effect (drawn behind the body)
    ctx.fillStyle = COLORS.dragonWing;
    if (wingFrame === 0) {
      roundedRect(x + 5, y - 4, 7, 4, 2);
      roundedRect(x + 6, y + 7, 6, 4, 2);
    } else {
      roundedRect(x + 6, y, 6, 3, 1.5);
      roundedRect(x + 6, y + 5, 6, 3, 1.5);
    }
    // body + tail
    ctx.fillStyle = COLORS.dragonBody;
    ctx.beginPath();
    ctx.ellipse(x + 8, y + 4, 6, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(x, y + 4);
    ctx.lineTo(x + 4, y + 2);
    ctx.lineTo(x + 4, y + 6);
    ctx.closePath();
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.arc(x + 14, y + 3, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.dragonEye;
    ctx.fillRect(x + 15, y + 1.5, 1.2, 1.2);
  }

  function rectsOverlap(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  function update(dt) {
    timeAlive += dt;
    speed = Math.min(BASE_SPEED + timeAlive * ACCEL_PER_FRAME, MAX_SPEED);

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

    // dragon wing-flap animation
    wingTimer += dt;
    if (wingTimer > 6) {
      wingTimer = 0;
      wingFrame = wingFrame === 0 ? 1 : 0;
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
      const obox = { x: o.x, y: o.y, w: o.w, h: o.h };
      if (rectsOverlap(hitbox, obox)) {
        endGame();
        break;
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);
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
    render();
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
  // overlay sits directly on top of the canvas, so taps on the "başla" text
  // hit the overlay first — listen here too or mobile taps go nowhere
  overlay.addEventListener("click", handleInput);
  overlay.addEventListener(
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
