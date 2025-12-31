// sketch.js
// p5.js + Matter.js: Stickfigures wuselnd in einer eigenen Box auf der Map
// Klick in die Box: roter Ball teleportiert zufällig + Kick

const PARENT_SELECTOR = "#p5StickPOI";
const FALLBACK_W = 520;
const FALLBACK_H = 520;

// --------------------
// Tuning
// --------------------
const numStickFigures = 10;
const stickFigureSize = 30;
const stickFigureSpeed = 2;

const ballSize = 15;
const ballShotForce = 0.05;
let lastShotTime = 0;
const shotCooldown = 500;

// --------------------
// Matter globals
// --------------------
let engine, world;
let stickFigures = [];
let ball;

const CATEGORY_WALL = 0x0001;
const CATEGORY_STICK_FIGURE = 0x0002;
const CATEGORY_BALL = 0x0004;

const wallThickness = 10;
let walls = [];

let __didInit = false;

// =========================================================
// StickFigure
// =========================================================
class StickFigure {
  constructor(x, y) {
    this.body = Matter.Bodies.circle(x, y, stickFigureSize / 2, {
      friction: 0.0,
      restitution: 0.9,
      density: 0.0005,
      label: "stickFigure",
      collisionFilter: {
        category: CATEGORY_STICK_FIGURE,
        mask: CATEGORY_WALL | CATEGORY_STICK_FIGURE
      }
    });

    Matter.World.add(world, this.body);

    const a = random(TWO_PI);
    Matter.Body.setVelocity(this.body, {
      x: cos(a) * stickFigureSpeed,
      y: sin(a) * stickFigureSpeed
    });

    this.stepOffset = random(TWO_PI);
    this.stepSpeed = random(0.1, 0.2);
  }

  update() {
    const v = this.body.velocity;
    const speed = sqrt(v.x * v.x + v.y * v.y);

    if (speed < stickFigureSpeed * 0.9 || speed === 0) {
      let dir = atan2(v.y, v.x);
      if (speed === 0) dir = random(TWO_PI);

      Matter.Body.setVelocity(this.body, {
        x: cos(dir) * stickFigureSpeed,
        y: sin(dir) * stickFigureSpeed
      });
    }

    this.stepOffset += this.stepSpeed;
  }

  display() {
    const pos = this.body.position;

    push();
    translate(pos.x, pos.y);

    stroke(0);
    strokeWeight(2);
    noFill();

    // head
    const headSize = stickFigureSize * 0.8;
    ellipse(0, -headSize * 0.5, headSize, headSize);

    // body
    const bodyLength = stickFigureSize * 0.6;
    line(0, 0, 0, bodyLength);

    // legs
    const legLength = stickFigureSize * 0.6;
    const legSwing = sin(this.stepOffset) * stickFigureSize * 0.25;

    line(0, bodyLength, -legSwing, bodyLength + legLength);
    line(0, bodyLength,  legSwing, bodyLength + legLength);

    pop();
  }
}

// =========================================================
// Ball
// =========================================================
class Ball {
  constructor(x, y) {
    this.body = Matter.Bodies.circle(x, y, ballSize / 2, {
      friction: 0,
      restitution: 0.9,
      density: 0.005,
      label: "ball",
      collisionFilter: {
        category: CATEGORY_BALL,
        mask: CATEGORY_WALL
      }
    });
    Matter.World.add(world, this.body);
  }

  display() {
    const pos = this.body.position;
    noStroke();
    fill(255, 0, 0);
    ellipse(pos.x, pos.y, ballSize, ballSize);
  }

  teleportRandomWithKick() {
    const margin = ballSize * 2;
    const nx = random(margin, width - margin);
    const ny = random(margin, height - margin);

    Matter.Body.setPosition(this.body, { x: nx, y: ny });

    const a = random(TWO_PI);
    Matter.Body.setVelocity(this.body, {
      x: cos(a) * 6,
      y: sin(a) * 6
    });
  }
}

// =========================================================
// p5 setup / draw
// =========================================================
function setup() {
  if (__didInit) return;

  // CPU sanity
  pixelDensity(1);
  frameRate(24);

  const parent = document.querySelector(PARENT_SELECTOR);
  if (!parent) {
    setTimeout(setup, 50);
    return;
  }

  __didInit = true;

  // tell map-core: this is a POI
  const KMAP = window.KMAP;
  if (KMAP?.registerPOIHitTest) {
    KMAP.registerPOIHitTest(t => t && (t === parent || parent.contains(t)));
  }

  const w = parent.clientWidth  || FALLBACK_W;
  const h = parent.clientHeight || FALLBACK_H;

  const c = createCanvas(w, h);
  c.parent(parent);

  const el = c.elt;
  el.style.position = "absolute";
  el.style.left = "0px";
  el.style.top = "0px";
  el.style.width = "100%";
  el.style.height = "100%";
  el.style.pointerEvents = "auto";
  el.style.zIndex = "6";

  engine = Matter.Engine.create();
  world = engine.world;
  world.gravity.y = 0;

  buildWalls();

  stickFigures = [];
  for (let i = 0; i < numStickFigures; i++) {
    const x = random(stickFigureSize, width  - stickFigureSize);
    const y = random(stickFigureSize, height - stickFigureSize);
    stickFigures.push(new StickFigure(x, y));
  }

  ball = new Ball(width / 2, height / 2);
}

function draw() {
  if (!engine || !world || !ball) return;

  background(220);

  // fixed timestep, matched to frameRate
  Matter.Engine.update(engine, 1000 / 24);

  for (const f of stickFigures) {
    f.update();
    f.display();
  }

  ball.display();
  checkBallLegCollisions();
}

function mousePressed() {
  if (!ball) return;
  if (mouseX < 0 || mouseX > width || mouseY < 0 || mouseY > height) return;
  ball.teleportRandomWithKick();
}

// =========================================================
// Walls
// =========================================================
function buildWalls() {
  if (walls.length) {
    for (const w of walls) Matter.World.remove(world, w);
  }
  walls = [];

  const t = wallThickness;

  walls.push(
    Matter.Bodies.rectangle(width / 2, -t / 2, width, t, { isStatic: true }),
    Matter.Bodies.rectangle(width / 2, height + t / 2, width, t, { isStatic: true }),
    Matter.Bodies.rectangle(-t / 2, height / 2, t, height, { isStatic: true }),
    Matter.Bodies.rectangle(width + t / 2, height / 2, t, height, { isStatic: true })
  );

  Matter.World.add(world, walls);
}

// =========================================================
// Manual leg vs ball collision
// =========================================================
function checkBallLegCollisions() {
  if (millis() - lastShotTime < shotCooldown) return;
  if (frameCount % 3 !== 0) return; // throttle (CPU!)

  const bp = ball.body.position;

  for (const f of stickFigures) {
    const fp = f.body.position;

    const bodyLength = stickFigureSize * 0.6;
    const legLength  = stickFigureSize * 0.6;
    const swing = sin(f.stepOffset) * stickFigureSize * 0.25;

    if (
      collideLineCircle(fp.x, fp.y + bodyLength, fp.x - swing, fp.y + bodyLength + legLength, bp.x, bp.y, ballSize) ||
      collideLineCircle(fp.x, fp.y + bodyLength, fp.x + swing, fp.y + bodyLength + legLength, bp.x, bp.y, ballSize)
    ) {
      applyForceToBall(f, ball);
      return;
    }
  }
}

function applyForceToBall(f, b) {
  const a = atan2(
    b.body.position.y - f.body.position.y,
    b.body.position.x - f.body.position.x
  );
  Matter.Body.applyForce(b.body, b.body.position, {
    x: cos(a) * ballShotForce,
    y: sin(a) * ballShotForce
  });
  lastShotTime = millis();
}

// =========================================================
// collide helpers
// =========================================================
function collideLineCircle(x1, y1, x2, y2, xc, yc, d) {
  const l = dist(x1, y1, x2, y2);
  if (!l) return false;

  const t = ((xc - x1)*(x2 - x1) + (yc - y1)*(y2 - y1)) / (l*l);
  const px = x1 + t*(x2 - x1);
  const py = y1 + t*(y2 - y1);

  if (!collidePointLine(px, py, x1, y1, x2, y2)) return false;
  return dist(px, py, xc, yc) <= d * 0.5;
}

function collidePointLine(px, py, x1, y1, x2, y2, buf = 0.1) {
  const d1 = dist(px, py, x1, y1);
  const d2 = dist(px, py, x2, y2);
  const l  = dist(x1, y1, x2, y2);
  return d1 + d2 >= l - buf && d1 + d2 <= l + buf;
}
