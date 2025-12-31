// p5-yellow-orbit.js
(() => {
  const world = document.getElementById("world");
  if (!world || typeof window.p5 !== "function") return;

  // =========================
  // EDIT HERE (Map position + size)
  // =========================
  const CFG = {
    id: "p5YellowOrbit",
    x: 300,
    y: -500,
    w: 560,
    h: 560,
    z: 30,
    pointerEvents: "auto" // needs to be auto for clicking
  };

  // Mount on the map
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
    display: "block"
  });

  new p5((p) => {
    // ===== CONFIG (feel free to tweak) =====
    const NUM = 170;

    // Yellow circle base
    const Y_BASE_DIAM = 230;

    // Pull into center
    const ATTRACT_STRENGTH = 0.55; // stronger -> more aggressive suction
    const ATTRACT_MAX = 10.0;      // clamp acceleration
    const DAMPING = 0.975;         // global friction

    // Movement inside circle
    const INSIDE_JITTER = 0.55;    // random jitter force inside
    const INSIDE_SWIRL = 0.045;    // swirl around center inside

    // Explosion / kick
    const KICK_SPEED = 18;         // base outward impulse
    const KICK_RANDOM = 10;        // randomness added to kick

    // Circle collision after shake (they bounce off circle for a while)
    const BOUNCE_TIME_FRAMES = 160; // how long circle behaves like a hard collider
    const BOUNCE_RESTITUTION = 1.15; // >1 feels "angry" / energetic

    // Re-entry staging: after bounce phase, we gradually allow points to pass through again
    const REENTRY_DELAY_MIN = 0;
    const REENTRY_DELAY_MAX = 240;

    // Shake feel (KRASS!)
    const SHAKE_FRAMES = 26;
    const SHAKE_MAX = 42;         // px offset (big!)
    const SHAKE_NOISE_SPEED = 0.22;

    // Visual
    const DOT_SIZE = 5;

    // ===== STATE =====
    let cxBase, cyBase;

    let shakeLeft = 0;
    let bounceLeft = 0;
    let shakeSeed = p.random(1000);

    let yellowDiam = Y_BASE_DIAM;

    class Dot {
      constructor() {
        this.reset();
      }

      reset() {
        // start around canvas area
        this.pos = p.createVector(p.random(p.width), p.random(p.height));
        this.vel = p.createVector(p.random(-1, 1), p.random(-1, 1));
        this.reentryDelay = 0; // frames until it may pass into circle (used after shake)
      }

      // attract + inside behavior
      step(targetX, targetY, circleR, allowPassIntoCircle) {
        const dx = targetX - this.pos.x;
        const dy = targetY - this.pos.y;
        const d = Math.max(0.0001, Math.hypot(dx, dy));
        const dirx = dx / d;
        const diry = dy / d;

        // strong attraction (inverse-ish)
        let a = ATTRACT_STRENGTH * (1.0 + (circleR * 1.25) / (d + 25));
        a = Math.min(a, ATTRACT_MAX);

        // If we are in "reentry delay" window, temporarily reduce attraction into the circle
        // (still pulled, but less so, so they don't all pop in at once)
        if (!allowPassIntoCircle && d < circleR + 30) {
          a *= 0.15;
        }

        // apply attraction acceleration
        this.vel.x += dirx * a;
        this.vel.y += diry * a;

        // inside circle: jitter + swirl for that “swarming interior”
        if (d < circleR) {
          // swirl (perpendicular to direction)
          this.vel.x += (-diry) * INSIDE_SWIRL * (circleR / Math.max(40, d));
          this.vel.y += ( dirx) * INSIDE_SWIRL * (circleR / Math.max(40, d));

          // jitter
          this.vel.x += p.random(-INSIDE_JITTER, INSIDE_JITTER);
          this.vel.y += p.random(-INSIDE_JITTER, INSIDE_JITTER);
        }

        // damping
        this.vel.mult(DAMPING);

        // integrate
        this.pos.add(this.vel);
      }

      bounceOffCircle(targetX, targetY, circleR) {
        // If inside the circle, push it to boundary and reflect velocity
        const vx = this.pos.x - targetX;
        const vy = this.pos.y - targetY;
        const d = Math.max(0.0001, Math.hypot(vx, vy));

        if (d < circleR) {
          // normal
          const nx = vx / d;
          const ny = vy / d;

          // move to boundary + tiny epsilon
          this.pos.x = targetX + nx * (circleR + 0.6);
          this.pos.y = targetY + ny * (circleR + 0.6);

          // reflect velocity
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

        // re-entry delay so they don't instantly all re-enter
        this.reentryDelay = p.floor(p.random(REENTRY_DELAY_MIN, REENTRY_DELAY_MAX));
      }

      draw() {
        p.fill(0);
        p.ellipse(this.pos.x, this.pos.y, DOT_SIZE, DOT_SIZE);
      }
    }

    let dots = [];

    function init() {
      dots = [];
      for (let i = 0; i < NUM; i++) dots.push(new Dot());
    }

    function getShakenCenter() {
      // brutal shake: combine easing + noise + random jitter
      if (shakeLeft <= 0) return { cx: cxBase, cy: cyBase };

      const t = shakeLeft / SHAKE_FRAMES;      // 1..0
      const ease = t * t;                      // ease-out
      const amp = SHAKE_MAX * ease;

      const n1 = p.noise(shakeSeed + p.frameCount * SHAKE_NOISE_SPEED);
      const n2 = p.noise(shakeSeed + 999 + p.frameCount * SHAKE_NOISE_SPEED);

      // map noise 0..1 to -1..1
      const nx = (n1 * 2 - 1);
      const ny = (n2 * 2 - 1);

      // add a little raw jitter on top
      const jx = p.random(-0.6, 0.6);
      const jy = p.random(-0.6, 0.6);

      const sx = (nx + jx) * amp;
      const sy = (ny + jy) * amp;

      return { cx: cxBase + sx, cy: cyBase + sy };
    }

    p.setup = () => {
      const cnv = p.createCanvas(CFG.w, CFG.h);
      cnv.parent(mount);

      p.colorMode(p.HSB, 360, 100, 100);
      p.noStroke();

      cxBase = p.width / 2;
      cyBase = p.height / 2;

      init();
    };

    p.draw = () => {
      // background
      p.background(0, 0, 100);

      // decay timers
      if (shakeLeft > 0) shakeLeft--;
      if (bounceLeft > 0) bounceLeft--;

      // center with shake
      const { cx, cy } = getShakenCenter();

      // yellow circle: also “breathes”
      const breathe = p.sin(p.frameCount * 0.06) * 6;
      yellowDiam = Y_BASE_DIAM + breathe;
      const r = yellowDiam / 2;

      // draw yellow
      p.fill(60, 100, 100);
      p.ellipse(cx, cy, yellowDiam, yellowDiam);

      // physics + draw dots
      for (let i = 0; i < dots.length; i++) {
        const d = dots[i];

        // reentry gating: after a shake, each dot has its own delay before being allowed to pass into circle
        const allowPass = (d.reentryDelay <= 0);

        d.step(cx, cy, r, allowPass);

        // during bounce phase, circle is a hard collider (they “prallen ab”)
        if (bounceLeft > 0) {
          d.bounceOffCircle(cx, cy, r);
        } else {
          // after bounce phase: decrease reentry delays gradually
          if (d.reentryDelay > 0) d.reentryDelay--;
        }

        d.draw();
      }
    };

    // CLICK: krass shake + all dots kicked out + bounce phase begins
    p.mousePressed = () => {
      if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;

      shakeLeft = SHAKE_FRAMES;
      bounceLeft = BOUNCE_TIME_FRAMES;
      shakeSeed = p.random(10000);

      // kick everything outward from the *base* center (stable direction)
      for (let i = 0; i < dots.length; i++) {
        dots[i].kickOut(cxBase, cyBase);
      }
    };

    // Touch support
    p.touchStarted = () => {
      p.mousePressed();
      return false;
    };
  }, mount);
})();
