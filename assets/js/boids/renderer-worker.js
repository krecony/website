(() => {
  class BoidsWorkerRenderer {
    constructor(workerUrl) {
      if (!workerUrl) throw new Error("Missing boids worker URL");
      this.worker = new Worker(workerUrl);
      this.canvas = null;
      this.running = false;
      this.failed = false;
      this.bound = false;

      this.onMouseOver = () => {
        if (!this.running) return;
        this.worker.postMessage({ type: "pointer-over", over: true });
      };

      this.onMouseOut = () => {
        this.worker.postMessage({ type: "pointer-over", over: false });
        this.worker.postMessage({ type: "pointer-down", down: false });
      };

      this.onDown = (event) => {
        if (!this.running) return;
        const point = this.getPoint(event);
        if (!point) return;
        this.worker.postMessage({ type: "pointer-move", ...point });
        this.worker.postMessage({ type: "pointer-down", down: true });
      };

      this.onUp = () => {
        this.worker.postMessage({ type: "pointer-down", down: false });
      };

      this.onMove = (event) => {
        if (!this.running) return;
        const point = this.getPoint(event);
        if (!point) return;
        this.worker.postMessage({ type: "pointer-move", ...point });
      };

      this.worker.addEventListener("error", () => {
        this.failed = true;
      });
    }

    getPoint(event) {
      if (!this.canvas) return null;

      const rect = this.canvas.getBoundingClientRect();
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

    getCanvasMetrics() {
      if (!this.canvas) return null;

      const rect = this.canvas.getBoundingClientRect();
      return {
        width: Math.max(1, Math.floor(rect.width)),
        height: Math.max(1, Math.floor(rect.height)),
        dpr: window.devicePixelRatio || 1,
      };
    }

    bindCanvasListeners() {
      if (!this.canvas || this.bound) return;
      this.bound = true;
      this.canvas.addEventListener("mouseover", this.onMouseOver);
      this.canvas.addEventListener("mouseout", this.onMouseOut);
      this.canvas.addEventListener("mousemove", this.onMove);
      this.canvas.addEventListener("touchmove", this.onMove, { passive: true });
      this.canvas.addEventListener("mousedown", this.onDown);
      this.canvas.addEventListener("touchstart", this.onDown, {
        passive: true,
      });
      this.canvas.addEventListener("mouseup", this.onUp);
      this.canvas.addEventListener("touchend", this.onUp, { passive: true });
      this.canvas.addEventListener("touchcancel", this.onUp, { passive: true });
    }

    unbindCanvasListeners() {
      if (!this.canvas || !this.bound) return;
      this.bound = false;
      this.canvas.removeEventListener("mouseover", this.onMouseOver);
      this.canvas.removeEventListener("mouseout", this.onMouseOut);
      this.canvas.removeEventListener("mousemove", this.onMove);
      this.canvas.removeEventListener("touchmove", this.onMove);
      this.canvas.removeEventListener("mousedown", this.onDown);
      this.canvas.removeEventListener("touchstart", this.onDown);
      this.canvas.removeEventListener("mouseup", this.onUp);
      this.canvas.removeEventListener("touchend", this.onUp);
      this.canvas.removeEventListener("touchcancel", this.onUp);
    }

    postVisibility() {
      if (!this.worker || this.failed) return;
      this.worker.postMessage({
        type: "visibility",
        visible: Boolean(this.running && this.canvas),
      });
    }

    attachCanvas(nextCanvas) {
      if (!this.worker || this.failed) return false;
      if (!nextCanvas || !nextCanvas.transferControlToOffscreen) return false;
      if (this.canvas === nextCanvas) {
        this.resize();
        return true;
      }

      this.detachCanvas();
      this.canvas = nextCanvas;
      this.bindCanvasListeners();

      const offscreen = nextCanvas.transferControlToOffscreen();
      const metrics = this.getCanvasMetrics();
      this.worker.postMessage(
        {
          type: "init",
          canvas: offscreen,
          metrics,
          config: g,
        },
        [offscreen],
      );
      this.postVisibility();
      return true;
    }

    resize() {
      if (!this.worker || this.failed || !this.canvas) return;
      const metrics = this.getCanvasMetrics();
      this.worker.postMessage({ type: "resize", metrics });
    }

    setRunning(shouldRun) {
      this.running = Boolean(shouldRun);
      if (!this.running) {
        this.worker.postMessage({ type: "pointer-down", down: false });
      }
      this.postVisibility();
    }

    updateThemeColor(color) {
      if (!this.worker || this.failed) return;
      this.worker.postMessage({ type: "theme", color: color || "#000" });
    }

    detachCanvas() {
      this.unbindCanvasListeners();
      this.canvas = null;
      if (!this.worker || this.failed) return;
      this.worker.postMessage({ type: "detach" });
      this.worker.postMessage({ type: "pointer-down", down: false });
      this.worker.postMessage({ type: "pointer-over", over: false });
    }

    destroy() {
      this.detachCanvas();
      if (!this.worker) return;
      this.worker.postMessage({ type: "destroy" });
      this.worker.terminate();
      this.worker = null;
    }
  }

  window.BoidsWorkerRenderer = BoidsWorkerRenderer;
})();
