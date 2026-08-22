/*
  Sneaky Kiss Aylo — basit, DOM/CSS tabanlı bir yakalanma oyunu.
  Basılı tuttuğun sürece Aylin ile Berkay öpüşür ve puan kazanırsın;
  turuncu saçlı arkadaşları dönüp bakınca bırakman gerekir, yoksa
  yakalanırsınız. Sadece oyun/sneaky-kiss-aylo/index.html sayfasında çalışır.
*/

document.addEventListener("DOMContentLoaded", () => {
  const stage = document.getElementById("kiss-stage");
  if (!stage) return;

  const overlay = document.getElementById("kiss-overlay");
  const scoreEl = document.getElementById("kiss-score");
  const bestEl = document.getElementById("kiss-best");
  const couple = document.getElementById("couple");
  const watcher = document.getElementById("watcher");

  // sabit, cömert süreler — "çok hızlı" hissettirmemesi için
  const AWAY_MIN = 2200;
  const AWAY_MAX = 3800;
  const TURNING_MS = 600; // uyarı penceresi — "!" belirir ama henüz tehlikeli değil
  const LOOKING_MIN = 900;
  const LOOKING_MAX = 1300;
  const HEART_INTERVAL = 420;

  let bestScore = 0;
  try {
    bestScore = parseInt(localStorage.getItem("kiss-game-best-score"), 10) || 0;
  } catch (e) {
    bestScore = 0;
  }
  bestEl.textContent = `EN İYİ: ${bestScore}`;

  let state = "ready"; // "ready" | "running" | "over"
  let kissing = false;
  let score = 0;
  let watcherPhase = "away";
  let phaseUntil = 0;
  let heartTimer = null;
  let tickTimer = null;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function now() {
    return performance.now ? performance.now() : Date.now();
  }

  function setWatcherPhase(phase) {
    watcherPhase = phase;
    watcher.classList.remove("turning", "looking");
    if (phase === "turning" || phase === "looking") {
      watcher.classList.add(phase);
    }
    if (phase === "away") {
      phaseUntil = now() + rand(AWAY_MIN, AWAY_MAX);
    } else if (phase === "turning") {
      phaseUntil = now() + TURNING_MS;
    } else {
      phaseUntil = now() + rand(LOOKING_MIN, LOOKING_MAX);
    }
  }

  function advanceWatcher() {
    if (watcherPhase === "away") setWatcherPhase("turning");
    else if (watcherPhase === "turning") setWatcherPhase("looking");
    else setWatcherPhase("away");
  }

  function setKissing(value) {
    if (state !== "running" || kissing === value) return;
    kissing = value;
    couple.classList.toggle("kissing", value);
    if (value) {
      spawnHeart();
      heartTimer = setInterval(spawnHeart, HEART_INTERVAL);
    } else if (heartTimer) {
      clearInterval(heartTimer);
      heartTimer = null;
    }
  }

  function spawnHeart() {
    const heart = document.createElement("span");
    heart.className = "kiss-heart";
    heart.textContent = "💜";
    heart.style.left = 46 + rand(-14, 14) + "%";
    heart.style.bottom = "90px";
    stage.appendChild(heart);
    setTimeout(() => heart.remove(), 1600);
  }

  function resetGame() {
    score = 0;
    scoreEl.textContent = "SKOR: 0";
    kissing = false;
    couple.classList.remove("kissing");
    if (heartTimer) {
      clearInterval(heartTimer);
      heartTimer = null;
    }
    stage.querySelectorAll(".kiss-heart").forEach((h) => h.remove());
    setWatcherPhase("away");
  }

  function startGame() {
    resetGame();
    state = "running";
    overlay.classList.add("hidden");
    if (tickTimer) clearInterval(tickTimer);
    tickTimer = setInterval(tick, 100);
  }

  function endGame() {
    state = "over";
    setKissing(false);
    if (tickTimer) {
      clearInterval(tickTimer);
      tickTimer = null;
    }
    stage.classList.add("game-caught");
    setTimeout(() => stage.classList.remove("game-caught"), 400);

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
      <h3>YAKALANDINIZ! 😳</h3>
      <p>Skor: ${score}${score >= bestScore && score > 0 ? " — Yeni rekor! 🎉" : ""}</p>
      <button id="kiss-restart-btn" class="pixel-btn">TEKRAR OYNA ▶</button>
    `;
    overlay.classList.remove("hidden");
    document.getElementById("kiss-restart-btn").addEventListener("click", startGame);
  }

  function handleStart() {
    if (state === "ready" || state === "over") startGame();
  }

  function tick() {
    if (state !== "running") return;

    if (now() >= phaseUntil) advanceWatcher();

    if (kissing) {
      score += 1;
      scoreEl.textContent = `SKOR: ${score}`;
      if (watcherPhase === "looking") {
        endGame();
      }
    }
  }

  // ---------- girdi ----------

  function pressStart() {
    if (state !== "running") handleStart();
    if (state === "running") setKissing(true);
  }

  stage.addEventListener("pointerdown", pressStart);
  stage.addEventListener("pointerup", () => setKissing(false));
  stage.addEventListener("pointerleave", () => setKissing(false));
  stage.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      pressStart();
    },
    { passive: false }
  );
  stage.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      setKissing(false);
    },
    { passive: false }
  );

  window.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
      e.preventDefault();
      pressStart();
    }
  });
  window.addEventListener("keyup", (e) => {
    if (e.code === "Space") setKissing(false);
  });

  resetGame();
});
