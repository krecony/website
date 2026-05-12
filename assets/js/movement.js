(() => {
  const root = document.documentElement;
  root.dataset.navDirection = root.dataset.navDirection || "rtl";
  const mobileMenuToggle = document.getElementById("mobile-menu-toggle");

  const normalizePath = (pathname) => {
    const trimmed = pathname.replace(/\/+$/, "");
    return trimmed === "" ? "/" : trimmed;
  };

  const findOrderForPath = (pathname) => {
    const targetPath = normalizePath(pathname);
    const links = document.querySelectorAll("a[data-nav-order]");
    for (const anchor of links) {
      const hrefPath = normalizePath(
        new URL(anchor.href, window.location.href).pathname,
      );
      if (hrefPath === targetPath) {
        const order = Number(anchor.dataset.navOrder);
        return Number.isFinite(order) ? order : NaN;
      }
    }
    return NaN;
  };

  const syncCurrentNavUnderline = () => {
    const currentPath = normalizePath(window.location.pathname);
    const links = document.querySelectorAll("a[data-nav-order]");
    for (const link of links) {
      const linkPath = normalizePath(
        new URL(link.href, window.location.href).pathname,
      );
      const isCurrent = linkPath === currentPath;
      link.classList.toggle("underline", isCurrent);
      link.classList.toggle("no-underline", !isCurrent);
    }
  };

  const closeMobileMenu = () => {
    if (!mobileMenuToggle) return;
    mobileMenuToggle.checked = false;
  };

  document.addEventListener(
    "click",
    (event) => {
      const link = event.target.closest("a[data-nav-order]");
      if (!link) return;
      if (link.hasAttribute("data-mobile-nav-link")) closeMobileMenu();
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return;

      const targetUrl = new URL(link.href, window.location.href);
      const currentUrl = new URL(window.location.href);

      if (targetUrl.origin !== currentUrl.origin) return;

      const isSamePath =
        normalizePath(targetUrl.pathname) ===
        normalizePath(currentUrl.pathname);
      const isSameSearch = targetUrl.search === currentUrl.search;
      const isSameHash =
        targetUrl.hash === currentUrl.hash || targetUrl.hash === "";

      if (isSamePath && isSameSearch && isSameHash) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }

      const targetOrder = Number(link.dataset.navOrder);
      const currentOrder = findOrderForPath(currentUrl.pathname);

      if (Number.isFinite(targetOrder) && Number.isFinite(currentOrder)) {
        if (targetOrder < currentOrder) root.dataset.navDirection = "ltr";
        if (targetOrder > currentOrder) root.dataset.navDirection = "rtl";
      }
    },
    true,
  );

  document.addEventListener("DOMContentLoaded", syncCurrentNavUnderline);
  document.addEventListener("htmx:historyRestore", () => {
    closeMobileMenu();
    syncCurrentNavUnderline();
  });

  document.addEventListener("htmx:afterSwap", (event) => {
    const isBoosted = Boolean(event.detail?.requestConfig?.boosted);
    const swappedPage = event.detail?.target?.id === "page";
    if (!isBoosted || !swappedPage) return;
    closeMobileMenu();
    syncCurrentNavUnderline();
  });
})();
