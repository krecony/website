(() => {
  const canvas = document.getElementById("bird_canvas");
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;

  let flock = null;
  let inViewport = false;
  let frameId = null;
  let lastUpdate = 0;
  let lastFrame = 0;

  function draw() {
    if (!flock) return;
    ctx.clearRect(0, 0, g.width, g.height);
    flock.draw(ctx);
  }

  function animate(now) {
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
      flock && inViewport && document.visibilityState === "visible";
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

  const intersectionObserver = new IntersectionObserver(([entry]) => {
    inViewport = entry.isIntersecting && entry.intersectionRatio > 0;
    syncRunning();
  });
  const resizeObserver = new ResizeObserver(resize);
  const themeObserver = new MutationObserver(updateTheme);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });

  canvas.addEventListener(
    "pointerdown",
    (event) => {
      if (frameId === null || !event.isPrimary || event.button !== 0) return;
      g.mouse.down = true;
      movePointer(event);
    },
    { passive: true },
  );
  canvas.addEventListener("pointermove", movePointer, { passive: true });
  canvas.addEventListener("pointerleave", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  window.addEventListener("pointerup", releasePointer);
  window.addEventListener("blur", releasePointer);

  window.addEventListener("resize", resize);
  document.addEventListener("visibilitychange", syncRunning);
  updateTheme();
  resize();
  intersectionObserver.observe(canvas);
  resizeObserver.observe(canvas);
})();
