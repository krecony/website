(() => {
  class BoidsMainThreadRenderer {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.flock = null;
      this.rafId = null;
      this.last = 0;
      this.running = false;

      this.onMouseOver = () => {
        if (!this.running) return;
        g.mouse.over = true;
      };

      this.onMouseOut = () => {
        g.mouse.over = false;
        g.mouse.down = false;
      };

      this.onDown = (event) => {
        if (!this.running) return;
        this.updateMousePosition(event);
        g.mouse.down = true;
      };

      this.onUp = () => {
        g.mouse.down = false;
      };

      this.onMove = (event) => {
        if (!this.running) return;
        this.updateMousePosition(event);
      };

      this.animate = (now) => {
        if (!this.running) {
          this.rafId = null;
          return;
        }

        if (this.flock && now - this.last >= g.frame_time) {
          this.last = now - ((now - this.last) % g.frame_time);
          this.flock.update();
          if (this.canvas && this.ctx) {
            this.ctx.clearRect(0, 0, g.width, g.height);
            this.flock.draw(this.ctx);
          }
        }

        this.rafId = requestAnimationFrame(this.animate);
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

    updateMousePosition(event) {
      const point = this.getPoint(event);
      if (!point) return;
      g.mouse.x = point.x;
      g.mouse.y = point.y;
    }

    bindCanvasListeners() {
      if (!this.canvas) return;
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
      if (!this.canvas) return;
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

    createFlockIfNeeded() {
      if (this.flock) return;
      const boids = [];
      for (let i = 0; i < g.boid_count; i++) {
        boids.push(new Boid());
      }
      this.flock = new Flock(boids);
    }

    resize() {
      if (!this.canvas || !this.ctx) return;

      const rect = this.canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const dpr = window.devicePixelRatio || 1;

      g.width = width;
      g.height = height;

      this.canvas.width = Math.floor(width * dpr);
      this.canvas.height = Math.floor(height * dpr);

      g.circle.center.x = g.width / 2;
      g.circle.center.y = g.height / 2;
      g.circle.radius = Math.min(g.width, g.height) * 0.4;

      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.flock) this.flock.resize();
    }

    startLoop() {
      if (this.rafId !== null || !this.canvas || !this.ctx) return;
      this.last = 0;
      this.rafId = requestAnimationFrame(this.animate);
    }

    stopLoop() {
      if (this.rafId === null) return;
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    setRunning(shouldRun) {
      this.running = Boolean(shouldRun && this.canvas && this.ctx);
      if (this.running) {
        this.startLoop();
      } else {
        this.stopLoop();
        g.mouse.down = false;
      }
    }

    updateThemeColor(color) {
      g.boid_color = color || "#000";
    }

    attachCanvas(nextCanvas) {
      if (this.canvas === nextCanvas && this.ctx) {
        this.resize();
        return true;
      }

      this.detachCanvas();
      this.canvas = nextCanvas;
      this.ctx = nextCanvas.getContext("2d");
      this.bindCanvasListeners();
      this.resize();
      this.createFlockIfNeeded();
      return true;
    }

    detachCanvas() {
      this.stopLoop();
      this.unbindCanvasListeners();
      this.canvas = null;
      this.ctx = null;
      g.mouse.over = false;
      g.mouse.down = false;
    }

    destroy() {
      this.detachCanvas();
    }
  }

  window.BoidsMainThreadRenderer = BoidsMainThreadRenderer;
})();
