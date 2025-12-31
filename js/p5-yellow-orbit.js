// p5-yellow-orbit.js
(() => {
  const world = document.getElementById("world");
  if (!world || typeof window.p5 !== "function") return;

  const CFG = {
    id: "p5YellowOrbit",
    x: -1804,
    y: 1400,
    w: 260,
    h: 260,
    z: 999,
    pointerEvents: "auto"
  };

  // Mount
  let mount = document.getElementById(CFG.id);
  if (!mount) {
    mount = document.createElement("div");
    mount.id = CFG.id;
    world.appendChild(mount);
  }

  Object.assign(mount.style, {
    position: "absolute",
    left: CFG.x + "px",
    top: CFG.y + "px",
    width: CFG.w + "px",
    height: CFG.h + "px",
    zIndex: String(CFG.z),
    pointerEvents: CFG.pointerEvents,
    display: "block",
    touchAction: "none"
  });

  // ===== Helper: visibility check (pause when offscreen) =====
  function isOnScreen() {
    const vp = document.getElementById("viewport");
    if (!vp) return true;

    const r = mount.getBoundingClientRect();
    const v = vp.getBoundingClientRect();

    return !(r.right < v.left || r.left > v.right || r.bottom < v.top || r.top > v.bottom);
  }

  // ===== Sketch trigger =====
  const SK = { trigger: null };

  mount.addEventListener(
    "pointerdown",
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      mount.setPointerCapture?.(e.pointerId);
      if (typeof SK.trigger === "function") SK.trigger();
    },
    { passive: false }
  );

  new p5((p) => {
    // ===== CONFIG =====
    const NUM = 90;
    const Y_BASE_DIAM = 230;

    const ATTRACT_STRENGTH = 0.55;
    const ATTRACT_MAX = 10.0;
    const DAMPING = 0.975;

    const INSIDE_JITTER = 0.35;
    const INSIDE_SWIRL = 0.045;

    const KICK_SPEED = 18;
    const KICK_RANDOM = 10;

    const BOUNCE_TIME_FRAMES = 110;
    const BOUNCE_RESTITUTION = 1.15;

    const REENTRY_DELAY_MIN = 0;
    const REENTRY_DELAY_MAX = 240;

    const SHAKE_FRAMES = 18;
    const SHAKE_MAX = 42;

    const DOT_SIZE = 5;

    // ===== COLORS =====
    // Transparent background: we will use p.clear() in draw()
    const YELLOW = "#2A00F5";   // fill of the big circle
    const STROKE = "#9628F5";   // outline of the big circle
    // If you want a solid BG instead of transparent, set BG_COLOR and use p.background(BG_COLOR)
    // const BG_COLOR = "#F000AD";

    // ===== STATE =====
    let cxBase, cyBase;
    let shakeLeft = 0;
    let bounceLeft = 0;
    let running = true;

    class Dot {
      constructor() {
        this.pos = p.createVector(p.random(CFG.w), p.random(CFG.h));
        this.vel = p.createVector(p.random(-1, 1), p.random(-1, 1));
        this.reentryDelay = 0;
      }

      step(targetX, targetY, circleR, allowPassIntoCircle) {
        const dx = targetX - this.pos.x;
        const dy = targetY - this.pos.y;
        const d = Math.max(0.0001, Math.hypot(dx, dy));
        const dirx = dx / d;
        const diry = dy / d;

        let a = ATTRACT_STRENGTH * (1.0 + (circleR * 1.25) / (d + 25));
        a = Math.min(a, ATTRACT_MAX);

        if (!allowPassIntoCircle && d < circleR + 30) a *= 0.15;

        this.vel.x += dirx * a;
        this.vel.y += diry * a;

        if (d < circleR) {
          this.vel.x += (-diry) * INSIDE_SWIRL * (circleR / Math.max(40, d));
          this.vel.y += ( dirx) * INSIDE_SWIRL * (circleR / Math.max(40, d));
          this.vel.x += p.random(-INSIDE_JITTER, INSIDE_JITTER);
          this.vel.y += p.random(-INSIDE_JITTER, INSIDE_JITTER);
        }

        this.vel.mult(DAMPING);
        this.pos.add(this.vel);
      }

      bounceOffCircle(targetX, targetY, circleR) {
        const vx = this.pos.x - targetX;
        const vy = this.pos.y - targetY;
        const d = Math.max(0.0001, Math.hypot(vx, vy));

        if (d < circleR) {
          const nx = vx / d;
          const ny = vy / d;

          this.pos.x = targetX + nx * (circleR + 0.6);
          this.pos.y = targetY + ny * (circleR + 0.6);

          const dot = this.vel.x * nx + this.vel.y * ny;
          this.vel.x = (this.vel.x - 2 * dot * nx) * BOUNCE_RESTITUTION;
          this.vel.y = (this.vel.y - 2 * dot * ny) * BOUNCE_RESTITUTION;
        }
      }

      kickOut(targetX, targetY) {
        const ang = p.atan2(this.pos.y - targetY, this.pos.x - targetX);
        const sp = KICK_SPEED + p.random(0, KICK_RANDOM);
        this.vel.x += p.cos(ang) * sp;
        this.vel.y += p.sin(ang) * sp;
        this.reentryDelay = p.floor(p.random(REENTRY_DELAY_MIN, REENTRY_DELAY_MAX));
      }

      draw() {
        p.noStroke();
        p.fill(0);
        p.rect(this.pos.x - DOT_SIZE / 2, this.pos.y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
      }
    }

    let dots = [];
    function initDots() {
      dots = [];
      for (let i = 0; i < NUM; i++) dots.push(new Dot());
    }

    function getShakenCenter() {
      if (shakeLeft <= 0) return { cx: cxBase, cy: cyBase };

      const t = shakeLeft / SHAKE_FRAMES;
      const ease = t * t;
      const amp = SHAKE_MAX * ease;

      const nx = p.random(-1, 1);
      const ny = p.random(-1, 1);
      const jx = p.random(-0.6, 0.6);
      const jy = p.random(-0.6, 0.6);

      return { cx: cxBase + (nx + jx) * amp, cy: cyBase + (ny + jy) * amp };
    }

    function triggerShakeAndKick() {
      shakeLeft = SHAKE_FRAMES;
      bounceLeft = BOUNCE_TIME_FRAMES;
      for (let i = 0; i < dots.length; i++) dots[i].kickOut(cxBase, cyBase);
    }

    function syncRunState() {
      const visible = isOnScreen();
      if (visible && !running) {
        p.loop();
        running = true;
      } else if (!visible && running) {
        p.noLoop();
        running = false;
      }
    }

    p.setup = () => {
      const cnv = p.createCanvas(CFG.w, CFG.h);
      cnv.parent(mount);

      // performance
      p.pixelDensity(1);
      p.frameRate(30);

      // IMPORTANT: make canvas transparent
      cnv.elt.style.background = "transparent";

      p.rectMode(p.CORNER);

      cxBase = p.width / 2;
      cyBase = p.height / 2;

      initDots();
      SK.trigger = triggerShakeAndKick;

      syncRunState();
      if (window.KMAP && typeof window.KMAP.onApply === "function") {
        window.KMAP.onApply(syncRunState);
      } else {
        setInterval(syncRunState, 500);
      }
    };

    p.draw = () => {
      // ✅ transparent background
      p.clear();
      // If you want solid BG instead, replace with:
      // p.background(BG_COLOR);

      if (shakeLeft > 0) shakeLeft--;
      if (bounceLeft > 0) bounceLeft--;

      const { cx, cy } = getShakenCenter();

      const breathe = p.sin(p.frameCount * 0.06) * 6;
      const yellowDiam = Y_BASE_DIAM + breathe;

      // ✅ draw big circle
      p.fill(YELLOW);
      p.stroke(STROKE);
      p.strokeWeight(2);
      p.ellipse(cx, cy, yellowDiam, yellowDiam);

      // dots
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const allowPass = (d.reentryDelay <= 0);

        d.step(cx, cy, yellowDiam / 2, allowPass);

        if (bounceLeft > 0) {
          d.bounceOffCircle(cx, cy, yellowDiam / 2);
        } else {
          if (d.reentryDelay > 0) d.reentryDelay--;
        }

        d.draw();
      }
    };
  }, mount);
})();
