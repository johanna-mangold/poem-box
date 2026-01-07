(() => {
  const viewport = document.getElementById("viewport");
  const world = document.getElementById("world");
  const grid = document.getElementById("grid");
  if (!viewport || !world || !grid) return;

  window.KMAP = window.KMAP || {};
  const KMAP = window.KMAP;

  KMAP.viewport = viewport;
  KMAP.world = world;
  KMAP.grid = grid;

  // Hook-System (lines redraw etc.)
  KMAP._applyHooks = KMAP._applyHooks || [];
  KMAP.onApply = (fn) => { if (typeof fn === "function") KMAP._applyHooks.push(fn); };

  // POI hit-test registry
  KMAP._poiHitTests = KMAP._poiHitTests || [];
  KMAP.registerPOIHitTest = (fn) => { if (typeof fn === "function") KMAP._poiHitTests.push(fn); };
  KMAP.isOnPOI = (target) => KMAP._poiHitTests.some(fn => {
    try { return !!fn(target); } catch(e){ return false; }
  });

  KMAP.stop = (e) => { e.stopPropagation(); };

  /* iOS/iPadOS viewport height fix */
  function setVh(){
    const h = (window.visualViewport && window.visualViewport.height)
      ? window.visualViewport.height
      : window.innerHeight;
    document.documentElement.style.setProperty("--vh", (h * 0.01) + "px");
  }
  setVh();
  window.addEventListener("resize", setVh, {passive:true});
  if (window.visualViewport) window.visualViewport.addEventListener("resize", setVh, {passive:true});

  /* Camera state */
  const START = () => ({
    x: Math.round((window.visualViewport?.width ?? window.innerWidth) * 0.5),
    y: Math.round((window.visualViewport?.height ?? window.innerHeight) * 0.5)
  });

  // Public state used by other modules + goTo
  const s0 = START();
  KMAP.state = KMAP.state || { x: s0.x, y: s0.y, scale: 1 };

  let dragging = false;
  let lastX = 0, lastY = 0;
  let vx = 0, vy = 0;

  // Home animation
  let animating = false;
  let animFrom = { x: 0, y: 0, scale: 1 };
  let animTo   = { x: 0, y: 0, scale: 1 };
  let animT0 = 0;
  let animDur = 850;

  function easeOutCubic(t){ return 1 - Math.pow(1 - t, 3); }

  // Exported applyTransform: THE single source of truth for transforms
  function applyTransform(){
    const x = KMAP.state.x;
    const y = KMAP.state.y;
    const scale = KMAP.state.scale ?? 1;

    // Currently you don't use scale visually. Keep it here for future zoom.
    // If you ever want real zoom, change to: `translate3d(x,y,0) scale(scale)`
    world.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    grid.style.backgroundPosition = `${x}px ${y}px`;

    // shared transform object for hooks (keep compatible)
    KMAP.transform = { x, y, scale };

    for(const fn of KMAP._applyHooks) {
      try { fn(KMAP.transform); } catch(e){}
    }
  }
  KMAP.applyTransform = applyTransform;

  // Initial render
  applyTransform();

  /* =========================================================
     NEW: init MapTexts (plain text) even if scripts load late
     ========================================================= */

  function ensureTextsLayer(){
    let layer = document.getElementById("mapTextLayer");
    if (layer) return layer;

    layer = document.createElement("div");
    layer.id = "mapTextLayer";
    world.appendChild(layer);

    Object.assign(layer.style, {
      position: "absolute",
      left: "0px",
      top: "0px",
      width: "0px",
      height: "0px",
      zIndex: "30",
      pointerEvents: "none"
    });

    return layer;
  }

  function applyTextStyle(el, t, defaults){
    const fontFamily = t.fontFamily ?? defaults.fontFamily ?? '"Roboto Mono", monospace';
    const fontSize = (t.fontSize ?? defaults.fontSize ?? 16);
    const color = t.color ?? defaults.color ?? "rgba(254,252,247,.85)";
    const lineHeight = (t.lineHeight ?? defaults.lineHeight ?? 1.25);
    const letterSpacing = t.letterSpacing ?? defaults.letterSpacing ?? "0px";
    const textTransform = t.textTransform ?? defaults.textTransform ?? "none";
    const opacity = (t.opacity ?? defaults.opacity ?? 1);
    const maxWidth = (t.maxWidth ?? defaults.maxWidth ?? null);
    const align = (t.align ?? defaults.align ?? "left");
    const zIndex = (t.zIndex ?? defaults.zIndex ?? 30);
    const rotate = (t.rotate ?? defaults.rotate ?? 0);
    const textShadow = (t.textShadow ?? defaults.textShadow ?? "none");
    const pointerEvents = (t.pointerEvents ?? defaults.pointerEvents ?? "none");

    Object.assign(el.style, {
      position: "absolute",
      left: (Number(t.x) || 0) + "px",
      top: (Number(t.y) || 0) + "px",
      transform: rotate ? `rotate(${rotate}deg)` : "none",
      transformOrigin: "0 0",
      fontFamily,
      fontSize: fontSize + "px",
      lineHeight: String(lineHeight),
      letterSpacing,
      textTransform,
      color,
      opacity: String(opacity),
      whiteSpace: "pre-wrap",
      textAlign: align,
      pointerEvents,
      zIndex: String(zIndex),
      textShadow
    });

    if (maxWidth != null && maxWidth !== "" && !Number.isNaN(Number(maxWidth))){
      el.style.maxWidth = Number(maxWidth) + "px";
    } else {
      el.style.maxWidth = "";
    }

    /* ===================== NEW: clickable goto ===================== */
    // reset interactivity every time (so refresh doesn't stack handlers)
    el.style.cursor = "";
    el.onclick = null;
    el.onmouseenter = null;
    el.onmouseleave = null;
    el.onpointerdown = null;

    if (t.goto) {
      // allow interaction for this one text item
      el.style.pointerEvents = "auto";
      el.style.cursor = t.cursor ?? "pointer";

      // prevent map-drag from starting when pressing on the text
      el.onpointerdown = (e) => {
        try { e.stopPropagation(); } catch(e){}
      };

      el.onclick = (e) => {
        try { e.preventDefault(); e.stopPropagation(); } catch(e){}
        const g = t.goto;
        if (!g) return;
        KMAP.goTo(g.x, g.y, g.zoom ?? null);
      };

      if (t.hoverColor) {
        el.onmouseenter = () => { el.style.color = t.hoverColor; };
        el.onmouseleave = () => { el.style.color = color; };
      }
    }
    /* =================== END NEW: clickable goto =================== */
  }

  function createOrUpdateMapTexts(){
    const cfg = window.KMAP?.config || {};
    const items = cfg.MAP_TEXTS || [];
    const defaults = cfg.MAP_TEXTS_STYLE || {};

    const layer = ensureTextsLayer();

    // index existing
    const existing = new Map();
    layer.querySelectorAll("[data-maptext]").forEach(el => {
      existing.set(el.getAttribute("data-maptext"), el);
    });

    const seen = new Set();

    for (const t of items){
      if (!t) continue;
      const id = String(t.id ?? "");
      if (!id) continue;
      seen.add(id);

      let el = existing.get(id);
      if (!el){
        el = document.createElement("div");
        el.setAttribute("data-maptext", id);
        layer.appendChild(el);
      }

      el.textContent = String(t.text ?? "");
      applyTextStyle(el, t, defaults);
    }

    // remove old
    for (const [id, el] of existing.entries()){
      if (!seen.has(id)) el.remove();
    }
  }

  // expose so you can hot-reload / call from console if you want
  KMAP.refreshMapTexts = () => {
    try { createOrUpdateMapTexts(); } catch(e){}
  };

  function initMapTextsWhenReady(){
    let done = false;

    function tryInit(){
      if (done) return true;
      // config can arrive slightly later on Wix
      const cfg = window.KMAP?.config;
      if (!cfg) return false;

      try { createOrUpdateMapTexts(); } catch(e){}
      done = true;
      return true;
    }

    if (tryInit()) return;

    const t0 = performance.now();
    const timer = setInterval(() => {
      if (tryInit() || (performance.now() - t0) > 5000) clearInterval(timer);
    }, 50);
  }
  initMapTextsWhenReady();

  /* ======================= END NEW ======================= */

  /* =========================================================
     NEW: init TextBoxes even if textBox.js loads AFTER map-core
     ========================================================= */
  function initTextBoxesWhenReady(){
    let done = false;

    function tryInit(){
      if (done) return true;
      if (typeof window.createTextBoxes === "function"){
        try { window.createTextBoxes(KMAP.world); } catch(e){}
        done = true;
        return true;
      }
      return false;
    }

    // try now
    if (tryInit()) return;

    // keep trying for a short time (covers Wix / slow script load)
    const t0 = performance.now();
    const timer = setInterval(() => {
      if (tryInit() || (performance.now() - t0) > 5000) clearInterval(timer);
    }, 50);
  }
  initTextBoxesWhenReady();
  /* ======================= END NEW ======================= */

  // Home helper
  function goHome(){
    const t = START();
    KMAP.goTo(t.x, t.y, 1, { duration: 420 });
  }

  /* Home Button */
  const homeBtn = document.createElement("button");
  homeBtn.type = "button";
  homeBtn.setAttribute("aria-label", "back to start");
  homeBtn.title = "back to start";
  Object.assign(homeBtn.style, {
    position: "absolute",
    left: "50%",
    bottom: "calc(18px + env(safe-area-inset-bottom))",
    transform: "translateX(-50%)",
    width: "14px",
    height: "14px",
    borderRadius: "999px",
    border: "0",
    padding: "0",
    background: "#fff",
    opacity: "0.9",
    cursor: "pointer",
    zIndex: "2147483647",
    boxShadow: "0 0 0 7px rgba(255,255,255,0.10), 0 0 18px rgba(255,255,255,0.35)",
    outline: "none"
  });
  homeBtn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    goHome();
  });
  viewport.appendChild(homeBtn);

  function onDown(x, y){
    animating = false;
    dragging = true;
    lastX = x; lastY = y;
    vx = vy = 0;
  }

  function onMove(x, y){
    if(!dragging) return;
    const dx = x - lastX;
    const dy = y - lastY;
    lastX = x; lastY = y;

    KMAP.state.x += dx;
    KMAP.state.y += dy;

    vx = dx; vy = dy;
    applyTransform();
  }

  function onUp(){
    dragging = false;
  }

  // pointer drag (ignore POIs unless ALT)
  viewport.addEventListener("pointerdown", (e) => {
    if (e.target === homeBtn) return;

    const onPOI = KMAP.isOnPOI(e.target);
    if (onPOI && !e.altKey) return;

    e.preventDefault();
    viewport.setPointerCapture(e.pointerId);
    onDown(e.clientX, e.clientY);
  }, { passive: false });

  viewport.addEventListener("pointermove", (e) => {
    if(!dragging) return;
    e.preventDefault();
    onMove(e.clientX, e.clientY);
  }, { passive: false });

  viewport.addEventListener("pointerup", (e) => { e.preventDefault(); onUp(); }, { passive: false });
  viewport.addEventListener("pointercancel", onUp, { passive: true });

  // wheel always moves map
  viewport.addEventListener("wheel", (e) => {
    e.preventDefault();
    animating = false;

    KMAP.state.x -= e.deltaX;
    KMAP.state.y -= e.deltaY;

    vx = -e.deltaX;
    vy = -e.deltaY;

    applyTransform();
  }, { passive:false });

  // Public goTo API
  KMAP.goTo = function(x, y, zoom = null, opts = {}) {
    animating = true;
    animT0 = performance.now();
    animDur = opts.duration ?? 850;

    animFrom = {
      x: KMAP.state.x,
      y: KMAP.state.y,
      scale: KMAP.state.scale ?? 1
    };

    animTo = {
      x: Number(x) || 0,
      y: Number(y) || 0,
      scale: (zoom == null) ? (KMAP.state.scale ?? 1) : (Number(zoom) || 1)
    };

    // stop inertia so it doesn't fight the animation
    vx = vy = 0;
    dragging = false;
  };

  function tick(ts){
    requestAnimationFrame(tick);

    if (animating){
      const t = Math.min(1, (ts - animT0) / animDur);
      const k = easeOutCubic(t);

      KMAP.state.x = animFrom.x + (animTo.x - animFrom.x) * k;
      KMAP.state.y = animFrom.y + (animTo.y - animFrom.y) * k;
      KMAP.state.scale = animFrom.scale + (animTo.scale - animFrom.scale) * k;

      applyTransform();

      if (t >= 1){
        animating = false;
      }
      return;
    }

    if (dragging) return;

    // inertia
    vx *= 0.90;
    vy *= 0.90;
    if (Math.abs(vx) < 0.01 && Math.abs(vy) < 0.01) return;

    KMAP.state.x += vx;
    KMAP.state.y += vy;
    applyTransform();
  }
  requestAnimationFrame(tick);

  // viewport.addEventListener("dblclick", () => goHome());
})();
