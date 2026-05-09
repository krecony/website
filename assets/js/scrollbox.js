document.querySelectorAll("[data-marquee]").forEach((track) => {
  const lane = track.querySelector(".scrollbox-lane");

  const containerWidth = track.offsetWidth;

  let isDown = false;
  let startX = 0;
  let currentX = 0;
  let velocity = 0;
  let lastX = 0;
  let rafId = null;

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

    rafId = requestAnimationFrame(animate);
  }

  const handleResize = () => ensureCoverage();

  const handleMouseUp = () => {
    isDown = false;
    track.classList.remove("is-dragging");
  };

  const handleMouseMove = (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    currentX = lastX - dx;
  };

  const handleTouchStart = (e) => {
    isDown = true;
    track.classList.add("is-dragging");
    startX = e.touches[0].clientX;
    lastX = currentX;
  };

  const handleTouchEnd = () => {
    isDown = false;
    track.classList.remove("is-dragging");
  };

  const handleTouchMove = (e) => {
    if (!isDown) return;
    const dx = e.touches[0].clientX - startX;
    currentX = lastX - dx;
  };

  const cleanup = () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
    }
    window.removeEventListener("resize", handleResize);
    window.removeEventListener("mouseup", handleMouseUp);
    window.removeEventListener("mousemove", handleMouseMove);
    track.removeEventListener("mousedown", handleMouseDown);
    track.removeEventListener("touchstart", handleTouchStart);
    track.removeEventListener("touchend", handleTouchEnd);
    track.removeEventListener("touchmove", handleTouchMove);
  };

  const handleMouseDown = (e) => {
    isDown = true;
    track.classList.add("is-dragging");
    startX = e.clientX;
    lastX = currentX;
    e.preventDefault();
  };

  ensureCoverage();
  animate();

  window.addEventListener("resize", handleResize);
  track.addEventListener("mousedown", handleMouseDown);
  window.addEventListener("mouseup", handleMouseUp);
  window.addEventListener("mousemove", handleMouseMove);
  track.addEventListener("touchstart", handleTouchStart);
  track.addEventListener("touchend", handleTouchEnd);
  track.addEventListener("touchmove", handleTouchMove);

  // Cleanup when element is removed from DOM
  document.addEventListener("htmx:beforeCleanupElement", (event) => {
    if (event.detail.elt === track) {
      cleanup();
    }
  });
});
