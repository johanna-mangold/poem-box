// p5-yellow-orbit.js
(() => {
  const world = document.getElementById("world");
  if (!world || typeof window.p5 !== "function") return;

  const CFG = {
    id: "p5YellowOrbit",
    x: -1804,
    y: 1400,
    w: 360,
    h: 360,
    z: 999,              // hoch, damit sicher oben
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
    // optional, verhindert Browser-Scroll/Zoom-Gesten auf Touch
    touchAction: "none"
  });

  // Optional: sichtbarer Debug-Rahmen (nur zum Testen)
  // mount.style.outline = "2px solid rgba(255,0,0,.35)";

  // ===== Sketch state stored outside so DOM handler can trigger it =====
  const SK = {
    trigger: null // wird nach p5-init gesetzt
  };

  // DOM pointer handler: super robust gegen map-core pointer capture
  mount.addEventListener(
    "pointerdown",
    (e) => {
      // Klick/Tap nur hier, nicht die Map
      e.preventDefault();
      e.stopPropagation();

      // Fokus damit manche Browser Mouse Events nicht verschlucken
      mount.setPointerCapture?.(e.pointerId);

      if (typeof SK.trigger === "function") SK.trigger();
    },
    { passive: false }
  );

  new p5((p) => {
    // ===== CONFIG =====
    const NUM = 170;
    const Y_BASE_DIAM = 230;

    const ATTRACT_STRENGTH = 0.55;
    const ATTRACT_MAX = 10.0;
    const DAMPING = 0.975;

    const INSIDE_JITTER = 0.55;
    const INSIDE_SWIRL = 0.045;

    const KICK_SPEED = 18;
    const KICK_RANDOM = 10;

    const BOUNCE_TIME_FRAMES = 160;
    const BOUNCE_RESTITUTION = 1.15;

    const REENTRY_DELAY_MIN = 0;
    const REENTRY_DELAY_MAX = 240;

    const SHAKE_FRAMES = 26;
    const SHAKE_MAX = 42;
    const SHAKE_NOISE_SPEED = 0.22;

    const DOT_SIZE = 5;

    // ===== STATE =====
    let cxBase, cyBase;
    let shakeLeft = 0;
    let bounceLeft = 0;
    let shakeSeed = 123.45;

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
        p.fill(0);
        p.ellipse(this.pos.x, this.pos.y, DOT_SIZE, DOT_SIZE);
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

      const n1 = p.noise(shakeSeed + p.frameCount * SHAKE_NOISE_SPEED);
      const n2 = p.noise(shakeSeed + 999 + p.frameCount * SHAKE_NOISE_SPEED);
      const nx = (n1 * 2 - 1);
      const ny = (n2 * 2 - 1);

      const jx = p.random(-0.6, 0.6);
      const jy = p.random(-0.6, 0.6);

      return {
        cx: cxBase + (nx + jx) * amp,
        cy: cyBase + (ny + jy) * amp
      };
    }

    function triggerShakeAndKick() {
      shakeLeft = SHAKE_FRAMES;
      bounceLeft = BOUNCE_TIME_FRAMES;
      shakeSeed = p.random(10000);

      for (let i = 0; i < dots.length; i++) {
        dots[i].kickOut(cxBase, cyBase);
      }
    }

    p.setup = () => {
      const cnv = p.createCanvas(CFG.w, CFG.h);
      cnv.parent(mount);

      p.colorMode(p.HSB, 360, 100, 100);
      p.noStroke();

      cxBase = p.width / 2;
      cyBase = p.height / 2;

      initDots();

      // expose trigger to DOM handler
      SK.trigger = triggerShakeAndKick;
    };

    p.draw = () => {
      p.background(0, 0, 100);

      if (shakeLeft > 0) shakeLeft--;
      if (bounceLeft > 0) bounceLeft--;

      const { cx, cy } = getShakenCenter();

      const breathe = p.sin(p.frameCount * 0.06) * 6;
      const yellowDiam = Y_BASE_DIAM + breathe;
      const r = yellowDiam / 2;

      p.fill(60, 100, 100);
      p.ellipse(cx, cy, yellowDiam, yellowDiam);

      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];
        const allowPass = (d.reentryDelay <= 0);

        d.step(cx, cy, r, allowPass);

        if (bounceLeft > 0) {
          d.bounceOffCircle(cx, cy, r);
        } else {
          if (d.reentryDelay > 0) d.reentryDelay--;
        }

        d.draw();
      }
    };
  }, mount);
})();
