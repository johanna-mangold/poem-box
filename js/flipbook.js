(() => {
  const KMAP = window.KMAP;
  if (!KMAP) return;

  const flipEl = document.getElementById("flipPOI");
  if (!flipEl) return;

  // ----------------------------
  // Jump settings
  // ----------------------------
  const JUMP_RANGE = 300;
  const JUMP_COOLDOWN_MS = 250;
  const JUMP_MIN_MOVE = 24;

  let lastJumpTs = 0;

  function getLT() {
    // Prefer inline style if present, otherwise computed style
    const cs = getComputedStyle(flipEl);

    const left = parseFloat(flipEl.style.left || cs.left) || 0;
    const top  = parseFloat(flipEl.style.top  || cs.top)  || 0;

    return { left, top };
  }

  function setLT(left, top) {
    flipEl.style.left = `${left}px`;
    flipEl.style.top  = `${top}px`;
  }

  function jump() {
    const now = performance.now();
    if ((now - lastJumpTs) < JUMP_COOLDOWN_MS) return;

    let dx = 0, dy = 0;

    // avoid tiny jumps
    for (let i = 0; i < 12; i++) {
      dx = (Math.random() * 2 - 1) * JUMP_RANGE;
      dy = (Math.random() * 2 - 1) * JUMP_RANGE;
      if (Math.abs(dx) >= JUMP_MIN_MOVE || Math.abs(dy) >= JUMP_MIN_MOVE) break;
    }

    const p = getLT();
    setLT(p.left + dx, p.top + dy);

    lastJumpTs = now;
  }

  // ----------------------------
  // Animation trigger (wie bei dir)
  // ----------------------------
  let flipTimer = null;
  const startFlipMoment = () => {
    flipEl.classList.add("isAnimating");
    clearTimeout(flipTimer);
    flipTimer = setTimeout(() => flipEl.classList.remove("isAnimating"), 1200);
  };

  // Hover-enter: spring + animate
  flipEl.addEventListener("pointerenter", () => {
    jump();
    startFlipMoment();
  }, { passive: true });

  // Optional: auch bei click/tap animieren (ohne map zu blocken)
  flipEl.addEventListener("pointerdown", () => {
    startFlipMoment();
  }, { passive: true });
})();
