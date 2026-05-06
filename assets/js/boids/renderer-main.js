(() => {
  class BoidsMainThreadRenderer extends window.BoidsRendererBase {
    constructor() {
      super();
      this.ctx = null;
      this.flock = null;
      this.rafId = null;
      this.last = 0;

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

    canRun() {
      return Boolean(this.ctx);
    }

    onAttachCanvas() {
      this.ctx = this.canvas.getContext("2d");
      return Boolean(this.ctx);
    }

    onDetachCanvas() {
      this.stopLoop();
      this.ctx = null;
      g.mouse.over = false;
      g.mouse.down = false;
    }

    onResize(metrics) {
      if (!this.ctx || !metrics) return;

      g.width = metrics.width;
      g.height = metrics.height;

      this.canvas.width = Math.floor(metrics.width * metrics.dpr);
      this.canvas.height = Math.floor(metrics.height * metrics.dpr);

      g.circle.center.x = g.width / 2;
      g.circle.center.y = g.height / 2;
      g.circle.radius = Math.min(g.width, g.height) * 0.4;

      this.ctx.setTransform(metrics.dpr, 0, 0, metrics.dpr, 0, 0);
      if (this.flock) this.flock.resize();
    }

    afterResize() {
      if (this.flock) return;
      const boids = [];
      for (let i = 0; i < g.boid_count; i++) {
        boids.push(new Boid());
      }
      this.flock = new Flock(boids);
    }

    onRunningChanged(running) {
      if (running) {
        this.startLoop();
      } else {
        this.stopLoop();
        g.mouse.down = false;
      }
    }

    onThemeChanged(color) {
      g.boid_color = color;
    }

    handlePointerMove(point) {
      g.mouse.x = point.x;
      g.mouse.y = point.y;
    }

    handlePointerOver(over) {
      g.mouse.over = over;
    }

    handlePointerDown(down) {
      g.mouse.down = down;
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
  }

  window.BoidsMainThreadRenderer = BoidsMainThreadRenderer;
})();
