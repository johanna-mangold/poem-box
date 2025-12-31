// p5-yellow-orbit.js
(() => {
  const world = document.getElementById("world");
  if (!world || typeof window.p5 !== "function") return;

  // =========================
  // EDIT HERE (Map position + size)
  // =========================
  const CFG = {
    id: "p5YellowOrbit",
    x: 300,      // Map-X (world space px)
    y: -500,     // Map-Y
    w: 520,      // Canvas width
    h: 520,      // Canvas height
    z: 30,
    pointerEvents: "auto" // "auto" = canvas bekommt klicks; "none" = map drag geht durch
  };

  // Mount on the map (inside #world)
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
    pointerEvents: CFG.pointerEvents
  });

  // prevent inline-block gaps
  mount.style.display = "block";

  // =========================
  // p5 sketch (INSTANCE MODE)
  // =========================
  new p5((p) => {
    // --- Yellow circle ---
    let yellowCircleX, yellowCircleY;
    let yellowCircleBaseSize = 200; // diameter
    let yellowCircleVibration = 5;  // size wobble

    // --- Points ---
    let blackPoints = [];
    let numBlackPoints = 150;
    let blackPointSize = 5;

    // --- Interaction / motion params ---
    let kickOutProbability = 0.005; // random fly-in chance
    let kickOutSpeed = 10;
    let rejoinOrbitDistance = 300;

    // --- Shake params ---
    let shakeFrames = 0;
    const SHAKE_DURATION = 18; // frames
    const SHAKE_MAX = 14;      // px
    const MASS_KICK_MULT = 2.2;

    class BlackPoint {
      constructor(center_x, center_y, orbit_radius, orbit_angle) {
        this.center_x = center_x;
        this.center_y = center_y;

        this.orbitalRadius = orbit_radius;
        this.orbitalAngle = orbit_angle;
        this.orbitalSpeed = p.random(0.01, 0.03);

        this.size = blackPointSize;
        this.state = "orbiting"; // orbiting | flyingIn | kickedOut | bouncing

        this.x = this.center_x + this.orbitalRadius * p.cos(this.orbitalAngle);
        this.y = this.center_y + this.orbitalRadius * p.sin(this.orbitalAngle);

        this.velX = 0;
        this.velY = 0;
      }

      update() {
        if (this.state === "orbiting") {
          this.orbitalAngle += this.orbitalSpeed;
          this.x = this.center_x + this.orbitalRadius * p.cos(this.orbitalAngle);
          this.y = this.center_y + this.orbitalRadius * p.sin(this.orbitalAngle);

        } else if (this.state === "flyingIn") {
          const angleToCenter = p.atan2(this.center_y - this.y, this.center_x - this.x);
          this.velX = p.cos(angleToCenter) * kickOutSpeed * 0.5;
          this.velY = p.sin(angleToCenter) * kickOutSpeed * 0.5;
          this.x += this.velX;
          this.y += this.velY;

          // reached yellow circle => kick out immediately
          if (p.dist(this.x, this.y, this.center_x, this.center_y) < yellowCircleBaseSize / 2) {
            this.kickOut(1);
          }

        } else if (this.state === "kickedOut" || this.state === "bouncing") {
          this.x += this.velX;
          this.y += this.velY;

          this.bounceOffWalls();

          if (p.dist(this.x, this.y, this.center_x, this.center_y) > rejoinOrbitDistance) {
            this.rejoinOrbit();
          }
        }
      }

      display() {
        p.fill(0);
        p.ellipse(this.x, this.y, this.size, this.size);
      }

      kickOut(mult = 1) {
        const angleFromCenter = p.atan2(this.y - this.center_y, this.x - this.center_x);
        this.velX = p.cos(angleFromCenter) * kickOutSpeed * mult;
        this.velY = p.sin(angleFromCenter) * kickOutSpeed * mult;
        this.state = "kickedOut";
      }

      bounceOffWalls() {
        if (this.x < this.size / 2) {
          this.x = this.size / 2;
          this.velX *= -1;
          this.state = "bouncing";
        } else if (this.x > p.width - this.size / 2) {
          this.x = p.width - this.size / 2;
          this.velX *= -1;
          this.state = "bouncing";
        }

        if (this.y < this.size / 2) {
          this.y = this.size / 2;
          this.velY *= -1;
          this.state = "bouncing";
        } else if (this.y > p.height - this.size / 2) {
          this.y = p.height - this.size / 2;
          this.velY *= -1;
          this.state = "bouncing";
        }
      }

      rejoinOrbit() {
        this.state = "orbiting";
        this.orbitalRadius = p.random(
          yellowCircleBaseSize / 2 + blackPointSize,
          p.min(p.width, p.height) / 2 - blackPointSize
        );
        this.orbitalAngle = p.random(p.TWO_PI);
        this.orbitalSpeed = p.random(0.01, 0.03);

        this.x = this.center_x + this.orbitalRadius * p.cos(this.orbitalAngle);
        this.y = this.center_y + this.orbitalRadius * p.sin(this.orbitalAngle);

        this.velX = 0;
        this.velY = 0;
      }
    }

    function initPoints() {
      blackPoints = [];
      for (let i = 0; i < numBlackPoints; i++) {
        const orbitRadius = p.random(
          yellowCircleBaseSize / 2 + blackPointSize,
          p.min(p.width, p.height) / 2 - blackPointSize
        );
        const orbitAngle = p.random(p.TWO_PI);
        blackPoints.push(new BlackPoint(yellowCircleX, yellowCircleY, orbitRadius, orbitAngle));
      }
    }

    p.setup = () => {
      const cnv = p.createCanvas(CFG.w, CFG.h);
      cnv.parent(mount);

      p.colorMode(p.HSB, 360, 100, 100);
      p.noStroke();

      yellowCircleX = p.width / 2;
      yellowCircleY = p.height / 2;

      initPoints();
    };

    p.draw = () => {
      // Background
      p.background(0, 0, 100);

      // --- compute shake offset (ease out) ---
      let shakePower = 0;
      if (shakeFrames > 0) {
        shakeFrames--;
        const t = shakeFrames / SHAKE_DURATION; // 1 -> 0
        shakePower = SHAKE_MAX * (t * t);
      }

      const sx = shakePower ? p.random(-shakePower, shakePower) : 0;
      const sy = shakePower ? p.random(-shakePower, shakePower) : 0;

      // "current" center used for this frame (draw + physics)
      const cx = yellowCircleX + sx;
      const cy = yellowCircleY + sy;

      // --- yellow ball (vibrate size + shake position) ---
      const currentYellowCircleSize =
        yellowCircleBaseSize + p.sin(p.frameCount * 0.05) * yellowCircleVibration;

      p.fill(60, 100, 100);
      p.ellipse(cx, cy, currentYellowCircleSize, currentYellowCircleSize);

      // --- points ---
      for (let i = 0; i < blackPoints.length; i++) {
        const point = blackPoints[i];

        // IMPORTANT: update each point's center to the shaken center
        point.center_x = cx;
        point.center_y = cy;

        point.update();
        point.display();

        // random fly-in trigger
        if (point.state === "orbiting" && p.random() < kickOutProbability) {
          point.state = "flyingIn";
        }
      }
    };

    // Click: shake + mass kick
    p.mousePressed = () => {
      // only if click is inside the canvas
      if (p.mouseX < 0 || p.mouseX > p.width || p.mouseY < 0 || p.mouseY > p.height) return;

      shakeFrames = SHAKE_DURATION;

      // kick all points at once
      for (let i = 0; i < blackPoints.length; i++) {
        const point = blackPoints[i];

        // ensure direction is computed from current "base" center
        point.center_x = yellowCircleX;
        point.center_y = yellowCircleY;

        point.kickOut(MASS_KICK_MULT);
      }
    };

    // Optional: Touch support (mobile)
    p.touchStarted = () => {
      // p5 calls touchStarted; return false to prevent default scroll
      p.mousePressed();
      return false;
    };
  }, mount);
})();
