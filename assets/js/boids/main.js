var canvas = document.getElementById("bird_canvas");
var ctx = canvas.getContext("2d");
let flock;

function resizeCanvas() {
	const rect = canvas.getBoundingClientRect();
	const width = Math.max(1, Math.floor(rect.width));
	const height = Math.max(1, Math.floor(rect.height));
	const dpr = window.devicePixelRatio || 1;

	g.width = width;
	g.height = height;

	canvas.width = Math.floor(width * dpr);
	canvas.height = Math.floor(height * dpr);

	g.circle.center.x = g.width / 2
	g.circle.center.y = g.height / 2
	g.circle.radius = Math.min(g.width, g.height) * 0.4

	ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
	if (flock) flock.resize();
}

window.addEventListener("resize", resizeCanvas);

const down = e => {
	g.mouse.x = e.offsetX
	g.mouse.y = e.offsetY
	g.mouse.down = true
}

const up = e => {
	g.mouse.down = false
}

const move = e => {
	g.mouse.x = e.offsetX
	g.mouse.y = e.offsetY
}

canvas.addEventListener("mouseover", () => {g.mouse.over = true});
canvas.addEventListener("mouseout", () => {g.mouse.over = false});

canvas.addEventListener("mousemove", move)
canvas.addEventListener("touchmove", move)

canvas.addEventListener("mousedown", down)
canvas.addEventListener("touchstart", down)

canvas.addEventListener("mouseup", up)
canvas.addEventListener("touchend", up)

resizeCanvas();

const boids = [];

for (let i = 0; i < g.boid_count; i++) {
  boids.push(new Boid());
}

flock = new Flock(boids)

let last = 0

function animate(now) {
  if (now - last >= g.frame_time) {
    last = now - ((now - last) % g.frame_time); // keeps timing stable
    ctx.clearRect(0, 0, g.width, g.height);
    flock.draw(ctx);
    flock.update();
  }

  requestAnimationFrame(animate);
}
 
requestAnimationFrame(animate);
