(() => {
  let canvas = null;
  let ctx = null;
  let flock = null;
  let listeners = null;
  let inViewport = false;
  let frameId = null;
  let lastUpdate = 0;
  let lastFrame = 0;

  function draw() {
    if (!ctx || !flock) return;
    ctx.clearRect(0, 0, g.width, g.height);
    flock.draw(ctx);
  }

  function animate(now) {
    if (!canvas.isConnected) {
      syncCanvas();
      return;
    }
    const elapsed = now - lastFrame;
    if (elapsed >= g.frame_time - 0.1) {
      flock.update((Math.min(now - lastUpdate, 100) * 60) / 1000);
      lastUpdate = now;
      lastFrame +=
        Math.max(1, Math.floor((elapsed + 0.1) / g.frame_time)) * g.frame_time;
      draw();
    }
    frameId = requestAnimationFrame(animate);
  }

  function syncRunning() {
    const running =
      canvas &&
      ctx &&
      flock &&
      inViewport &&
      g.width > 0 &&
      g.height > 0 &&
      document.visibilityState === "visible";
    if (running && frameId === null) {
      lastUpdate = lastFrame = performance.now();
      frameId = requestAnimationFrame(animate);
    } else if (!running) {
      cancelAnimationFrame(frameId);
      frameId = null;
      g.mouse.down = false;
    }
  }

  function resize() {
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(0, Math.floor(rect.width));
    const height = Math.max(0, Math.floor(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const sizeChanged = width !== g.width || height !== g.height;
    if (width > 0 && height > 0) {
      if (flock && sizeChanged && g.width > 0 && g.height > 0) {
        for (const boid of flock.boids) {
          boid.x *= width / g.width;
          boid.y *= height / g.height;
        }
      }
      g.width = width;
      g.height = height;
      g.circle.center.x = width / 2;
      g.circle.center.y = height / 2;
      g.circle.radius = Math.min(width, height) * 0.4;
      if (canvas.width !== Math.floor(width * dpr))
        canvas.width = Math.floor(width * dpr);
      if (canvas.height !== Math.floor(height * dpr))
        canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!flock)
        flock = new Flock(
          Array.from({ length: g.boid_count }, () => new Boid()),
        );
      else if (sizeChanged) flock.resize();
      draw();
    }
    inViewport =
      width > 0 &&
      height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth;
    syncRunning();
  }

  function updateTheme() {
    g.boid_color =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--boid-color")
        .trim() || "#000";
    draw();
  }

  function releasePointer() {
    g.mouse.down = false;
  }

  function movePointer(event) {
    if (!g.mouse.down) return;
    const rect = canvas.getBoundingClientRect();
    g.mouse.x = ((event.clientX - rect.left) * g.width) / rect.width;
    g.mouse.y = ((event.clientY - rect.top) * g.height) / rect.height;
  }

  const intersectionObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.target !== canvas) continue;
      inViewport = entry.isIntersecting && entry.intersectionRatio > 0;
    }
    syncRunning();
  });
  const resizeObserver = new ResizeObserver(resize);
  const themeObserver = new MutationObserver(updateTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  function syncCanvas() {
    const nextCanvas = document.getElementById("bird_canvas");
    if (nextCanvas === canvas) return;
    cancelAnimationFrame(frameId);
    frameId = null;
    listeners?.abort();
    intersectionObserver.disconnect();
    resizeObserver.disconnect();
    releasePointer();
    canvas = nextCanvas;
    ctx = canvas?.getContext("2d");
    if (!ctx) return;

    listeners = new AbortController();
    const options = { signal: listeners.signal, passive: true };
    canvas.addEventListener(
      "pointerdown",
      (event) => {
        if (frameId === null || !event.isPrimary || event.button !== 0) return;
        g.mouse.down = true;
        movePointer(event);
      },
      options,
    );
    canvas.addEventListener("pointermove", movePointer, options);
    canvas.addEventListener("pointerleave", releasePointer, options);
    canvas.addEventListener("pointercancel", releasePointer, options);
    window.addEventListener("pointerup", releasePointer, options);
    window.addEventListener("blur", releasePointer, options);
    updateTheme();
    resize();
    intersectionObserver.observe(canvas);
    resizeObserver.observe(canvas);
  }

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", syncRunning);
  document.addEventListener("htmx:afterSwap", syncCanvas);
  document.addEventListener("htmx:historyRestore", syncCanvas);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", syncCanvas, { once: true });
  } else {
    syncCanvas();
  }
})();
