(() => {
  if (window.__boidsMainInitialized) return;
  window.__boidsMainInitialized = true;

  let rafId = null;
  let canvas = null;
  let ctx = null;
  let flock = null;
  let last = 0;
  const onMouseOver = () => {
    g.mouse.over = true;
  };
  const onMouseOut = () => {
    g.mouse.over = false;
  };

  function getPoint(event) {
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    if (event.touches && event.touches.length > 0) {
      return {
        x: event.touches[0].clientX - rect.left,
        y: event.touches[0].clientY - rect.top,
      };
    }
    if (event.changedTouches && event.changedTouches.length > 0) {
      return {
        x: event.changedTouches[0].clientX - rect.left,
        y: event.changedTouches[0].clientY - rect.top,
      };
    }
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function updateMousePosition(event) {
    const point = getPoint(event);
    if (!point) return;
    g.mouse.x = point.x;
    g.mouse.y = point.y;
  }

  function down(event) {
    updateMousePosition(event);
    g.mouse.down = true;
  }

  function up() {
    g.mouse.down = false;
  }

  function move(event) {
    updateMousePosition(event);
  }

  function resizeCanvas() {
    if (!canvas || !ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const dpr = window.devicePixelRatio || 1;

    g.width = width;
    g.height = height;

    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    g.circle.center.x = g.width / 2;
    g.circle.center.y = g.height / 2;
    g.circle.radius = Math.min(g.width, g.height) * 0.4;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (flock) flock.resize();
  }

  function animate(now) {
    if (flock && now - last >= g.frame_time) {
      last = now - ((now - last) % g.frame_time);
      flock.update();
      if (canvas && ctx) {
        ctx.clearRect(0, 0, g.width, g.height);
        flock.draw(ctx);
      }
    }

    rafId = requestAnimationFrame(animate);
  }

  function startLoop() {
    if (rafId !== null) return;
    last = 0;
    rafId = requestAnimationFrame(animate);
  }

  function bindCanvasListeners() {
    canvas.addEventListener("mouseover", onMouseOver);
    canvas.addEventListener("mouseout", onMouseOut);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("touchmove", move, { passive: true });
    canvas.addEventListener("mousedown", down);
    canvas.addEventListener("touchstart", down, { passive: true });
    canvas.addEventListener("mouseup", up);
    canvas.addEventListener("touchend", up, { passive: true });
  }

  function unbindCanvasListeners(oldCanvas) {
    oldCanvas.removeEventListener("mouseover", onMouseOver);
    oldCanvas.removeEventListener("mouseout", onMouseOut);
    oldCanvas.removeEventListener("mousemove", move);
    oldCanvas.removeEventListener("touchmove", move);
    oldCanvas.removeEventListener("mousedown", down);
    oldCanvas.removeEventListener("touchstart", down);
    oldCanvas.removeEventListener("mouseup", up);
    oldCanvas.removeEventListener("touchend", up);
  }

  function detachCanvas() {
    if (!canvas) return;
    unbindCanvasListeners(canvas);
    canvas = null;
    ctx = null;
    g.mouse.over = false;
    g.mouse.down = false;
  }

  function attachCanvas(nextCanvas) {
    if (canvas === nextCanvas && ctx) {
      resizeCanvas();
      return;
    }

    detachCanvas();
    canvas = nextCanvas;
    ctx = canvas.getContext("2d");
    bindCanvasListeners();
    resizeCanvas();
  }

  function syncBoids() {
    const nextCanvas = document.getElementById("bird_canvas");
    if (!nextCanvas) {
      detachCanvas();
      startLoop();
      return;
    }

    attachCanvas(nextCanvas);

    if (!flock) {
      const boids = [];
      for (let i = 0; i < g.boid_count; i++) {
        boids.push(new Boid());
      }
      flock = new Flock(boids);
    }

    flock.resize();

    startLoop();
  }

  window.addEventListener("resize", resizeCanvas);
  document.addEventListener("DOMContentLoaded", syncBoids);
  document.addEventListener("htmx:afterSwap", syncBoids);
  document.addEventListener("htmx:afterSettle", syncBoids);
  document.addEventListener("htmx:historyRestore", syncBoids);
})();
