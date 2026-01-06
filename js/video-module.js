/* =========================================================
   VIDEO MODULE
   tiny loop clips as windows on the map (DOM <video>)
   - per-video coords + size
   - loop, no controls
   - sound configurable per video (muted true/false)
   - pauses when offscreen (performance)
   - optional click to toggle play/pause
   ========================================================= */

(() => {
  const world = document.getElementById("world");
  if (!world) return;

  // ====== CONFIG: add your videos here ======
  const MAP_VIDEOS = [
    {
      id: "vid1",
      x: -600,
      y: 200,
      w: 320,
      h: 180,

      // Put your file/url here (mp4 recommended)
      src: "assets/videos/frozen_klein.mp4",

      // Playback
      loop: true,
      autoplay: true,        // will be muted if sound=false
      sound: false,          // true = try play with sound (usually needs user gesture)
      volume: 0.8,           // only used if sound=true

      // Behavior / UX
      clickToggle: true,     // click video to pause/play
      hoverPlay: false,      // if true: play on hover, pause on leave
      preload: "metadata",   // "none" | "metadata" | "auto"

      // Styling
      radius: 14,
      z: 50,
      opacity: 1,
      blendMode: "normal",   // e.g. "screen", "multiply"
      shadow: true,          // add soft shadow like your zines
      border: false,         // optional thin border
      borderColor: "rgba(254,252,247,.25)",
      bg: "transparent",     // behind video
      poster: ""             // optional: "assets/videos/clip1.jpg"
    },

    // example 2 (sound on)
    // {
    //   id: "vid2",
    //   x: 1200,
    //   y: -900,
    //   w: 240,
    //   h: 240,
    //   src: "assets/videos/clip2.mp4",
    //   loop: true,
    //   autoplay: false,     // with sound: recommend false, user clicks to start
    //   sound: true,
    //   volume: 0.6,
    //   clickToggle: true,
    //   hoverPlay: false,
    //   preload: "metadata",
    //   radius: 18,
    //   z: 60,
    //   opacity: 1,
    //   blendMode: "normal",
    //   shadow: true,
    //   border: true,
    //   borderColor: "rgba(254,252,247,.22)",
    //   bg: "rgba(0,0,0,.15)",
    //   poster: "assets/videos/clip2.jpg"
    // }
  ];

  // ====== inject minimal CSS once ======
  const STYLE_ID = "kmap-video-module-style";
  if (!document.getElementById(STYLE_ID)) {
    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      .kmap-video {
        position: absolute;
        overflow: hidden;
        display: block;
        transform: translateZ(0);
        -webkit-transform: translateZ(0);
        pointer-events: auto;
        touch-action: manipulation;
        background: transparent;
      }

      .kmap-video video {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: cover;
        background: transparent;
      }

      /* soft shadow similar vibe to embedded pdf/zines */
      .kmap-video.shadow {
        box-shadow:
          0 18px 44px rgba(0,0,0,.35),
          0  2px  8px rgba(0,0,0,.25);
      }

      .kmap-video.border {
        border: 1px solid rgba(254,252,247,.22);
      }

      /* optional: subtle hover */
      .kmap-video:hover {
        filter: brightness(1.02);
      }
    `;
    document.head.appendChild(style);
  }

  // ====== visibility / viewport check (pause offscreen) ======
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

  // try play safely (autoplay may be blocked when sound=true)
  async function safePlay(videoEl) {
    try {
      const p = videoEl.play();
      if (p && typeof p.then === "function") await p;
    } catch (e) {
      // autoplay blocked -> ignore quietly
    }
  }

  // ====== mount each video ======
  MAP_VIDEOS.forEach(cfg => {
    // wrapper
    let wrap = document.getElementById(cfg.id);
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.id = cfg.id;
      wrap.className = "kmap-video" + (cfg.shadow ? " shadow" : "") + (cfg.border ? " border" : "");
      world.appendChild(wrap);
    }

    // style wrapper
    Object.assign(wrap.style, {
      left: (cfg.x || 0) + "px",
      top: (cfg.y || 0) + "px",
      width: (cfg.w || 240) + "px",
      height: (cfg.h || 135) + "px",
      zIndex: String(cfg.z ?? 50),
      borderRadius: (cfg.radius ?? 14) + "px",
      opacity: String(cfg.opacity ?? 1),
      mixBlendMode: cfg.blendMode || "normal",
      background: cfg.bg || "transparent"
    });

    if (cfg.border && cfg.borderColor) {
      wrap.style.borderColor = cfg.borderColor;
    }

    // video element
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

    // sound handling:
    // - browsers allow autoplay mostly only when muted
    // - if sound=true, recommend autoplay=false (user gesture)
    const wantsSound = !!cfg.sound;
    v.muted = !wantsSound;
    v.volume = wantsSound ? (cfg.volume ?? 1) : 0;

    // poster optional
    if (cfg.poster) v.setAttribute("poster", cfg.poster);

    // autoplay intent
    // (we still gate actual playing by visibility below)
    const wantsAutoplay = cfg.autoplay !== false;

    // click toggle
    if (cfg.clickToggle) {
      wrap.style.cursor = "pointer";
      wrap.addEventListener("click", async () => {
        if (v.paused) {
          // if sound=true, unmute on user gesture
          if (wantsSound) v.muted = false;
          await safePlay(v);
        } else {
          v.pause();
        }
      });
    }

    // hover behavior
    if (cfg.hoverPlay) {
      wrap.addEventListener("mouseenter", async () => {
        if (wantsSound) v.muted = false; // gesture-ish, but hover may still be blocked
        await safePlay(v);
      });
      wrap.addEventListener("mouseleave", () => v.pause());
    }

    // ====== performance loop: pause offscreen ======
    let lastVisible = null;

    function tick() {
      const visible = isElementOnScreen(wrap, 240);

      if (visible !== lastVisible) {
        lastVisible = visible;

        if (!visible) {
          v.pause();
        } else {
          if (wantsAutoplay && !cfg.hoverPlay) {
            // if sound=true and autoplay=true, this may be blocked: safePlay handles it
            safePlay(v);
          }
        }
      }

      requestAnimationFrame(tick);
    }

    // start
    // (don’t force play on load if autoplay is off)
    if (wantsAutoplay && !cfg.hoverPlay) {
      // If sound=false, autoplay will usually succeed; if sound=true, likely blocked until click.
      safePlay(v);
    }
    requestAnimationFrame(tick);
  });

})();
