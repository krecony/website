class Flock {
  constructor(boids) {
    this.boids = boids;
    this.next = new Int32Array(boids.length);
    this.resize();
  }

  resize() {
    this.cellSize = Math.max(1, g.visible_range, g.protected_range);
    this.cols = Math.max(1, Math.ceil(g.width / this.cellSize));
    this.rows = Math.max(1, Math.ceil(g.height / this.cellSize));
    this.heads = new Int32Array(this.cols * this.rows);
  }

  update(dt) {
    this.heads.fill(-1);
    for (let i = 0; i < this.boids.length; i++) {
      const boid = this.boids[i];
      boid.cellX = Math.max(
        0,
        Math.min(this.cols - 1, Math.floor(boid.x / this.cellSize)),
      );
      boid.cellY = Math.max(
        0,
        Math.min(this.rows - 1, Math.floor(boid.y / this.cellSize)),
      );
      const cell = boid.cellY * this.cols + boid.cellX;
      this.next[i] = this.heads[cell];
      this.heads[cell] = i;
    }

    for (const boid of this.boids) boid.update(this, dt);
    for (const boid of this.boids) {
      boid.vx = boid.nextVx;
      boid.vy = boid.nextVy;
      boid.x += boid.vx * dt;
      boid.y += boid.vy * dt;
    }
  }

  draw(ctx) {
    ctx.beginPath();
    for (const boid of this.boids) {
      const speed = Math.sqrt(boid.vx * boid.vx + boid.vy * boid.vy);
      const dx = speed > 0 ? (boid.vx / speed) * g.boid_size : g.boid_size;
      const dy = speed > 0 ? (boid.vy / speed) * g.boid_size : 0;
      const backX = boid.x - dx * 0.6;
      const backY = boid.y - dy * 0.6;
      ctx.moveTo(boid.x + dx, boid.y + dy);
      ctx.lineTo(backX - dy * 0.5, backY + dx * 0.5);
      ctx.lineTo(backX + dy * 0.5, backY - dx * 0.5);
      ctx.closePath();
    }
    ctx.fillStyle = g.boid_color;
    ctx.fill();
  }
}
