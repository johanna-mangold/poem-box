(() => {
  const KMAP = window.KMAP;
  if (!KMAP?.viewport) return;

  const viewport = KMAP.viewport;

  // ---------- Overlay DOM ----------
  const overlay = document.createElement("div");
  overlay.id = "coordOverlay";
  Object.assign(overlay.style, {
    position: "absolute",
    inset: "0",
    pointerEvents: "none",        // KEY: never blocks drag/click
    zIndex: "2147483646"          // below your home button (2147483647)
  });

  const vLine = document.createElement("div");
  const hLine = document.createElement("div");
  const label = document.createElement("div");

  // Lines
  Object.assign(vLine.style, {
    position: "absolute",
    top: "0",
    bottom: "0",
    width: "1px",
    opacity: "0.35",
    background: "rgba(255,255,255,0.55)",
    transform: "translateX(-0.5px)"
  });
  Object.assign(hLine.style, {
    position: "absolute",
    left: "0",
    right: "0",
    height: "1px",
    opacity: "0.35",
    background: "rgba(255,255,255,0.55)",
    transform: "translateY(-0.5px)"
  });

  // Label
  Object.assign(label.style, {
    position: "absolute",
    padding: "6px 8px",
    borderRadius: "8px",
    fontFamily: '"Roboto Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace',
    fontSize: "12px",
    lineHeight: "1.2",
    color: "#fff",
    background: "rgba(0,0,0,0.55)",
    border: "1px solid rgba(255,255,255,0.18)",
    boxShadow: "0 0 14px rgba(0,0,0,0.35)",
    whiteSpace: "nowrap",
    transform: "translate(12px, 12px)"
  });

  overlay.appendChild(vLine);
  overlay.appendChild(hLine);
  overlay.appendChild(label);
  viewport.appendChild(overlay);

  // ---------- Settings you can tweak ----------
  const OPT = {
    showLines: true,
    showLabel: true,
    snap: 1,        // 1px = no snap, 10/25/50 for grid-ish feeling
    clampLabelToViewport: true
  };

  // ---------- Helpers ----------
  function screenToWorld(clientX, clientY){
    // viewport coords
    const r = viewport.getBoundingClientRect();
    const sx = clientX - r.left;
    const sy = clientY - r.top;

    // Your world uses translate3d(state.x, state.y) with origin 0,0.
    // So screen point maps to world: world = screen - state
    const tx = KMAP.state?.x ?? 0;
    const ty = KMAP.state?.y ?? 0;

    const wx = sx - tx;
    const wy = sy - ty;

    return { sx, sy, wx, wy, r };
  }

  function snap(v, step){
    if (!step || step <= 1) return v;
    return Math.round(v / step) * step;
  }

  function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

  let raf = 0;
  let last = null;

  function render(){
    raf = 0;
    if (!last) return;

    const { sx, sy, wx, wy, r } = last;

    if (OPT.showLines){
      vLine.style.display = "";
      hLine.style.display = "";
      vLine.style.left = `${sx}px`;
      hLine.style.top  = `${sy}px`;
    } else {
      vLine.style.display = "none";
      hLine.style.display = "none";
    }

    if (OPT.showLabel){
      label.style.display = "";
      const x = snap(wx, OPT.snap);
      const y = snap(wy, OPT.snap);
      label.textContent = `x ${x.toFixed(0)}  y ${y.toFixed(0)}`;

      // place label near cursor (avoid going off-screen)
      let lx = sx + 12;
      let ly = sy + 12;

      if (OPT.clampLabelToViewport){
        // rough clamp using label size
        const approxW = 110;
        const approxH = 28;
        lx = clamp(lx, 8, r.width - approxW - 8);
        ly = clamp(ly, 8, r.height - approxH - 8);
      }

      label.style.left = `${lx}px`;
      label.style.top  = `${ly}px`;
    } else {
      label.style.display = "none";
    }
  }

  function scheduleRender(){
    if (raf) return;
    raf = requestAnimationFrame(render);
  }

  // ---------- Pointer tracking ----------
  viewport.addEventListener("pointermove", (e) => {
    last = screenToWorld(e.clientX, e.clientY);
    scheduleRender();
  }, { passive: true });

  viewport.addEventListener("pointerleave", () => {
    last = null;
    // hide quickly
    vLine.style.display = "none";
    hLine.style.display = "none";
    label.style.display = "none";
  }, { passive: true });

  // Also update when the map moves (drag/wheel/goTo) even if mouse doesn't move
  // We hook into applyTransform (safe, no core changes)
  if (typeof KMAP.onApply === "function"){
    KMAP.onApply(() => {
      if (!last) return;
      // recompute world coords at last screen position
      const r = viewport.getBoundingClientRect();
      const sx = last.sx;
      const sy = last.sy;
      const tx = KMAP.state?.x ?? 0;
      const ty = KMAP.state?.y ?? 0;
      last = { ...last, r, wx: sx - tx, wy: sy - ty };
      scheduleRender();
    });
  }
})();
