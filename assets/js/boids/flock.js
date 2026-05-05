class Flock {
  constructor(boids) {
    this.boids = boids;
    this.cols = 10;
    this.rows = 10;
    this.buckets = [];

    this.resize();
  }

  resize() {
    this.b_width = Math.max(1, Math.ceil(g.width / this.cols));
    this.b_height = Math.max(1, Math.ceil(g.height / this.rows));
    this.buckets = Array.from({ length: this.cols * this.rows }, () => []);
  }

  get_bucket_index(x, y) {
    const i = Math.max(
      0,
      Math.min(this.cols - 1, Math.floor(x / this.b_width)),
    );
    const j = Math.max(
      0,
      Math.min(this.rows - 1, Math.floor(y / this.b_height)),
    );
    return j * this.cols + i;
  }

  draw(ctx) {
    for (const boid of this.boids) {
      boid.draw(ctx);
    }
  }

  update() {
    for (const bucket of this.buckets) {
      bucket.length = 0;
    }

    for (const boid of this.boids) {
      const idx = this.get_bucket_index(boid.x, boid.y);
      this.buckets[idx].push(boid);
    }

    for (const boid of this.boids) {
      boid.update(this);
    }
  }
}
