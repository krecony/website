 function rand(a, b) {
   const min = b === undefined ? 0 : a;
   const max = b === undefined ? a : b;
   return Math.random() * (max - min) + min;
 }

class Boid {
	constructor() {
		this.x = rand(g.width)
		this.y = rand(g.height)

		this.vx = rand(g.minVel, g.maxVel)
		this.vy = rand(g.minVel, g.maxVel)

		this.size = g.boid_size
	}

	update(flock) {
		let close_dx = 0
		let close_dy = 0

		let x_vel = 0
		let y_vel = 0
		
		let x_pos = 0
		let y_pos = 0

		let neighbours = 0
		const i = Math.floor(this.x / flock.b_width)
		const j = Math.floor(this.y / flock.b_height)

		for (let bi = i - 1; bi <= i + 1; bi++) {
			if (bi < 0 || bi >= flock.cols) continue

			for (let bj = j - 1; bj <= j + 1; bj++) {
				if (bj < 0 || bj >= flock.rows) continue
				const bucket = flock.buckets[bj * flock.cols + bi]

				for (let k = 0; k < bucket.length; k++) {
					const boid = bucket[k]
					if (boid === this) continue

					const dx = this.x - boid.x
					const dy = this.y - boid.y
					const sq_dist = dx * dx + dy * dy

					if(sq_dist <= g.protected_range_sq) {
						close_dx += dx
						close_dy += dy
					}
					else if(sq_dist <= g.visible_range_sq) {
						x_vel += boid.vx
						y_vel += boid.vy
						x_pos += boid.x
						y_pos += boid.y
						neighbours += 1
					}
				}
			}
		}

		// alignment
		if(neighbours > 0) {
			x_vel /= neighbours
			y_vel /= neighbours
			x_pos /= neighbours
			y_pos /= neighbours

			this.vx += (x_vel - this.vx) * g.matching_factor
			this.vy += (y_vel - this.vy) * g.matching_factor

			this.vx += (x_pos - this.x) * g.centering_factor
			this.vy += (y_pos - this.y) * g.centering_factor
		}

		// avoidance
		this.vx += close_dx * g.avoid_factor
		this.vy += close_dy * g.avoid_factor

		// turning
		if(this.x < g.margin) {
			this.vx = this.vx + g.turn_factor
		}
		if(this.x > g.width - g.margin) {
			this.vx = this.vx - g.turn_factor
		}
		if(this.y < g.margin) {
			this.vy = this.vy + g.turn_factor
		}
		if(this.y > g.height - g.margin) {
			this.vy = this.vy - g.turn_factor
		}

		// going towards mouse
		if(g.mouse.down && g.mouse.over) {
			const dx = g.mouse.x - this.x
			const dy = g.mouse.y - this.y
			const dist_sq = dx * dx + dy * dy

			if(dist_sq > 0 && dist_sq <= g.click_range_sq) {
				const inv_dist = 1 / Math.sqrt(dist_sq)
				this.vx += dx * inv_dist * g.click_strength
				this.vy += dy * inv_dist * g.click_strength
			}
		}

		// clamping
		const speed_sq = this.vx * this.vx + this.vy * this.vy
		
		if(speed_sq > g.max_speed_sq) {
			const scale = g.max_speed / Math.sqrt(speed_sq)
			this.vx *= scale
			this.vy *= scale
		}
		else if(speed_sq > 0 && speed_sq < g.min_speed_sq) {
			const scale = g.min_speed / Math.sqrt(speed_sq)
			this.vx *= scale
			this.vy *= scale
		}

		// update
		this.x += this.vx
		this.y += this.vy
	}

  draw(ctx) {
    ctx.save();

		this.angle = Math.atan2(this.vy, this.vx);

    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.beginPath();

    ctx.moveTo(this.size, 0);
    ctx.lineTo(-this.size * 0.6, this.size * 0.5);
    ctx.lineTo(-this.size * 0.6, -this.size * 0.5);

    ctx.closePath();

    ctx.fillStyle = "white";
    ctx.fill();

    ctx.restore();
	}
}
