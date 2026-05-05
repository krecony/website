document.querySelectorAll("[data-marquee]").forEach((track) => {
  const lane = track.querySelector(".techstack-lane");

  const containerWidth = track.offsetWidth;

  let isDown = false;
  let startX = 0;
  let currentX = 0;
  let velocity = 0;
  let lastX = 0;

  function ensureCoverage() {
    const items = Array.from(lane.children);
    let totalWidth = lane.scrollWidth;

    while (totalWidth < containerWidth * 2) {
      items.forEach((node) => {
        lane.appendChild(node.cloneNode(true));
      });
      totalWidth = lane.scrollWidth;
    }
  }

  const speed = 0.5;
  function animate() {
    if (!isDown) {
      currentX += speed;
    }

    const halfWidth = lane.scrollWidth / 2;

    const x = ((currentX % halfWidth) + halfWidth) % halfWidth;

    lane.style.transform = `translateX(${-x}px)`;

    requestAnimationFrame(animate);
  }

  ensureCoverage();
  animate();

  window.addEventListener("resize", ensureCoverage);

  track.addEventListener("mousedown", (e) => {
    isDown = true;
    track.classList.add("is-dragging");

    startX = e.clientX;
    lastX = currentX;

    e.preventDefault();
  });

  window.addEventListener("mouseup", () => {
    isDown = false;
    track.classList.remove("is-dragging");
  });

  window.addEventListener("mousemove", (e) => {
    if (!isDown) return;

    const dx = e.clientX - startX;
    currentX = lastX - dx;
  });

  track.addEventListener("touchstart", (e) => {
    isDown = true;
    track.classList.add("is-dragging");

    startX = e.touches[0].clientX;
    lastX = currentX;
  });

  track.addEventListener("touchend", () => {
    isDown = false;
    track.classList.remove("is-dragging");
  });

  track.addEventListener("touchmove", (e) => {
    if (!isDown) return;

    const dx = e.touches[0].clientX - startX;
    currentX = lastX - dx;
  });
});
