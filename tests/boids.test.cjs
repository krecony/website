const { test } = require("node:test");
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const vm = require("node:vm");

const source = (name) =>
  readFileSync(join(__dirname, "../assets/js/boids", name + ".js"), "utf8");
function simulation(overrides = {}) {
  const context = vm.createContext({});
  vm.runInContext(["config", "boid", "flock"].map(source).join("\n"), context);
  const api = vm.runInContext("({ g, Boid, Flock })", context);
  Object.assign(api.g, { width: 600, height: 400 }, overrides);
  api.g.circle.center = { x: api.g.width / 2, y: api.g.height / 2 };
  api.g.circle.radius = Math.min(api.g.width, api.g.height) * 0.4;
  return { ...api, context };
}
const near = (actual, expected) =>
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

for (const [width, height] of [
  [80, 60],
  [600, 400],
  [1920, 1080],
]) {
  test(`grid agrees with all-pairs forces at ${width}x${height}, including outside edges`, () => {
    const { g, Boid, Flock } = simulation({
      width,
      height,
      turn_factor: 0,
      min_speed_sq: 0,
      max_speed_sq: Infinity,
    });
    const boids = Array.from({ length: 120 }, (_, i) =>
      Object.assign(new Boid(), {
        x: ((i * 17) % (width + 80)) - 40,
        y: ((i * 13) % (height + 80)) - 40,
        vx: (i % 7) - 3,
        vy: (i % 5) - 2,
      }),
    );
    const expected = boids.map((a) => {
      let sx = 0,
        sy = 0,
        px = 0,
        py = 0,
        vx = 0,
        vy = 0,
        count = 0;
      for (const b of boids) {
        if (a === b) continue;
        const dx = a.x - b.x,
          dy = a.y - b.y;
        if (dx * dx + dy * dy <= g.protected_range_sq) {
          sx += dx;
          sy += dy;
        } else if (dx * dx + dy * dy <= g.visible_range_sq) {
          px += b.x;
          py += b.y;
          vx += b.vx;
          vy += b.vy;
          count++;
        }
      }
      return [
        a.vx +
          2 *
            (sx * g.avoid_factor +
              (count
                ? (vx / count - a.vx) * g.matching_factor +
                  (px / count - a.x) * g.centering_factor
                : 0)),
        a.vy +
          2 *
            (sy * g.avoid_factor +
              (count
                ? (vy / count - a.vy) * g.matching_factor +
                  (py / count - a.y) * g.centering_factor
                : 0)),
      ];
    });
    new Flock(boids).update(2);
    boids.forEach((b, i) => {
      near(b.vx, expected[i][0]);
      near(b.vy, expected[i][1]);
    });
  });
}

test("one second of flight covers the same distance at 15, 30, 60 and 144 FPS", () => {
  for (const fps of [15, 30, 60, 144]) {
    const { Boid, Flock } = simulation({ turn_factor: 0 });
    const bird = Object.assign(new Boid(), { x: 100, y: 100, vx: 2, vy: 0 });
    const flock = new Flock([bird]);
    for (let i = 0; i < fps; i++) flock.update(60 / fps);
    near(bird.x, 220);
    near(bird.y, 100);
  }
});

test("circle center, zero velocity and coincident pointer stay finite; drawing uses one fill", () => {
  const { g, Boid, Flock } = simulation();
  const bird = Object.assign(new Boid(), {
    x: g.circle.center.x,
    y: g.circle.center.y,
    vx: 0,
    vy: 0,
  });
  Object.assign(g.mouse, { down: true, x: bird.x, y: bird.y });
  const flock = new Flock([bird]);
  flock.update(2);
  let fills = 0;
  const point = (...values) =>
    values.forEach((value) => assert.ok(Number.isFinite(value)));
  flock.draw({
    beginPath() {},
    moveTo: point,
    lineTo: point,
    closePath() {},
    fill() {
      fills++;
    },
  });
  assert.equal(fills, 1);
  assert.ok([bird.x, bird.y, bird.vx, bird.vy].every(Number.isFinite));
});

test("flock remains finite and speed-limited over sustained 30 FPS flight", () => {
  const { g, Boid, Flock } = simulation();
  const flock = new Flock(
    Array.from({ length: g.boid_count }, () => new Boid()),
  );
  for (let frame = 0; frame < 600; frame++) flock.update(2);
  for (const bird of flock.boids) {
    assert.ok([bird.x, bird.y, bird.vx, bird.vy].every(Number.isFinite));
    const speed = Math.hypot(bird.vx, bird.vy);
    assert.ok(speed >= g.min_speed - 1e-9 && speed <= g.max_speed + 1e-9);
  }
});

function page() {
  const api = simulation({ boid_count: 1, turn_factor: 0 });
  const document = new EventTarget();
  const window = new EventTarget();
  let now = 0,
    nextId = 0;
  const canvas = new EventTarget();
  const frames = new Map();
  const observers = [];
  class Observer {
    constructor(callback) {
      this.callback = callback;
      observers.push(this);
    }
    observe() {}
  }
  Object.assign(document, {
    visibilityState: "visible",
    documentElement: {},
    getElementById: () => canvas,
  });
  Object.assign(window, {
    innerWidth: 1000,
    innerHeight: 1000,
    devicePixelRatio: 3,
  });
  Object.assign(api.context, {
    document,
    window,
    IntersectionObserver: Observer,
    ResizeObserver: Observer,
    MutationObserver: Observer,
    getComputedStyle: () => ({ getPropertyValue: () => "#fff" }),
    performance: { now: () => now },
    requestAnimationFrame: (fn) => {
      frames.set(++nextId, fn);
      return nextId;
    },
    cancelAnimationFrame: (id) => frames.delete(id),
  });
  const updates = [];
  api.Flock.prototype.update = (dt) => updates.push(dt);
  function resizeCanvas(width = 600, height = 400) {
    Object.assign(canvas, {
      width: 300,
      height: 150,
      getBoundingClientRect: () => ({
        width,
        height,
        left: 0,
        top: 0,
        right: width,
        bottom: height,
      }),
      getContext: () => ({
        clearRect() {},
        setTransform() {},
        beginPath() {},
        moveTo() {},
        lineTo() {},
        closePath() {},
        fill() {},
      }),
    });
    return canvas;
  }
  resizeCanvas();
  vm.runInContext(source("main"), api.context);
  function tick(time) {
    now = time;
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((fn) => fn(now));
  }
  return {
    ...api,
    document,
    window,
    frames,
    observers,
    updates,
    tick,
    resizeCanvas,
    canvas,
  };
}

test("frame limiter preserves elapsed time across display rates and caps stalls", () => {
  for (const refreshRate of [30, 60, 120, 144]) {
    const p = page();
    for (let i = 1; i <= refreshRate * 2; i++) p.tick((i * 1000) / refreshRate);
    assert.equal(p.updates.length, 60);
    near(
      p.updates.reduce((sum, dt) => sum + dt, 0),
      120,
    );
    assert.equal(p.frames.size, 1);
    p.tick(10000);
    assert.equal(p.updates.at(-1), 6);
  }
});

test("visibility, resizing, theme and pointer lifecycle", () => {
  const p = page();
  assert.equal(p.canvas.width, 1200); // DPR is capped at 2.
  const down = new Event("pointerdown");
  Object.assign(down, { isPrimary: true, button: 0, clientX: 80, clientY: 90 });
  p.canvas.dispatchEvent(down);
  assert.equal(p.g.mouse.down, true);
  assert.equal(p.g.mouse.x, 80);
  p.window.dispatchEvent(new Event("pointerup"));
  assert.equal(p.g.mouse.down, false);
  p.document.visibilityState = "hidden";
  p.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(p.frames.size, 0);
  p.tick(10000);
  p.document.visibilityState = "visible";
  p.document.dispatchEvent(new Event("visibilitychange"));
  p.tick(10000 + 1000 / 30);
  near(p.updates.at(-1), 2);
  p.resizeCanvas(320, 200);
  p.observers[1].callback();
  assert.equal(p.frames.size, 1);
  assert.equal(p.g.width, 320);
  p.observers[0].callback([
    { target: p.canvas, isIntersecting: false, intersectionRatio: 0 },
  ]);
  assert.equal(p.frames.size, 0);
  p.observers[0].callback([
    { target: p.canvas, isIntersecting: true, intersectionRatio: 1 },
  ]);
  assert.equal(p.frames.size, 1);
  p.observers[2].callback();
  assert.equal(p.g.boid_color, "#fff");
});
