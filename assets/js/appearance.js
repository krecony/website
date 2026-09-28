(() => {
  const root = document.documentElement;
  const sitePreference = root.dataset.defaultAppearance;
  const userPreference = localStorage.getItem("appearance");
  const autoAppearance = root.dataset.autoAppearance === "true";
  const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");

  root.classList.toggle(
    "dark",
    userPreference === "dark" ||
      (userPreference !== "light" &&
        (sitePreference === "dark" || (autoAppearance && colorScheme.matches))),
  );

  // Theme selection must run immediately; the controls need the parsed DOM.
  document.addEventListener(
    "DOMContentLoaded",
    () => {
      const buttons = document.querySelectorAll("[data-mode-toggle]");

      function updateIcons() {
        const darkMode = root.classList.contains("dark");
        for (const button of buttons) {
          button
            .querySelector('[data-mode-icon="moon"]')
            .classList.toggle("hidden", !darkMode);
          button
            .querySelector('[data-mode-icon="sun"]')
            .classList.toggle("hidden", darkMode);
        }
      }

      for (const button of buttons) {
        button.addEventListener("click", () => {
          const darkMode = root.classList.toggle("dark");
          localStorage.setItem("appearance", darkMode ? "dark" : "light");
          updateIcons();
        });
      }

      if (autoAppearance) {
        colorScheme.addEventListener("change", (event) => {
          if (localStorage.getItem("appearance") === null) {
            root.classList.toggle("dark", event.matches);
            updateIcons();
          }
        });
      }

      updateIcons();
    },
    { once: true },
  );
})();
