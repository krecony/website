const sitePreference = document.documentElement.getAttribute(
  "data-default-appearance",
);
const userPreference = localStorage.getItem("appearance");

if (
  (sitePreference === "dark" && userPreference === null) ||
  userPreference === "dark"
) {
  document.documentElement.classList.add("dark");
}

if (document.documentElement.getAttribute("data-auto-appearance") === "true") {
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches &&
    userPreference !== "light"
  ) {
    document.documentElement.classList.add("dark");
  }

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", (event) => {
      if (localStorage.getItem("appearance") === null) {
        document.documentElement.classList.toggle("dark", event.matches);
      }
    });
}

const darkModeButtons = Array.from(
  document.querySelectorAll("[data-mode-toggle]"),
);

const updateIcons = () => {
  const darkMode = document.documentElement.classList.contains("dark");

  darkModeButtons.forEach((button) => {
    const darkModeIcon = button.querySelector('[data-mode-icon="moon"]');
    const lightModeIcon = button.querySelector('[data-mode-icon="sun"]');
    if (!darkModeIcon || !lightModeIcon) return;

    darkModeIcon.classList.toggle("hidden", !darkMode);
    lightModeIcon.classList.toggle("hidden", darkMode);
  });
};

darkModeButtons.forEach((button) => {
  button.addEventListener("click", () => {
    document.documentElement.classList.toggle("dark");
    updateIcons();
  });
});

updateIcons();
