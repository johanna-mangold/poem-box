// lines.js
(() => {
  // =========================
  // EDIT ONLY HERE
  // =========================
  const CONNECTIONS = [
    { id:"l1", pts: [ [0,0], [200,120], [420,-30] ] },
    { id:"l2", pts: [ [420,-30], [680,120], [1220,40] ] },
    // { id:"l3", pts: [ [900,-420], [1220,40] ] },
  ];

  const LINES = {
    color: "rgba(255,255,255,0.90)",
    width: 2.2,
    dash:  [10, 10],
    cap:   "round",
    join:  "round",
    dashScaleWithZoom: false,

    // true = rotes Debug-Label oben links
    debug: false
  };

  // =========================
  // GET VIEWPORT + CREATE CANVAS (ALWAYS ON TOP)
  // =========================
  const viewport = document.getElementById("viewport");
  if (!viewport) return;

  let canvas = document.getElementById("linesCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "linesCanvas";
  }

  // ✅ IMPORTANT: append again so it becomes LAST child -> above #shade
  viewport.appendChild(canvas);

  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    // ✅ always above shade/grid, below your home button
    zIndex: "2147483646"
  });

  const ctx = canvas.getContext("2d", { alpha: true });

  // =========================
  // TRANSFORM SOURCE (KMAP preferred)
  // =========================
  function getTransform() {
    if (window.KMAP && window.KMAP.transform) return window.KMAP.transform;
    if (window.__MAP_TRANSFORM__) return window.__MAP_TRANSFORM__;
    return { x: 0, y: 0, scale: 1 };
  }

  function worldToScreen(wx, wy) {
    const t = getTransform();
    const s = t.scale ?? 1;
    return { x: wx * s + t.x, y: wy * s + t.y };
  }

  // =========================
  // RESIZE (Wix-safe)
  // =========================
  function resize() {
    const r = viewport.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);

    canvas.style.width  = w + "px";
    canvas.style.height = h + "px";

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    draw();
  }

  // Initial + retries (Wix often reports 0x0 for a moment)
  resize();
  setTimeout(resize, 50);
  setTimeout(resize, 250);
  setTimeout(resize, 900);

  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => resize());
    ro.observe(viewport);
  }
  window.addEventListener("resize", resize, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize, { passive: true });

  // =========================
  // DRAW
  // =========================
  function draw() {
    const r = viewport.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    ctx.clearRect(0, 0, w, h);

    if (LINES.debug) {
      ctx.fillStyle = "rgba(255,0,0,0.35)";
      ctx.fillRect(10, 10, 170, 46);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "12px Roboto Mono, monospace";
      ctx.fillText("lines canvas OK", 20, 38);
    }

    ctx.strokeStyle = LINES.color;
    ctx.lineWidth   = LINES.width;
    ctx.lineCap     = LINES.cap;
    ctx.lineJoin    = LINES.join;

    const t = getTransform();
    const scale = t.scale ?? 1;
    const dash = LINES.dashScaleWithZoom ? LINES.dash.map(v => v * scale) : LINES.dash;
    ctx.setLineDash(dash);

    for (const c of CONNECTIONS) {
      if (!c?.pts || c.pts.length < 2) continue;

      ctx.beginPath();
      const p0 = worldToScreen(c.pts[0][0], c.pts[0][1]);
      ctx.moveTo(p0.x, p0.y);

      for (let i = 1; i < c.pts.length; i++) {
        const p = worldToScreen(c.pts[i][0], c.pts[i][1]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  // =========================
  // HOOK INTO MAP CORE
  // =========================
  function hookIntoKMAP() {
    if (window.KMAP && typeof window.KMAP.onApply === "function") {
      window.KMAP.onApply(() => draw());
      return true;
    }
    return false;
  }

  // Try immediately, then retry a bit (covers script load order)
  if (!hookIntoKMAP()) {
    const t0 = performance.now();
    const timer = setInterval(() => {
      if (hookIntoKMAP() || (performance.now() - t0) > 5000) clearInterval(timer);
    }, 50);
  }

  // Backup: listen to the custom event (in case hooks miss)
  window.addEventListener("map:transform", () => draw());

  // Backup #2: RAF change-detect (cheap)
  let last = { x: null, y: null, s: null };
  function tick() {
    const tr = getTransform();
    if (tr.x !== last.x || tr.y !== last.y || tr.scale !== last.s) {
      last = { x: tr.x, y: tr.y, s: tr.scale };
      draw();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Optional manual trigger
  window.redrawConnectionLines = draw;
})();
