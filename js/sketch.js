// sketch.js
// p5.js + Matter.js: wuselnde Strichmännchen + roter Ball
// Klick: Ball springt an zufällige Position und bekommt einen Impuls

// === Matter.js globals ===
let engine, world;

let stickFigures = [];
let ball;

// === Params ===
const numStickFigures = 10;
const stickFigureSize = 30;
const stickFigureSpeed = 2;

const ballSize = 15;
const ballShotForce = 0.05;
let lastShotTime = 0;
const shotCooldown = 500;

// === Collision categories ===
const CATEGORY_WALL = 0x0001;
const CATEGORY_STICK_FIGURE = 0x0002;
const CATEGORY_BALL = 0x0004;

// Keep references so we can remove/update walls on resize
let walls = [];
const wallThickness = 10;

// === StickFigure ===
class StickFigure {
  constructor(x, y) {
    this.body = Matter.Bodies.circle(x, y, stickFigureSize / 2, {
      friction: 0.0,
      restitution: 0.9,
      density: 0.0005,
      label: "stickFigure",
      collisionFilter: {
        category: CATEGORY_STICK_FIGURE,
        mask: CATEGORY_WALL | CATEGORY_STICK_FIGURE // ignores ball
      }
    });

    Matter.World.add(world, this.body);

    const initialAngle = random(TWO_PI);
    Matter.Body.setVelocity(this.body, {
      x: cos(initialAngle) * stickFigureSpeed,
      y: sin(initialAngle) * stickFigureSpeed
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

    // body line
    const bodyLength = stickFigureSize * 0.6;
    line(0, 0, 0, bodyLength);

    // legs (animated)
    const legLength = stickFigureSize * 0.6;
    const legSwing = sin(this.stepOffset) * stickFigureSize * 0.25;

    line(0, bodyLength, -legSwing, bodyLength + legLength);
    line(0, bodyLength,  legSwing, bodyLength + legLength);

    pop();
  }
}

// === Ball ===
class Ball {
  constructor(x, y) {
    this.body = Matter.Bodies.circle(x, y, ballSize / 2, {
      friction: 0,
      restitution: 0.9,
      density: 0.005,
      label: "ball",
      collisionFilter: {
        category: CATEGORY_BALL,
        mask: CATEGORY_WALL // ignores stick figures
      }
    });
    Matter.World.add(world, this.body);
  }

  display() {
    const pos = this.body.position;
    noStroke();
    fill(255, 0, 0); // ROT
    ellipse(pos.x, pos.y, ballSize, ballSize);
  }

  teleportRandom() {
    // random position with margin
    const margin = max(ballSize * 2, wallThickness * 2);
    const nx = random(margin, width - margin);
    const ny = random(margin, height - margin);

    Matter.Body.setPosition(this.body, { x: nx, y: ny });

    // also give it a little random kick
    const a = random(TWO_PI);
    const kick = 6;
    Matter.Body.setVelocity(this.body, { x: cos(a) * kick, y: sin(a) * kick });
  }
}

// === p5 setup ===
function setup() {
  createCanvas(windowWidth, windowHeight);

  engine = Matter.Engine.create();
  world = engine.world;
  world.gravity.y = 0;

  buildWalls();

  stickFigures = [];
  for (let i = 0; i < numStickFigures; i++) {
    const x = random(ballSize * 2, width - ballSize * 2);
    const y = random(ballSize * 2, height - ballSize * 2);
    stickFigures.push(new StickFigure(x, y));
  }

  ball = new Ball(width / 2, height / 2);
}

// === p5 draw ===
function draw() {
  background(220);

  Matter.Engine.update(engine);

  for (const figure of stickFigures) {
    figure.update();
    figure.display();
  }

  ball.display();

  checkBallLegCollisions();
}

// === Click: move ball random ===
function mousePressed() {
  if (!ball) return;
  ball.teleportRandom();
}

// === collision check (legs vs ball) ===
function checkBallLegCollisions() {
  if (millis() - lastShotTime < shotCooldown) return;

  const ballPos = ball.body.position;
  const ballRadius = ballSize / 2;

  for (const figure of stickFigures) {
    const fp = figure.body.position;

    const bodyLength = stickFigureSize * 0.6;
    const legLength = stickFigureSize * 0.6;
    const legSwing = sin(figure.stepOffset) * stickFigureSize * 0.25;

    const leg1StartX = fp.x;
    const leg1StartY = fp.y + bodyLength;
    const leg1EndX = fp.x - legSwing;
    const leg1EndY = fp.y + bodyLength + legLength;

    const leg2StartX = fp.x;
    const leg2StartY = fp.y + bodyLength;
    const leg2EndX = fp.x + legSwing;
    const leg2EndY = fp.y + bodyLength + legLength;

    if (collideLineCircle(leg1StartX, leg1StartY, leg1EndX, leg1EndY, ballPos.x, ballPos.y, ballRadius * 2)) {
      applyForceToBall(figure, ball);
      return;
    }

    if (collideLineCircle(leg2StartX, leg2StartY, leg2EndX, leg2EndY, ballPos.x, ballPos.y, ballRadius * 2)) {
      applyForceToBall(figure, ball);
      return;
    }
  }
}

function applyForceToBall(collidingStickFigure, collidingBall) {
  const angle = atan2(
    collidingBall.body.position.y - collidingStickFigure.body.position.y,
    collidingBall.body.position.x - collidingStickFigure.body.position.x
  );

  Matter.Body.applyForce(collidingBall.body, collidingBall.body.position, {
    x: cos(angle) * ballShotForce,
    y: sin(angle) * ballShotForce
  });

  lastShotTime = millis();
}

// === Resize ===
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);

  // remove old walls
  for (const w of walls) Matter.World.remove(world, w);
  walls = [];
  buildWalls();

  // keep bodies inside bounds a bit
  if (ball) {
    const m = max(ballSize * 2, wallThickness * 2);
    const p = ball.body.position;
    const clamped = {
      x: constrain(p.x, m, width - m),
      y: constrain(p.y, m, height - m)
    };
    Matter.Body.setPosition(ball.body, clamped);
  }
}

// === Walls helper ===
function buildWalls() {
  const t = wallThickness;

  const top = Matter.Bodies.rectangle(width / 2, -t / 2, width, t, {
    isStatic: true,
    collisionFilter: { category: CATEGORY_WALL, mask: CATEGORY_STICK_FIGURE | CATEGORY_BALL }
  });
  const bottom = Matter.Bodies.rectangle(width / 2, height + t / 2, width, t, {
    isStatic: true,
    collisionFilter: { category: CATEGORY_WALL, mask: CATEGORY_STICK_FIGURE | CATEGORY_BALL }
  });
  const left = Matter.Bodies.rectangle(-t / 2, height / 2, t, height, {
    isStatic: true,
    collisionFilter: { category: CATEGORY_WALL, mask: CATEGORY_STICK_FIGURE | CATEGORY_BALL }
  });
  const right = Matter.Bodies.rectangle(width + t / 2, height / 2, t, height, {
    isStatic: true,
    collisionFilter: { category: CATEGORY_WALL, mask: CATEGORY_STICK_FIGURE | CATEGORY_BALL }
  });

  walls = [top, bottom, left, right];
  Matter.World.add(world, walls);
}

// === p5 collide2D helpers (line-circle) ===
function collideLineCircle(x1, y1, x2, y2, xc, yc, dc) {
  let d = dist(x1, y1, x2, y2);
  if (d === 0) return false;

  let dot = ((xc - x1) * (x2 - x1) + (yc - y1) * (y2 - y1)) / pow(d, 2);
  let closestX = x1 + (dot * (x2 - x1));
  let closestY = y1 + (dot * (y2 - y1));

  let onSegment = collidePointLine(closestX, closestY, x1, y1, x2, y2);
  if (!onSegment) return false;

  d = dist(closestX, closestY, xc, yc);
  return d <= dc / 2;
}

function collidePointLine(px, py, x1, y1, x2, y2, buffer) {
  let d1 = dist(px, py, x1, y1);
  let d2 = dist(px, py, x2, y2);
  let lineLen = dist(x1, y1, x2, y2);

  if (buffer === undefined) buffer = 0.1;
  return (d1 + d2 >= lineLen - buffer && d1 + d2 <= lineLen + buffer);
}
