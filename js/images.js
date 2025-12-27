(() => {
  const KMAP = window.KMAP;
  const cfg = KMAP?.config;
  if (!KMAP || !cfg) return;

  const imageLayer = document.getElementById("imageLayer");
  if (!imageLayer) return;

  // Click vs Drag guard
  const DRAG_PX = 6;
  const DRAG_MS = 450;

  // Active pointer tracking (so we still get "click" even if map captures pointer)
  const active = new Map(); // pointerId -> { item, downX, downY, downT }

  // Global pointerup capture: robust against stopPropagation / pointer capture in map-core
  function onGlobalPointerUp(e) {
    const rec = active.get(e.pointerId);
    if (!rec) return;
    active.delete(e.pointerId);

    const dx = Math.abs((e.clientX ?? 0) - rec.downX);
    const dy = Math.abs((e.clientY ?? 0) - rec.downY);
    const dt = performance.now() - rec.downT;

    // If it looks like a drag/hold, do nothing
    if ((dx + dy) >= DRAG_PX || dt > DRAG_MS) return;

    const item = rec.item;

    // PRIORITY: goto > href
    if (item.goto && window.KMAP?.goTo) {
      e.preventDefault();
      e.stopPropagation();
      const g = item.goto || {};
      window.KMAP.goTo(g.x ?? 0, g.y ?? 0, g.zoom ?? null, { duration: g.duration ?? 900 });
      return;
    }

    if (item.href) {
      e.preventDefault();
      e.stopPropagation();
      window.open(item.href, item.target || "_blank", "noopener,noreferrer");
    }
  }

  function onGlobalPointerCancel(e) {
    active.delete(e.pointerId);
  }

  // Capture-phase listeners on window (important)
  window.addEventListener("pointerup", onGlobalPointerUp, true);
  window.addEventListener("pointercancel", onGlobalPointerCancel, true);

  function renderMapImages() {
    imageLayer.innerHTML = "";

    const list = Array.isArray(cfg.MAP_IMAGES) ? cfg.MAP_IMAGES : [];
    for (const item of list) {
      if (!item || !item.src) continue;

      const wrap = document.createElement("div");
      wrap.className = "mapImg";

      const x = (item.x ?? 0);
      const y = (item.y ?? 0);
      const w = (item.w ?? 240);
      const rot = (item.rot ?? 0);
      const op = (item.op ?? 1);

      wrap.style.setProperty("--x", `${x}px`);
      wrap.style.setProperty("--y", `${y}px`);
      wrap.style.setProperty("--w", `${w}px`);
      wrap.style.setProperty("--rot", `${rot}deg`);
      wrap.style.setProperty("--op", `${op}`);

      const img = document.createElement("img");
      img.alt = item.alt ?? "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = item.src;

      wrap.appendChild(img);
      imageLayer.appendChild(wrap);

      const hasGoto = !!item.goto;
      const hasHref = !!item.href;

      if (!hasGoto && !hasHref) {
        // keep it non-interactive so map drag is clean
        wrap.style.pointerEvents = "none";
        continue;
      }

      // interactive
      wrap.style.pointerEvents = "auto";
      wrap.style.cursor = "pointer";

      // Record pointerdown (do NOT stop propagation; user can still drag the map)
      wrap.addEventListener(
        "pointerdown",
        (e) => {
          active.set(e.pointerId, {
            item,
            downX: e.clientX ?? 0,
            downY: e.clientY ?? 0,
            downT: performance.now()
          });
        },
        { passive: true }
      );
    }
  }

  renderMapImages();
})();
