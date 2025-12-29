// lines.js
(() => {
  // =========================
  // DOM
  // =========================
  const viewport = document.getElementById("viewport");
  if (!viewport) return;

  let canvas = document.getElementById("linesCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "linesCanvas";
    viewport.appendChild(canvas);
  }

  // canvas immer ganz oben im viewport lassen
  viewport.appendChild(canvas);

  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "2147483646"
  });

  const ctx = canvas.getContext("2d", { alpha: true });

  // =========================
  // DEFAULTS (fallback wenn config fehlt)
  // =========================
  const DEFAULT_CONNECTIONS = [];
  const DEFAULT_LINES = {
    color: "rgba(255,255,255,0.45)",
    width: 1.6,
    dash: [10, 16],
    cap: "round",
    join: "round",
    dashScaleWithZoom: false,
    debug: false
  };

  // =========================
  // STATE
  // =========================
  let TR = { x: 0, y: 0, scale: 1 };

  // world->screen using current camera transform
  function worldToScreen(wx, wy){
    return { x: wx + (TR.x || 0), y: wy + (TR.y || 0) };
  }

  function getConfig(){
    const cfg = window.KMAP?.config || {};
    const connections = Array.isArray(cfg.CONNECTIONS) ? cfg.CONNECTIONS : DEFAULT_CONNECTIONS;
    const style = (cfg.LINES && typeof cfg.LINES === "object") ? cfg.LINES : DEFAULT_LINES;
    return { connections, style };
  }

  // =========================
  // RESIZE
  // =========================
  function resize(){
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

  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(viewport);
  window.addEventListener("resize", resize, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize, { passive: true });

  // =========================
  // DRAW
  // =========================
  function draw(){
    const r = viewport.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    ctx.clearRect(0, 0, w, h);

    const { connections, style } = getConfig();

    // debug overlay
    if (style.debug){
      ctx.fillStyle = "rgba(255,0,0,0.25)";
      ctx.fillRect(10,10,320,62);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "12px Roboto Mono, monospace";
      ctx.fillText(`TR x:${(TR.x||0).toFixed(0)} y:${(TR.y||0).toFixed(0)} scale:${(TR.scale||1).toFixed(2)}`, 18, 34);
      ctx.fillText(`connections: ${connections.length}`, 18, 54);
    }

    ctx.strokeStyle = style.color || DEFAULT_LINES.color;
    ctx.lineWidth   = style.width ?? DEFAULT_LINES.width;
    ctx.lineCap     = style.cap   || DEFAULT_LINES.cap;
    ctx.lineJoin    = style.join  || DEFAULT_LINES.join;

    const scale = TR.scale ?? 1;
    const dashArr = Array.isArray(style.dash) ? style.dash : DEFAULT_LINES.dash;
    const dash = style.dashScaleWithZoom ? dashArr.map(v => v * scale) : dashArr;
    ctx.setLineDash(dash);

    for (const c of connections){
      if (!c?.pts || c.pts.length < 2) continue;

      ctx.beginPath();

      const p0 = worldToScreen(c.pts[0][0], c.pts[0][1]);
      ctx.moveTo(p0.x, p0.y);

      // ✅ Knicke: alle Punkte per lineTo
      for (let i = 1; i < c.pts.length; i++){
        const p = worldToScreen(c.pts[i][0], c.pts[i][1]);
        ctx.lineTo(p.x, p.y);
      }

      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  // =========================
  // HOOK INTO KMAP
  // =========================
  function hook(){
    const KMAP = window.KMAP;
    if (!KMAP || typeof KMAP.onApply !== "function") return false;

    // initial
    if (KMAP.transform) TR = { ...TR, ...KMAP.transform };

    KMAP.onApply((t) => {
      if (t && isFinite(t.x) && isFinite(t.y)){
        TR = { ...TR, ...t };
      }
      draw();
    });

    draw();
    return true;
  }

  // load order fallback
  if (!hook()){
    const t0 = performance.now();
    const timer = setInterval(() => {
      if (hook() || (performance.now() - t0) > 5000) clearInterval(timer);
    }, 50);
  }

  // first resize + redraw
  resize();
  setTimeout(resize, 50);
  setTimeout(resize, 250);
  setTimeout(resize, 900);

  // manual redraw (useful after editing config live)
  window.redrawConnectionLines = draw;
})();
