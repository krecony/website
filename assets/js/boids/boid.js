class Boid {
  constructor() {
    if (g.circle.boundary) {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * g.circle.radius;
      this.x = Math.cos(angle) * distance + g.circle.center.x;
      this.y = Math.sin(angle) * distance + g.circle.center.y;
    } else {
      this.x = Math.random() * g.width;
      this.y = Math.random() * g.height;
    }
    this.vx = g.minVel + Math.random() * (g.maxVel - g.minVel);
    this.vy = g.minVel + Math.random() * (g.maxVel - g.minVel);
    this.nextVx = this.vx;
    this.nextVy = this.vy;
    this.cellX = 0;
    this.cellY = 0;
  }

  update(flock, dt) {
    let closeX = 0,
      closeY = 0;
    let velocityX = 0,
      velocityY = 0;
    let positionX = 0,
      positionY = 0;
    let neighbours = 0;
    const minX = Math.max(0, this.cellX - 1);
    const maxX = Math.min(flock.cols - 1, this.cellX + 1);
    const minY = Math.max(0, this.cellY - 1);
    const maxY = Math.min(flock.rows - 1, this.cellY + 1);

    for (let row = minY; row <= maxY; row++) {
      for (let col = minX; col <= maxX; col++) {
        for (
          let k = flock.heads[row * flock.cols + col];
          k !== -1;
          k = flock.next[k]
        ) {
          const boid = flock.boids[k];
          if (boid === this) continue;
          const dx = this.x - boid.x;
          const dy = this.y - boid.y;
          const distanceSq = dx * dx + dy * dy;
          if (distanceSq <= g.protected_range_sq) {
            closeX += dx;
            closeY += dy;
          } else if (distanceSq <= g.visible_range_sq) {
            velocityX += boid.vx;
            velocityY += boid.vy;
            positionX += boid.x;
            positionY += boid.y;
            neighbours++;
          }
        }
      }
    }

    let vx = this.vx;
    let vy = this.vy;
    if (neighbours > 0) {
      vx +=
        ((velocityX / neighbours - vx) * g.matching_factor +
          (positionX / neighbours - this.x) * g.centering_factor) *
        dt;
      vy +=
        ((velocityY / neighbours - vy) * g.matching_factor +
          (positionY / neighbours - this.y) * g.centering_factor) *
        dt;
    }
    vx += closeX * g.avoid_factor * dt;
    vy += closeY * g.avoid_factor * dt;

    const turn = g.turn_factor * dt;
    if (g.circle.boundary) {
      const dx = this.x - g.circle.center.x;
      const dy = this.y - g.circle.center.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      // A bird at the exact center has no inward direction.
      if (distance > 0) {
        let force = g.circle.radius - distance <= g.margin ? turn : turn / 3;
        if (distance <= g.circle.radius / 3) force -= turn / 5;
        vx -= (dx * force) / distance;
        vy -= (dy * force) / distance;
      }
    } else {
      if (this.x < g.margin) vx += turn;
      if (this.x > g.width - g.margin) vx -= turn;
      if (this.y < g.margin) vy += turn;
      if (this.y > g.height - g.margin) vy -= turn;
    }

    if (g.mouse.down) {
      const dx = g.mouse.x - this.x;
      const dy = g.mouse.y - this.y;
      const distanceSq = dx * dx + dy * dy;
      if (distanceSq > 0 && distanceSq <= g.click_range_sq) {
        const force = (g.click_strength * dt) / Math.sqrt(distanceSq);
        vx += dx * force;
        vy += dy * force;
      }
    }

    const speedSq = vx * vx + vy * vy;
    if (speedSq > g.max_speed_sq || (speedSq > 0 && speedSq < g.min_speed_sq)) {
      const speed = speedSq > g.max_speed_sq ? g.max_speed : g.min_speed;
      const scale = speed / Math.sqrt(speedSq);
      vx *= scale;
      vy *= scale;
    }
    this.nextVx = vx;
    this.nextVy = vy;
  }
}
