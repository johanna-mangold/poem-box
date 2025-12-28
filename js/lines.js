// lines.js
(() => {
  // =========================
  // EDIT HERE
  // =========================
  const CONNECTIONS = [
   { id:"l1", pts: [ [-80,-40], [-242,-125], [-242,-642], [-76,-642] ] },
    { id:"l2", pts: [ [500,200], [500,870] ] },
    { id:"l3", pts: [ [390,-180], [390,-600], [1820,-600] ] },
  ];

  const LINES = {
    color: "rgba(28,1,224,1)",

    width: 2.2,
    dash:  [8, 16],
    cap:   "round",
    join:  "round",
    dashScaleWithZoom: false,
    debug: false
  };

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

  // ✅ wichtig: Canvas ganz oben (über shade) – safe, auch wenn HTML Reihenfolge anders ist
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
  // STATE: wir merken uns den letzten Transform
  // =========================
  let TR = { x: 0, y: 0, scale: 1 };

  // World->Screen mit aktuellem Transform
  function worldToScreen(wx, wy){
    const s = TR.scale ?? 1;
    return { x: wx * s + TR.x, y: wy * s + TR.y };
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

  resize();
  setTimeout(resize, 50);
  setTimeout(resize, 250);
  setTimeout(resize, 900);

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

    if (LINES.debug){
      ctx.fillStyle = "rgba(255,0,0,0.35)";
      ctx.fillRect(10,10,220,46);
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      ctx.font = "12px Roboto Mono, monospace";
      ctx.fillText(`TR x:${TR.x.toFixed(0)} y:${TR.y.toFixed(0)}`, 18, 38);
    }

    ctx.strokeStyle = LINES.color;
    ctx.lineWidth   = LINES.width;
    ctx.lineCap     = LINES.cap;
    ctx.lineJoin    = LINES.join;

    const scale = TR.scale ?? 1;
    const dash = LINES.dashScaleWithZoom ? LINES.dash.map(v => v * scale) : LINES.dash;
    ctx.setLineDash(dash);

    for (const c of CONNECTIONS){
      if (!c?.pts || c.pts.length < 2) continue;

      ctx.beginPath();
      const p0 = worldToScreen(c.pts[0][0], c.pts[0][1]);
      ctx.moveTo(p0.x, p0.y);

      for (let i=1; i<c.pts.length; i++){
        const p = worldToScreen(c.pts[i][0], c.pts[i][1]);
        ctx.lineTo(p.x, p.y);
      }
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }

  // =========================
  // HOOK INTO KMAP (THIS is the important part)
  // =========================
  function hook(){
    const KMAP = window.KMAP;
    if (!KMAP || typeof KMAP.onApply !== "function") return false;

    // ✅ initial transform übernehmen, falls schon vorhanden
    if (KMAP.transform) TR = { ...TR, ...KMAP.transform };

    // ✅ bei JEDEM applyTransform: Transform updaten + redraw
    KMAP.onApply((t) => {
      if (t && isFinite(t.x) && isFinite(t.y)) TR = { ...TR, ...t };
      draw();
    });

    // einmal sofort zeichnen
    draw();
    return true;
  }

  if (!hook()){
    // load-order fallback
    const t0 = performance.now();
    const timer = setInterval(() => {
      if (hook() || (performance.now() - t0) > 5000) clearInterval(timer);
    }, 50);
  }

  // Optional: manuelles redraw
  window.redrawConnectionLines = draw;
})();
