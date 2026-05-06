(() => {
  class BoidsWorkerRenderer extends window.BoidsRendererBase {
    constructor(workerUrl) {
      super();
      if (!workerUrl) throw new Error("Missing boids worker URL");

      this.worker = new Worker(workerUrl);
      this.failed = false;
      this.worker.addEventListener("error", () => {
        this.failed = true;
      });
    }

    canRun() {
      return Boolean(this.worker && !this.failed);
    }

    canResize() {
      return this.canRun() && Boolean(this.canvas);
    }

    onAttachCanvas() {
      if (!this.canRun()) return false;
      if (!this.canvas.transferControlToOffscreen) return false;

      const offscreen = this.canvas.transferControlToOffscreen();
      this.worker.postMessage(
        {
          type: "init",
          canvas: offscreen,
          metrics: this.getCanvasMetrics(),
          config: g,
        },
        [offscreen],
      );
      return true;
    }

    onDetachCanvas() {
      if (!this.canRun()) return;
      this.worker.postMessage({ type: "detach" });
      this.worker.postMessage({ type: "pointer-down", down: false });
      this.worker.postMessage({ type: "pointer-over", over: false });
    }

    onResize(metrics) {
      if (!this.canRun()) return;
      this.worker.postMessage({ type: "resize", metrics });
    }

    onRunningChanged(running) {
      if (!this.canRun()) return;
      if (!running) {
        this.worker.postMessage({ type: "pointer-down", down: false });
      }
      this.worker.postMessage({
        type: "visibility",
        visible: Boolean(running && this.canvas),
      });
    }

    onThemeChanged(color) {
      if (!this.canRun()) return;
      this.worker.postMessage({ type: "theme", color });
    }

    handlePointerMove(point) {
      if (!this.canRun()) return;
      this.worker.postMessage({ type: "pointer-move", ...point });
    }

    handlePointerOver(over) {
      if (!this.canRun()) return;
      this.worker.postMessage({ type: "pointer-over", over });
    }

    handlePointerDown(down) {
      if (!this.canRun()) return;
      this.worker.postMessage({ type: "pointer-down", down });
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
