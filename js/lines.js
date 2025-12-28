// lines.js
(() => {
  // =========================
  // 1) EDIT ONLY HERE
  // =========================
  const CONNECTIONS = [
    { id: "l1", pts: [[0, 0], [200, 120], [420, -30]] },
    { id: "l2", pts: [[420, -30], [680, 120], [1220, 40]] },
    // { id:"l3", pts: [[900,-420],[1220,40]] },
  ];

  const LINES = {
    color: "rgba(255,255,255,0.92)", // etwas stärker -> sicher sichtbar
    width: 2.2,                      // etwas dicker -> sicher sichtbar
    dash: [10, 10],
    cap: "round",
    join: "round",
    dashScaleWithZoom: false,

    // Debug: zeigt roten Block oben links, um zu checken ob Canvas sichtbar ist
    debug: false
  };

  // =========================
  // 2) FIND / CREATE CANVAS
  // =========================
  const viewport = document.getElementById("viewport");
  if (!viewport) {
    console.warn("[lines.js] #viewport not found.");
    return;
  }

  let canvas = document.getElementById("linesCanvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.id = "linesCanvas";
    viewport.appendChild(canvas); // ✅ am Ende -> über shade
  } else {
    // ✅ sicherstellen: Canvas ist wirklich das letzte Child (über shade)
    viewport.appendChild(canvas);
  }

  // ✅ harte Styles, damit nix drüber liegt
  Object.assign(canvas.style, {
    position: "absolute",
    inset: "0",
    width: "100%",
    height: "100%",
    pointerEvents: "none",
    zIndex: "2147483646" // knapp unter deinem Home-Button (der hat 2147483647)
  });

  const ctx = canvas.getContext("2d", { alpha: true });

  // =========================
  // 3) TRANSFORM
  // =========================
  const getTransform = () => window.__MAP_TRANSFORM__ || { x: 0, y: 0, scale: 1 };

  const worldToScreen = (wx, wy) => {
    const t = getTransform();
    return { x: wx * t.scale + t.x, y: wy * t.scale + t.y };
  };

  // =========================
  // 4) RESIZE (Wix-safe)
  // =========================
  function resize() {
    const r = viewport.getBoundingClientRect();
    const w = Math.max(1, Math.round(r.width));
    const h = Math.max(1, Math.round(r.height));

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    draw();
  }

  // Wix/Embed: oft ist beim ersten Tick noch 0x0 -> retries helfen enorm
  resize();
  setTimeout(resize, 50);
  setTimeout(resize, 250);
  setTimeout(resize, 800);

  // ResizeObserver auf viewport (best)
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(() => resize());
    ro.observe(viewport);
  }
  window.addEventListener("resize", resize, { passive: true });
  if (window.visualViewport) window.visualViewport.addEventListener("resize", resize, { passive: true });

  // =========================
  // 5) DRAW
  // =========================
  function draw() {
    const r = viewport.getBoundingClientRect();
    const w = Math.max(1, r.width);
    const h = Math.max(1, r.height);
    ctx.clearRect(0, 0, w, h);

    if (LINES.debug) {
      ctx.fillStyle = "rgba(255,0,0,0.35)";
      ctx.fillRect(10, 10, 140, 44);
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.font = "12px Roboto Mono, monospace";
      ctx.fillText("lines canvas", 18, 38);
    }

    ctx.strokeStyle = LINES.color;
    ctx.lineWidth = LINES.width;
    ctx.lineCap = LINES.cap;
    ctx.lineJoin = LINES.join;

    const scale = getTransform().scale || 1;
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
  // 6) REDRAW TRIGGERS
  // =========================
  // A) wenn map-core ein Event dispatcht (empfohlen)
  window.addEventListener("map:transform", () => draw());

  // B) fallback: wenn kein Event kommt, redraw per RAF nur bei Änderungen
  let last = { x: null, y: null, s: null };
  function tick() {
    const t = getTransform();
    if (t.x !== last.x || t.y !== last.y || t.scale !== last.s) {
      last = { x: t.x, y: t.y, s: t.scale };
      draw();
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Optional: global, falls du manuell triggern willst
  window.redrawConnectionLines = draw;
})();
