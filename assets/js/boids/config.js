let g = {
	width: 0,
	height: 0,

	minVel: -1,
	maxVel: 1,

	avoid_factor: 0.1,
	turn_factor: 0.08,
	matching_factor: 0.05,
	centering_factor: 0.0005,

	max_speed: 3,
	min_speed: 1,

	margin: 75,

	protected_range: 5,
	visible_range: 20,

	click_range: 100,
	click_strength: 1,

	mouse: {
		x: undefined,
		y: undefined,
		over: false,
		down: false,
	},

	boid_size: 10,
	boid_count: 1000,

	fps: 60,

	circle: {
		boundary: true,
		radius: 0,
		center: {
			x: 0,
			y: 0,
		},
	}
}

g.protected_range_sq = g.protected_range * g.protected_range
g.visible_range_sq = g.visible_range * g.visible_range
g.click_range_sq = g.click_range * g.click_range
g.max_speed_sq = g.max_speed * g.max_speed
g.min_speed_sq = g.min_speed * g.min_speed
g.frame_time = 1000 / g.fps
