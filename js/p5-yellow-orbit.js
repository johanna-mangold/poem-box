// p5-yellow-orbit.js
(() => {
  const KMAP = window.KMAP;
  const world = document.getElementById("world");
  if (!world || typeof window.p5 !== "function") return;

  // =========================
  // EDIT HERE (Map position + size)
  // =========================
  const CFG = {
    id: "p5YellowOrbit",
    x: 300,     // Map-X (px in world space)
    y: -500,    // Map-Y
    w: 320,     // Canvas width
    h: 320,     // Canvas height
    pointerEvents: "none" // "none" = map drag geht durch; "auto" = p5 kann Maus/Touch abfangen
  };

  // Mount container (DOM element on the map)
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
    pointerEvents: CFG.pointerEvents,
    zIndex: 30
  });

  // Optional: ensure p5 canvas is block-level
  // (prevents baseline gaps)
  mount.style.display = "block";

  // =========================
  // p5 sketch (INSTANCE MODE)
  // =========================
  new p5((p) => {
    // Variables for the central yellow circle
    let yellowCircleX, yellowCircleY;
    let yellowCircleBaseSize = 200; // base diameter
    let yellowCircleVibration = 5;

    // Array to hold all the black point objects
    let blackPoints = [];
    let numBlackPoints = 150;
    let blackPointSize = 5;

    // Parameters for the interaction
    let kickOutProbability = 0.005;
    let kickOutSpeed = 10;
    let rejoinOrbitDistance = 300;

    class BlackPoint {
      constructor(center_x, center_y, orbit_radius, orbit_angle) {
        this.center_x = center_x;
        this.center_y = center_y;
        this.orbitalRadius = orbit_radius;
        this.orbitalAngle = orbit_angle;
        this.orbitalSpeed = p.random(0.01, 0.03);
        this.size = blackPointSize;
        this.state = "orbiting";

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

          if (p.dist(this.x, this.y, this.center_x, this.center_y) < yellowCircleBaseSize / 2) {
            this.state = "kickedOut";
            this.kickOut();
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

      kickOut() {
        const angleFromCenter = p.atan2(this.y - this.center_y, this.x - this.center_x);
        this.velX = p.cos(angleFromCenter) * kickOutSpeed;
        this.velY = p.sin(angleFromCenter) * kickOutSpeed;
        this.state = "kickedOut";
      }

      bounceOffWalls() {
        if (this.x < this.size / 2 || this.x > p.width - this.size / 2) {
          this.velX *= -1;
          this.state = "bouncing";
        }
        if (this.y < this.size / 2 || this.y > p.height - this.size / 2) {
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

    p.setup = () => {
      const cnv = p.createCanvas(CFG.w, CFG.h);
      cnv.parent(mount);

      p.colorMode(p.HSB, 360, 100, 100);
      p.noStroke();

      yellowCircleX = p.width / 2;
      yellowCircleY = p.height / 2;

      blackPoints = [];
      for (let i = 0; i < numBlackPoints; i++) {
        const orbitRadius = p.random(
          yellowCircleBaseSize / 2 + blackPointSize,
          p.min(p.width, p.height) / 2 - blackPointSize
        );
        const orbitAngle = p.random(p.TWO_PI);
        blackPoints.push(new BlackPoint(yellowCircleX, yellowCircleY, orbitRadius, orbitAngle));
      }
    };

    p.draw = () => {
      p.background(0, 0, 100);

      const currentYellowCircleSize =
        yellowCircleBaseSize + p.sin(p.frameCount * 0.05) * yellowCircleVibration;

      p.fill(60, 100, 100);
      p.ellipse(yellowCircleX, yellowCircleY, currentYellowCircleSize, currentYellowCircleSize);

      for (let i = 0; i < blackPoints.length; i++) {
        const point = blackPoints[i];
        point.update();
        point.display();

        if (point.state === "orbiting" && p.random() < kickOutProbability) {
          point.state = "flyingIn";
        }
      }
    };

    // Falls du später dynamisch die Größe ändern willst:
    // p.windowResized = () => { ... }  // hier aktuell NICHT, weil Canvas fix in CFG.w/h
  }, mount);
})();
