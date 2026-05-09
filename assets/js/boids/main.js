(() => {
  if (window.__boidsMainInitialized) return;
  window.__boidsMainInitialized = true;

  let renderer = null;
  let currentCanvas = null;
  let canvasObserver = null;
  let resizeObserver = null;
  let themeObserver = null;
  let documentVisible = document.visibilityState === "visible";
  let canvasInViewport = false;

  function getThemeBoidColor() {
    const cssColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--boid-color")
      .trim();
    return cssColor || "#000";
  }

  function supportsWorkerRenderer() {
    return Boolean(
      window.BoidsWorkerRenderer &&
        window.__boidsWorkerUrl &&
        typeof Worker !== "undefined" &&
        HTMLCanvasElement.prototype.transferControlToOffscreen,
    );
  }

  function createRenderer() {
    if (renderer) return;

    if (supportsWorkerRenderer()) {
      try {
        renderer = new window.BoidsWorkerRenderer(window.__boidsWorkerUrl);
      } catch (_error) {
        renderer = null;
      }
    }

    if (!renderer) {
      renderer = new window.BoidsMainThreadRenderer();
    }
  }

  function isElementInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.width > 0 &&
      rect.height > 0 &&
      rect.bottom > 0 &&
      rect.right > 0 &&
      rect.top < window.innerHeight &&
      rect.left < window.innerWidth
    );
  }

  function syncRunState() {
    if (!renderer) return;
    const shouldRun = Boolean(
      currentCanvas && documentVisible && canvasInViewport,
    );
    renderer.setRunning(shouldRun);
  }

  function observeCanvas(canvas) {
    if (canvasObserver) {
      canvasObserver.disconnect();
      canvasObserver = null;
    }

    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }

    if (!canvas) {
      canvasInViewport = false;
      return;
    }

    canvasInViewport = isElementInViewport(canvas);
    syncRunState();

    canvasObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.target !== canvas) continue;
          canvasInViewport =
            entry.isIntersecting &&
            entry.intersectionRatio > 0 &&
            entry.target.isConnected;
        }
        syncRunState();
      },
      { threshold: [0, 0.01] },
    );

    canvasObserver.observe(canvas);

    // Also observe canvas size changes to trigger resize on container size changes
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        if (renderer && currentCanvas) {
          renderer.resize();
        }
      });
      resizeObserver.observe(canvas);
    }
  }

  function updateTheme() {
    if (!renderer) return;
    renderer.updateThemeColor(getThemeBoidColor());
  }

  function startThemeSync() {
    if (themeObserver) return;
    updateTheme();
    themeObserver = new MutationObserver(updateTheme);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
  }

  function attachRenderer(canvas) {
    if (!renderer) return false;
    const attached = renderer.attachCanvas(canvas);
    if (attached) return true;

    if (renderer instanceof window.BoidsWorkerRenderer) {
      renderer.destroy();
      renderer = new window.BoidsMainThreadRenderer();
      return renderer.attachCanvas(canvas);
    }

    return false;
  }

  function syncBoids() {
    createRenderer();
    startThemeSync();

    const nextCanvas = document.getElementById("bird_canvas");

    if (!nextCanvas) {
      currentCanvas = null;
      observeCanvas(null);
      if (renderer) renderer.detachCanvas();
      syncRunState();
      return;
    }

    if (currentCanvas !== nextCanvas) {
      currentCanvas = nextCanvas;
      attachRenderer(nextCanvas);
      observeCanvas(nextCanvas);
    }

    if (renderer) {
      renderer.resize();
      updateTheme();
    }
    syncRunState();
  }

  function onVisibilityChange() {
    documentVisible = document.visibilityState === "visible";
    syncRunState();
  }

  function onResize() {
    if (!renderer || !currentCanvas) return;
    renderer.resize();
    canvasInViewport = isElementInViewport(currentCanvas);
    syncRunState();
  }

  window.addEventListener("resize", onResize);
  document.addEventListener("visibilitychange", onVisibilityChange);
  document.addEventListener("DOMContentLoaded", syncBoids);
  document.addEventListener("htmx:afterSwap", syncBoids);
  document.addEventListener("htmx:afterSettle", syncBoids);
  document.addEventListener("htmx:historyRestore", syncBoids);
})();
