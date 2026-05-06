(() => {
  class BoidsRendererBase {
    constructor() {
      this.canvas = null;
      this.running = false;
      this.bound = false;

      this.onMouseOver = () => {
        if (!this.running) return;
        this.handlePointerOver(true);
      };

      this.onMouseOut = () => {
        this.handlePointerOver(false);
        this.handlePointerDown(false);
      };

      this.onDown = (event) => {
        if (!this.running) return;
        const point = this.getPoint(event);
        if (!point) return;
        this.handlePointerMove(point);
        this.handlePointerDown(true);
      };

      this.onUp = () => {
        this.handlePointerDown(false);
      };

      this.onMove = (event) => {
        if (!this.running) return;
        const point = this.getPoint(event);
        if (!point) return;
        this.handlePointerMove(point);
      };
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

    attachCanvas(nextCanvas) {
      if (!nextCanvas) return false;
      if (this.canvas === nextCanvas && this.canResize()) {
        this.resize();
        return true;
      }

      this.detachCanvas();
      this.canvas = nextCanvas;

      if (!this.onAttachCanvas()) {
        this.canvas = null;
        return false;
      }

      this.bindCanvasListeners();
      this.resize();
      this.afterAttach();
      return true;
    }

    detachCanvas() {
      this.setRunning(false);
      this.unbindCanvasListeners();
      this.onDetachCanvas();
      this.canvas = null;
    }

    setRunning(shouldRun) {
      this.running = Boolean(shouldRun && this.canvas && this.canRun());
      this.onRunningChanged(this.running);
    }

    resize() {
      if (!this.canvas) return;
      const metrics = this.getCanvasMetrics();
      this.onResize(metrics);
      this.afterResize(metrics);
    }

    updateThemeColor(color) {
      this.onThemeChanged(color || "#000");
    }

    destroy() {
      this.detachCanvas();
    }

    canResize() {
      return true;
    }

    canRun() {
      return true;
    }

    onAttachCanvas() {
      return true;
    }

    onDetachCanvas() {}

    onResize(_metrics) {}

    afterResize(_metrics) {}

    afterAttach() {}

    onRunningChanged(_running) {}

    onThemeChanged(_color) {}

    handlePointerMove(_point) {}

    handlePointerOver(_over) {}

    handlePointerDown(_down) {}
  }

  window.BoidsRendererBase = BoidsRendererBase;
})();
