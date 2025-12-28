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

  function getXY(){
    // flipPOI muss (wie bei deinen anderen POIs) über CSS vars positioniert sein:
    // --x / --y in px
    const cs = getComputedStyle(flipEl);
    const x = parseFloat(cs.getPropertyValue("--x")) || 0;
    const y = parseFloat(cs.getPropertyValue("--y")) || 0;
    return { x, y };
  }

  function setXY(x, y){
    flipEl.style.setProperty("--x", `${x}px`);
    flipEl.style.setProperty("--y", `${y}px`);
  }

  function jump(){
    const now = performance.now();
    if ((now - lastJumpTs) < JUMP_COOLDOWN_MS) return;

    let dx = 0, dy = 0;
    for (let i = 0; i < 12; i++){
      dx = (Math.random() * 2 - 1) * JUMP_RANGE;
      dy = (Math.random() * 2 - 1) * JUMP_RANGE;
      if (Math.abs(dx) >= JUMP_MIN_MOVE || Math.abs(dy) >= JUMP_MIN_MOVE) break;
    }

    const p = getXY();
    setXY(p.x + dx, p.y + dy);

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
