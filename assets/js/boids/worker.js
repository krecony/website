let canvas = null;
let ctx = null;
let timerId = null;
let running = false;
let last = 0;

let g = null;
let flock = null;

function rand(a, b) {
  const min = b === undefined ? 0 : a;
  const max = b === undefined ? a : b;
  return Math.random() * (max - min) + min;
}

class Boid {
  constructor() {
    if (g.circle.boundary) {
      const angle = rand(0, 2 * Math.PI);
      const dist = rand(0, g.circle.radius);

      this.x = Math.cos(angle) * dist + g.circle.center.x;
      this.y = Math.sin(angle) * dist + g.circle.center.y;
    } else {
      this.x = rand(g.width);
      this.y = rand(g.height);
    }

    this.vx = rand(g.minVel, g.maxVel);
    this.vy = rand(g.minVel, g.maxVel);
    this.size = g.boid_size;
  }

  update(flockInstance) {
    let closeDx = 0;
    let closeDy = 0;

    let xVel = 0;
    let yVel = 0;

    let xPos = 0;
    let yPos = 0;

    let neighbours = 0;
    const i = Math.floor(this.x / flockInstance.b_width);
    const j = Math.floor(this.y / flockInstance.b_height);

    for (let bi = i - 1; bi <= i + 1; bi++) {
      if (bi < 0 || bi >= flockInstance.cols) continue;
      for (let bj = j - 1; bj <= j + 1; bj++) {
        if (bj < 0 || bj >= flockInstance.rows) continue;
        const bucket = flockInstance.buckets[bj * flockInstance.cols + bi];
        for (let k = 0; k < bucket.length; k++) {
          const boid = bucket[k];
          if (boid === this) continue;

          const dx = this.x - boid.x;
          const dy = this.y - boid.y;
          const sqDist = dx * dx + dy * dy;

          if (sqDist <= g.protected_range_sq) {
            closeDx += dx;
            closeDy += dy;
          } else if (sqDist <= g.visible_range_sq) {
            xVel += boid.vx;
            yVel += boid.vy;
            xPos += boid.x;
            yPos += boid.y;
            neighbours += 1;
          }
        }
      }
    }

    if (neighbours > 0) {
      xVel /= neighbours;
      yVel /= neighbours;
      xPos /= neighbours;
      yPos /= neighbours;

      this.vx += (xVel - this.vx) * g.matching_factor;
      this.vy += (yVel - this.vy) * g.matching_factor;
      this.vx += (xPos - this.x) * g.centering_factor;
      this.vy += (yPos - this.y) * g.centering_factor;
    }

    this.vx += closeDx * g.avoid_factor;
    this.vy += closeDy * g.avoid_factor;

    if (g.circle.boundary) this.turnCircle();
    else this.turnRectangle();

    if (g.mouse.down && g.mouse.over) {
      const dx = g.mouse.x - this.x;
      const dy = g.mouse.y - this.y;
      const distSq = dx * dx + dy * dy;
      if (distSq > 0 && distSq <= g.click_range_sq) {
        const invDist = 1 / Math.sqrt(distSq);
        this.vx += dx * invDist * g.click_strength;
        this.vy += dy * invDist * g.click_strength;
      }
    }

    const speedSq = this.vx * this.vx + this.vy * this.vy;
    if (speedSq > g.max_speed_sq) {
      const scale = g.max_speed / Math.sqrt(speedSq);
      this.vx *= scale;
      this.vy *= scale;
    } else if (speedSq > 0 && speedSq < g.min_speed_sq) {
      const scale = g.min_speed / Math.sqrt(speedSq);
      this.vx *= scale;
      this.vy *= scale;
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  draw(ctx2d) {
    ctx2d.save();

    const angle = Math.atan2(this.vy, this.vx);
    ctx2d.translate(this.x, this.y);
    ctx2d.rotate(angle);
    ctx2d.beginPath();
    ctx2d.moveTo(this.size, 0);
    ctx2d.lineTo(-this.size * 0.6, this.size * 0.5);
    ctx2d.lineTo(-this.size * 0.6, -this.size * 0.5);
    ctx2d.closePath();
    ctx2d.fillStyle = g.boid_color;
    ctx2d.fill();
    ctx2d.restore();
  }

  turnRectangle() {
    if (this.x < g.margin) this.vx += g.turn_factor;
    if (this.x > g.width - g.margin) this.vx -= g.turn_factor;
    if (this.y < g.margin) this.vy += g.turn_factor;
    if (this.y > g.height - g.margin) this.vy -= g.turn_factor;
  }

  turnCircle() {
    const dxOrigin = this.x - g.circle.center.x;
    const dyOrigin = this.y - g.circle.center.y;
    const distToOrigin = Math.sqrt(dxOrigin * dxOrigin + dyOrigin * dyOrigin);
    const distToEdge = g.circle.radius - distToOrigin;

    if (distToEdge <= g.margin) {
      this.vx -= (g.turn_factor * dxOrigin) / distToOrigin;
      this.vy -= (g.turn_factor * dyOrigin) / distToOrigin;
    } else {
      this.vx -= (g.turn_factor * dxOrigin) / distToOrigin / 3;
      this.vy -= (g.turn_factor * dyOrigin) / distToOrigin / 3;
    }
    if (distToOrigin <= g.circle.radius / 3) {
      this.vx += (g.turn_factor * dxOrigin) / distToOrigin / 5;
      this.vy += (g.turn_factor * dyOrigin) / distToOrigin / 5;
    }
  }
}

class Flock {
  constructor(boids) {
    this.boids = boids;
    this.cols = 10;
    this.rows = 10;
    this.buckets = [];
    this.resize();
  }

  resize() {
    this.b_width = Math.max(1, Math.ceil(g.width / this.cols));
    this.b_height = Math.max(1, Math.ceil(g.height / this.rows));
    this.buckets = Array.from({ length: this.cols * this.rows }, () => []);
  }

  getBucketIndex(x, y) {
    const i = Math.max(
      0,
      Math.min(this.cols - 1, Math.floor(x / this.b_width)),
    );
    const j = Math.max(
      0,
      Math.min(this.rows - 1, Math.floor(y / this.b_height)),
    );
    return j * this.cols + i;
  }

  update() {
    for (const bucket of this.buckets) {
      bucket.length = 0;
    }
    for (const boid of this.boids) {
      const idx = this.getBucketIndex(boid.x, boid.y);
      this.buckets[idx].push(boid);
    }
    for (const boid of this.boids) {
      boid.update(this);
    }
  }

  draw(ctx2d) {
    for (const boid of this.boids) {
      boid.draw(ctx2d);
    }
  }
}

function buildRuntimeConfig(baseConfig) {
  const runtime = structuredClone(baseConfig);

  runtime.mouse = {
    x: 0,
    y: 0,
    over: false,
    down: false,
  };

  runtime.circle = runtime.circle || {
    boundary: true,
    radius: 0,
    center: { x: 0, y: 0 },
  };
  runtime.circle.center = runtime.circle.center || { x: 0, y: 0 };

  runtime.protected_range_sq =
    runtime.protected_range * runtime.protected_range;
  runtime.visible_range_sq = runtime.visible_range * runtime.visible_range;
  runtime.click_range_sq = runtime.click_range * runtime.click_range;
  runtime.max_speed_sq = runtime.max_speed * runtime.max_speed;
  runtime.min_speed_sq = runtime.min_speed * runtime.min_speed;
  runtime.frame_time = 1000 / runtime.fps;
  return runtime;
}

function ensureFlock() {
  if (flock) return;
  const boids = [];
  for (let i = 0; i < g.boid_count; i++) {
    boids.push(new Boid());
  }
  flock = new Flock(boids);
}

function resize(metrics) {
  if (!canvas || !ctx || !g || !metrics) return;

  g.width = metrics.width;
  g.height = metrics.height;

  canvas.width = Math.floor(metrics.width * metrics.dpr);
  canvas.height = Math.floor(metrics.height * metrics.dpr);

  g.circle.center.x = g.width / 2;
  g.circle.center.y = g.height / 2;
  g.circle.radius = Math.min(g.width, g.height) * 0.4;

  ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
  if (flock) flock.resize();
}

function stopLoop() {
  if (timerId === null) return;
  clearTimeout(timerId);
  timerId = null;
}

function tick(now) {
  if (!running || !ctx || !flock) {
    timerId = null;
    return;
  }

  if (now - last >= g.frame_time) {
    last = now - ((now - last) % g.frame_time);
    flock.update();
    ctx.clearRect(0, 0, g.width, g.height);
    flock.draw(ctx);
  }

  timerId = setTimeout(() => tick(performance.now()), 0);
}

function startLoop() {
  if (!running || timerId !== null || !ctx || !flock) return;
  last = 0;
  timerId = setTimeout(() => tick(performance.now()), 0);
}

function setRunning(nextRunning) {
  running = Boolean(nextRunning && ctx && flock);
  if (running) startLoop();
  else stopLoop();
}

self.onmessage = (event) => {
  const message = event.data || {};

  switch (message.type) {
    case "init": {
      canvas = message.canvas;
      g = buildRuntimeConfig(message.config);
      ctx = canvas.getContext("2d");
      resize(message.metrics);
      ensureFlock();
      break;
    }
    case "resize":
      resize(message.metrics);
      break;
    case "theme":
      if (g) g.boid_color = message.color || "#000";
      break;
    case "pointer-move":
      if (g) {
        g.mouse.x = message.x;
        g.mouse.y = message.y;
      }
      break;
    case "pointer-over":
      if (g) g.mouse.over = Boolean(message.over);
      break;
    case "pointer-down":
      if (g) g.mouse.down = Boolean(message.down);
      break;
    case "visibility":
      setRunning(Boolean(message.visible));
      break;
    case "detach":
      setRunning(false);
      if (g) {
        g.mouse.over = false;
        g.mouse.down = false;
      }
      break;
    case "destroy":
      setRunning(false);
      canvas = null;
      ctx = null;
      flock = null;
      g = null;
      break;
    default:
      break;
  }
};
