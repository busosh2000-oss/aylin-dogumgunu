/*
  Etkileşim mantığı. İçerik değişiklikleri için bu dosyaya değil,
  js/data.js dosyasına dokunman yeterli.
*/

document.addEventListener("DOMContentLoaded", () => {
  initStartButton();
  initScrollWisteria();
  initWisteriaSway();
  initNavDropdown();
  initGallery();
  initQuiz();
  initLetters();
  initMusic();
});

/* ---------- helpers ---------- */

function spawnConfetti(count = 40) {
  const colors = ["#c77dff", "#e0aaff", "#9d4edd", "#ffd166", "#8a3ffc"];
  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    piece.style.left = Math.random() * 100 + "vw";
    piece.style.background = colors[Math.floor(Math.random() * colors.length)];
    const duration = 2 + Math.random() * 1.5;
    const delay = Math.random() * 0.4;
    piece.style.animationDuration = duration + "s";
    piece.style.animationDelay = delay + "s";
    document.body.appendChild(piece);
    setTimeout(() => piece.remove(), (duration + delay) * 1000 + 200);
  }
}

/* ---------- 1) Start button ---------- */

function initStartButton() {
  const btn = document.getElementById("start-btn");
  const target = document.getElementById("transition");
  if (!btn || !target) return;
  btn.addEventListener("click", () => {
    spawnConfetti(30);
    target.scrollIntoView({ behavior: "smooth" });
  });
}

/* ---------- 2) Scroll-driven wisteria growth ---------- */

function initScrollWisteria() {
  const section = document.getElementById("transition");
  const wisteria = document.getElementById("grow-wisteria");
  if (!section || !wisteria) return;

  let ticking = false;
  let bloomed = false;

  function update() {
    const rect = section.getBoundingClientRect();
    const vh = window.innerHeight;
    let progress = 1 - rect.top / vh;
    progress = Math.min(1, Math.max(0, progress));
    const scale = 0.3 + progress * 0.7;
    wisteria.style.transform = `scale(${scale.toFixed(3)})`;
    wisteria.style.opacity = progress.toFixed(3);
    if (progress >= 1 && !bloomed) {
      bloomed = true;
      spawnConfetti(35);
    } else if (progress < 1 && bloomed) {
      bloomed = false; // allow the confetti to fire again if they scroll back up and return
    }
    ticking = false;
  }

  window.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(update);
      ticking = true;
    }
  });
  update();
}

/* ---------- 2b) Tap/click the wisteria to make it sway ---------- */

function initWisteriaSway() {
  const bunch = document.getElementById("wisteria-bunch");
  if (!bunch) return;

  function sway() {
    bunch.classList.remove("swaying");
    void bunch.offsetWidth; // restart the animation even if clicked mid-sway
    bunch.classList.add("swaying");
  }

  bunch.addEventListener("click", sway);
  bunch.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      sway();
    }
  });
  bunch.addEventListener("animationend", () => bunch.classList.remove("swaying"));
}

/* ---------- 3) Nav dropdown + current-page highlight ---------- */

function initNavDropdown() {
  const dropdown = document.querySelector(".nav-dropdown");
  const toggle = document.getElementById("nav-dropdown-toggle");
  const menu = document.getElementById("nav-dropdown-menu");
  if (!dropdown || !toggle || !menu) return;

  toggle.addEventListener("click", () => {
    dropdown.classList.toggle("open");
  });

  document.addEventListener("click", (e) => {
    if (!dropdown.contains(e.target)) dropdown.classList.remove("open");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") dropdown.classList.remove("open");
  });

  // mark the link matching this page's data-page as active
  const currentPage = document.body.dataset.page;
  if (currentPage) {
    menu.querySelectorAll("a[data-page]").forEach((link) => {
      link.classList.toggle("active", link.dataset.page === currentPage);
    });
  }
}

/* ---------- 4) Gallery — wavy drag-scroll strip ---------- */

function initGallery() {
  const wrap = document.getElementById("wavy-gallery");
  const track = document.getElementById("wavy-track");
  const counter = document.getElementById("wavy-counter");
  if (!wrap || !track || typeof GALLERY_ITEMS === "undefined") return;

  const total = GALLERY_ITEMS.length;
  const cards = [];

  GALLERY_ITEMS.forEach((item, index) => {
    const card = document.createElement("div");
    card.className = "gallery-card pixel-art";
    card.setAttribute("tabindex", "0");

    // deterministic wavy offset + alternating tilt, so the strip reads as an
    // organic curve rather than a straight, uniform row
    const waveY = Math.sin(index * 0.8) * 28;
    const tilt = (index % 2 === 0 ? -7 : 7) + Math.sin(index * 1.7) * 4;
    card.style.transform = `translateY(${waveY.toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`;

    let mediaEl;
    if (item.type === "video") {
      mediaEl = document.createElement("video");
      mediaEl.src = item.src;
      mediaEl.muted = true;
      mediaEl.loop = true;
      mediaEl.playsInline = true;
    } else {
      mediaEl = document.createElement("img");
      mediaEl.src = item.src;
      mediaEl.alt = item.caption || `Aylin anısı ${index + 1}`;
      mediaEl.loading = "lazy";
    }
    card.appendChild(mediaEl);

    if (item.type === "video") {
      const badge = document.createElement("span");
      badge.className = "badge";
      badge.textContent = "▶ VIDEO";
      card.appendChild(badge);
    }

    if (item.caption) {
      const caption = document.createElement("div");
      caption.className = "caption";
      caption.textContent = item.caption;
      card.appendChild(caption);
    }

    card.addEventListener("click", () => {
      const wasActive = card.classList.contains("active");
      track.querySelectorAll(".gallery-card.active").forEach((el) => el.classList.remove("active"));
      if (!wasActive) {
        card.classList.add("active");
        card.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
        if (item.type === "video" && mediaEl.play) {
          mediaEl.play().catch(() => {});
        }
      }
    });

    track.appendChild(card);
    cards.push(card);
  });

  // drag-to-scroll (mouse + touch via pointer events)
  let isDragging = false;
  let startX = 0;
  let startScroll = 0;

  wrap.addEventListener("pointerdown", (e) => {
    isDragging = true;
    wrap.classList.add("dragging");
    startX = e.clientX;
    startScroll = wrap.scrollLeft;
    wrap.setPointerCapture(e.pointerId);
  });

  wrap.addEventListener("pointermove", (e) => {
    if (!isDragging) return;
    wrap.scrollLeft = startScroll - (e.clientX - startX);
  });

  function endDrag() {
    isDragging = false;
    wrap.classList.remove("dragging");
  }
  wrap.addEventListener("pointerup", endDrag);
  wrap.addEventListener("pointercancel", endDrag);

  // let a normal mouse wheel scroll the strip horizontally too
  wrap.addEventListener(
    "wheel",
    (e) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        wrap.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    },
    { passive: false }
  );

  // keep the "X / N" counter in sync with whichever card is centered
  let ticking = false;
  function updateCounter() {
    const center = wrap.scrollLeft + wrap.clientWidth / 2;
    let closestIndex = 0;
    let closestDist = Infinity;
    cards.forEach((card, i) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const dist = Math.abs(cardCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closestIndex = i;
      }
    });
    if (counter) counter.textContent = `${closestIndex + 1} / ${total}`;
    ticking = false;
  }

  wrap.addEventListener("scroll", () => {
    if (!ticking) {
      requestAnimationFrame(updateCounter);
      ticking = true;
    }
  });
  updateCounter();
}

/* ---------- 5) Quiz ---------- */

function initQuiz() {
  const container = document.getElementById("quiz-container");
  if (!container || typeof QUIZ_QUESTIONS === "undefined") return;

  let current = 0;
  let selected = null;
  const answers = [];

  renderQuestion();

  function renderQuestion() {
    const q = QUIZ_QUESTIONS[current];
    selected = null;
    container.innerHTML = "";

    const progress = document.createElement("div");
    progress.className = "quiz-progress";
    progress.textContent = `SORU ${current + 1} / ${QUIZ_QUESTIONS.length}`;
    container.appendChild(progress);

    const questionEl = document.createElement("div");
    questionEl.className = "quiz-question";
    questionEl.textContent = q.question;
    container.appendChild(questionEl);

    const optionsEl = document.createElement("div");
    optionsEl.className = "quiz-options";
    q.options.forEach((opt, i) => {
      const btn = document.createElement("button");
      btn.className = "quiz-option";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        if (selected !== null) return; // already answered this question
        selected = i;
        const allBtns = optionsEl.querySelectorAll(".quiz-option");
        allBtns.forEach((el) => (el.disabled = true));
        btn.classList.add(i === q.correct ? "correct" : "incorrect");
        if (i !== q.correct) {
          allBtns[q.correct].classList.add("correct");
        }
        nextBtn.disabled = false;
      });
      optionsEl.appendChild(btn);
    });
    container.appendChild(optionsEl);

    const actions = document.createElement("div");
    actions.className = "quiz-actions";
    const nextBtn = document.createElement("button");
    nextBtn.className = "pixel-btn";
    nextBtn.textContent = current === QUIZ_QUESTIONS.length - 1 ? "BİTİR ▶" : "SONRAKİ ▶";
    nextBtn.disabled = true;
    nextBtn.addEventListener("click", () => {
      answers.push(selected === q.correct);
      if (current < QUIZ_QUESTIONS.length - 1) {
        current++;
        renderQuestion();
      } else {
        renderResult();
      }
    });
    actions.appendChild(nextBtn);
    container.appendChild(actions);
  }

  function renderResult() {
    const correctCount = answers.filter(Boolean).length;
    const total = QUIZ_QUESTIONS.length;
    const percent = Math.round((correctCount / total) * 100);
    const tier =
      QUIZ_RESULT_TIERS.find((t) => percent >= t.min) ||
      QUIZ_RESULT_TIERS[QUIZ_RESULT_TIERS.length - 1];

    container.innerHTML = "";
    const result = document.createElement("div");
    result.className = "quiz-result";
    result.innerHTML = `
      <div class="quiz-progress">SONUÇLAR</div>
      <div class="score-big">${correctCount} / ${total} DOĞRU</div>
      <div class="score-message">Puan: %${percent}<br>${tier.message}</div>
    `;
    const retryBtn = document.createElement("button");
    retryBtn.className = "pixel-btn";
    retryBtn.textContent = "TEKRAR DENE";
    retryBtn.addEventListener("click", () => {
      current = 0;
      answers.length = 0;
      renderQuestion();
    });
    result.appendChild(retryBtn);
    container.appendChild(result);
    spawnConfetti(60);
  }
}

/* ---------- 6) Letters ---------- */

function initLetters() {
  const grid = document.getElementById("letters-grid");
  const modal = document.getElementById("letter-modal");
  const modalName = document.getElementById("letter-modal-name");
  const modalText = document.getElementById("letter-modal-text");
  const modalImage = document.getElementById("letter-modal-image");
  const closeBtn = document.getElementById("letter-modal-close");
  if (!grid || typeof LETTERS === "undefined") return;

  LETTERS.forEach((letter) => {
    const envelope = document.createElement("div");
    envelope.className = "envelope";
    envelope.innerHTML = `
      <span class="seal"></span>
      <span class="env-name">✉ ${letter.name}</span>
    `;
    envelope.addEventListener("click", () => {
      envelope.classList.add("opening");
      setTimeout(() => {
        modalName.textContent = `✉ ${letter.name}`;
        modalText.textContent = letter.text;
        if (modalImage) {
          if (letter.image) {
            modalImage.onerror = () => modalImage.classList.add("hidden");
            modalImage.src = letter.image;
            modalImage.alt = `${letter.name} tarafından eklenen görsel`;
            modalImage.classList.remove("hidden");
          } else {
            modalImage.removeAttribute("src");
            modalImage.classList.add("hidden");
          }
        }
        modal.classList.remove("hidden");
        envelope.classList.remove("opening");
      }, 380);
    });
    grid.appendChild(envelope);
  });

  function closeModal() {
    modal.classList.add("hidden");
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });
}

/* ---------- 7) Music ---------- */

function initMusic() {
  const btn = document.getElementById("cassette-btn") || document.querySelector(".cassette-wrap");
  if (!btn || typeof SPOTIFY_PLAYLIST_URL === "undefined") return;
  btn.closest(".cassette-wrap").addEventListener("click", () => {
    window.open(SPOTIFY_PLAYLIST_URL, "_blank", "noopener");
  });
}
