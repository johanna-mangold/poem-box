(() => {
  const KMAP = window.KMAP;
  const cfg = KMAP?.config;
  if (!KMAP || !cfg) return;

  const imageLayer = document.getElementById("imageLayer");
  if (!imageLayer) return;

  // Click vs Drag guard
  const DRAG_PX = 6;
  const DRAG_MS = 450;

  // pointerId -> { item, downX, downY, downT }
  const active = new Map();

  // Capture-phase pointerup so we still see it even if the map captures pointers.
  // IMPORTANT: Do NOT preventDefault/stopPropagation here, otherwise map-core may get stuck.
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

    // Let map-core finish its pointerup handling first (release drag, etc.)
    requestAnimationFrame(() => {
      // PRIORITY: goto > href
      if (item.goto && window.KMAP?.goTo) {
        const g = item.goto || {};
        window.KMAP.goTo(g.x ?? 0, g.y ?? 0, g.zoom ?? null, { duration: g.duration ?? 900 });
        return;
      }

      if (item.href) {
        const target = item.target || "_blank";
        window.open(item.href, target, "noopener,noreferrer");
      }
    });
  }

  function onGlobalPointerCancel(e) {
    active.delete(e.pointerId);
  }

  window.addEventListener("pointerup", onGlobalPointerUp, true);
  window.addEventListener("pointercancel", onGlobalPointerCancel, true);

  // ----------------------------
  // Jump-on-hover helpers (NEW)
  // ----------------------------
  function setWrapFromItem(wrap, item) {
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
  }

  function jumpItem(item, wrap) {
    const range = Number.isFinite(item.jumpRange) ? item.jumpRange : 300;
    const minMove = Number.isFinite(item.jumpMinMove) ? item.jumpMinMove : 24;

    // Cooldown
    const now = performance.now();
    const cooldown = Number.isFinite(item.jumpCooldownMs) ? item.jumpCooldownMs : 250;
    if (item._lastJumpTs && (now - item._lastJumpTs) < cooldown) return;

    let dx = 0, dy = 0;
    // Avoid tiny “jumps” that look like nothing
    for (let i = 0; i < 12; i++) {
      dx = (Math.random() * 2 - 1) * range;
      dy = (Math.random() * 2 - 1) * range;
      if (Math.abs(dx) >= minMove || Math.abs(dy) >= minMove) break;
    }

    item.x = (item.x ?? 0) + dx;
    item.y = (item.y ?? 0) + dy;

    item._lastJumpTs = now;
    setWrapFromItem(wrap, item);
  }

  function renderMapImages() {
    imageLayer.innerHTML = "";

    const list = Array.isArray(cfg.MAP_IMAGES) ? cfg.MAP_IMAGES : [];
    for (const item of list) {
      if (!item || !item.src) continue;

      const wrap = document.createElement("div");
      wrap.className = "mapImg";

      // existing positioning
      setWrapFromItem(wrap, item);

      const img = document.createElement("img");
      img.alt = item.alt ?? "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = item.src;

      wrap.appendChild(img);
      imageLayer.appendChild(wrap);

      const hasGoto = !!item.goto;
      const hasHref = !!item.href;

      // NEW: jumpOnHover should be interactive (needs pointer events)
      const hasJump = !!item.jumpOnHover;

      if (!hasGoto && !hasHref && !hasJump) {
        // non-interactive images should not interfere with pan
        wrap.style.pointerEvents = "none";
        continue;
      }

      wrap.style.pointerEvents = "auto";

      // Cursor behavior: keep exactly as before for clickable items,
      // and set pointer for jump-only so user notices it.
      if (hasGoto || hasHref) {
        wrap.style.cursor = "pointer";
      } else if (hasJump) {
        wrap.style.cursor = "pointer";
      }

      // Record pointerdown, but do not block propagation;
      // map-core can still start drag if user drags.
      wrap.addEventListener("pointerdown", (e) => {
        // IMPORTANT: only for clickables (goto/href). Jump-only images shouldn't be treated as clicks.
        if (!hasGoto && !hasHref) return;

        active.set(e.pointerId, {
          item,
          downX: e.clientX ?? 0,
          downY: e.clientY ?? 0,
          downT: performance.now()
        });
      }, { passive: true });

      // NEW: Jump on hover-enter (does not block map panning)
      if (hasJump) {
        wrap.addEventListener("pointerenter", () => {
          jumpItem(item, wrap);
        }, { passive: true });
      }
    }
  }

  renderMapImages();
})();
