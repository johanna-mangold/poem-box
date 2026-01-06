/* =========================================================
   VIDEO MODULE (PLAIN)
   - video sits on the map in its native aspect ratio
   - no frame look, no rounding, no shadow, no border
   - set position + ONE size (width OR height). other side auto.
   - loop, no controls
   - sound per video (muted true/false)
   - pauses when offscreen (performance)
   ========================================================= */

(() => {
  const world = document.getElementById("world");
  if (!world) return;

  const MAP_VIDEOS = [
    {
      id: "vid1",
      x: -600,
      y: 200,

      // ✅ choose ONE (recommended)
      width: 220,   // sets width, height auto by video aspect
      // height: 180,

      src: "assets/videos/frozen_ganzklein.mp4",

      loop: true,
      autoplay: true,
      sound: false,
      volume: 0.8,

      clickToggle: true,
      hoverPlay: false,
      preload: "metadata",
      z: 50,
      opacity: 1,
      blendMode: "normal"
    }
  ];

  // minimal CSS once
  const STYLE_ID = "kmap-video-plain-style";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .kmap-video-plain {
        position: absolute;
        display: block;
        overflow: visible;          /* ✅ no clipping frame */
        background: transparent;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        pointer-events: auto;
        touch-action: manipulation;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
      }

      .kmap-video-plain video {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: contain;        /* ✅ never crop */
        object-position: center;
        background: transparent;
      }
    `;
    document.head.appendChild(style);
  }

  function isElementOnScreen(el, pad = 200) {
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    return (
      r.right >= -pad &&
      r.bottom >= -pad &&
      r.left <= vw + pad &&
      r.top <= vh + pad
    );
  }

  async function safePlay(videoEl) {
    try {
      const p = videoEl.play();
      if (p && typeof p.then === "function") await p;
    } catch (_) {}
  }

  MAP_VIDEOS.forEach(cfg => {
    // wrapper
    let wrap = document.getElementById(cfg.id);
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = cfg.id;
      wrap.className = "kmap-video-plain";
      world.appendChild(wrap);
    }

    // video
    let v = wrap.querySelector("video");
    if (!v) {
      v = document.createElement("video");
      wrap.appendChild(v);
    }

    // base attributes
    v.src = cfg.src;
    v.loop = cfg.loop !== false;
    v.playsInline = true;
    v.preload = cfg.preload || "metadata";
    v.controls = false;

    const wantsSound = !!cfg.sound;
    v.muted = !wantsSound;
    v.volume = wantsSound ? (cfg.volume ?? 1) : 0;

    // wrapper style (position first)
    Object.assign(wrap.style, {
      left: (cfg.x || 0) + "px",
      top: (cfg.y || 0) + "px",
      zIndex: String(cfg.z ?? 50),
      opacity: String(cfg.opacity ?? 1),
      mixBlendMode: cfg.blendMode || "normal"
    });

    // ✅ Set size using video aspect ratio once metadata is ready
    function applyNaturalSize() {
      const vw = v.videoWidth || 0;
      const vh = v.videoHeight || 0;
      if (!vw || !vh) return;

      const aspect = vw / vh;

      // Prefer user width; else height; else fall back to natural scaled down
      if (typeof cfg.width === "number") {
        const W = cfg.width;
        const H = Math.round(W / aspect);
        wrap.style.width = W + "px";
        wrap.style.height = H + "px";
      } else if (typeof cfg.height === "number") {
        const H = cfg.height;
        const W = Math.round(H * aspect);
        wrap.style.height = H + "px";
        wrap.style.width = W + "px";
      } else {
        // fallback: use natural size but cap to 420px width
        const capW = 420;
        const W = Math.min(vw, capW);
        const H = Math.round(W / aspect);
        wrap.style.width = W + "px";
        wrap.style.height = H + "px";
      }
    }

    // Ensure size is set as soon as we know metadata
    if (v.readyState >= 1) {
      applyNaturalSize();
    } else {
      v.addEventListener("loadedmetadata", applyNaturalSize, { once: true });
    }

    // interactions
    if (cfg.clickToggle) {
      wrap.style.cursor = "pointer";
      wrap.onclick = async () => {
        if (v.paused) {
          if (wantsSound) v.muted = false;
          await safePlay(v);
        } else {
          v.pause();
        }
      };
    } else {
      wrap.style.cursor = "default";
      wrap.onclick = null;
    }

    if (cfg.hoverPlay) {
      wrap.addEventListener("mouseenter", async () => {
        if (wantsSound) v.muted = false;
        await safePlay(v);
      });
      wrap.addEventListener("mouseleave", () => v.pause());
    }

    const wantsAutoplay = cfg.autoplay !== false;

    // pause when offscreen
    let lastVisible = null;
    function tick() {
      const visible = isElementOnScreen(wrap, 240);
      if (visible !== lastVisible) {
        lastVisible = visible;
        if (!visible) v.pause();
        else if (wantsAutoplay && !cfg.hoverPlay) safePlay(v);
      }
      requestAnimationFrame(tick);
    }

    if (wantsAutoplay && !cfg.hoverPlay) safePlay(v);
    requestAnimationFrame(tick);
  });

})();
