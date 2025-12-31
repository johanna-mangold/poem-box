(() => {
  const KMAP = window.KMAP;
  const cfg = KMAP?.config;
  if (!KMAP || !cfg) return;

  const imageLayer = document.getElementById("imageLayer");
  if (!imageLayer) return;

  // ============================
  // NEW: separate layer for jump images (always reachable)
  // ============================
  const world =
    KMAP.world ||
    document.getElementById("world") ||
    imageLayer.parentElement;

  let jumpLayer = document.getElementById("jumpImageLayer");
  if (!jumpLayer) {
    jumpLayer = document.createElement("div");
    jumpLayer.id = "jumpImageLayer";
    Object.assign(jumpLayer.style, {
      position: "absolute",
      left: "0",
      top: "0",
      width: "0",
      height: "0",
      pointerEvents: "none",   // layer itself ignores input
      zIndex: "9999"           // above your POIs inside #world
    });
    world.appendChild(jumpLayer);
  }

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
  // Jump-on-hover helpers
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

  // apply flip state to the <img> inside wrap (no CSS changes needed)
  function applyFlipFromItem(wrap, item) {
    const imgEl = wrap.querySelector("img");
    if (!imgEl) return;

    const flip = (item._flipX === -1) ? -1 : 1;
    imgEl.style.transformOrigin = "50% 50%";
    imgEl.style.transform = `scaleX(${flip})`;
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

    // mirror horizontally depending on movement direction (X axis)
    if (dx !== 0) item._flipX = dx < 0 ? -1 : 1;

    item.x = (item.x ?? 0) + dx;
    item.y = (item.y ?? 0) + dy;

    item._lastJumpTs = now;
    setWrapFromItem(wrap, item);
    applyFlipFromItem(wrap, item);

    // NEW: always keep the jumped item on top of other jump items
    if (wrap.parentElement === jumpLayer) {
      jumpLayer.appendChild(wrap);
    }
  }

  function renderMapImages() {
    imageLayer.innerHTML = "";
    jumpLayer.innerHTML = "";

    const list = Array.isArray(cfg.MAP_IMAGES) ? cfg.MAP_IMAGES : [];
    for (const item of list) {
      if (!item || !item.src) continue;

      const hasGoto = !!item.goto;
      const hasHref = !!item.href;
      const hasJump = !!item.jumpOnHover;

      // default flip state
      if (item._flipX !== -1 && item._flipX !== 1) item._flipX = 1;

      const wrap = document.createElement("div");
      wrap.className = "mapImg";

      // existing positioning
      setWrapFromItem(wrap, item);

      const img = document.createElement("img");
      img.alt = item.alt ?? "";
      img.loading = "lazy";
      img.decoding = "async";
      img.src = item.src;

      // apply flip on first render
      img.style.transformOrigin = "50% 50%";
      img.style.transform = `scaleX(${item._flipX})`;

      wrap.appendChild(img);

      // NEW: jump items go into their own top layer
      (hasJump ? jumpLayer : imageLayer).appendChild(wrap);

      if (!hasGoto && !hasHref && !hasJump) {
        // non-interactive images should not interfere with pan
        wrap.style.pointerEvents = "none";
        continue;
      }

      // Allow interaction on the wrapper itself
      wrap.style.pointerEvents = "auto";

      // Cursor behavior
      if (hasGoto || hasHref || hasJump) {
        wrap.style.cursor = "pointer";
      }

      // Record pointerdown for clickables (goto/href), but do not block propagation
      wrap.addEventListener("pointerdown", (e) => {
        if (!hasGoto && !hasHref) return;

        active.set(e.pointerId, {
          item,
          downX: e.clientX ?? 0,
          downY: e.clientY ?? 0,
          downT: performance.now()
        });
      }, { passive: true });

      // Jump on hover-enter
      if (hasJump) {
        wrap.addEventListener("pointerenter", () => {
          jumpItem(item, wrap);
        }, { passive: true });
      }
    }
  }

  renderMapImages();
})();
