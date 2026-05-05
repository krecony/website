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

const darkModeButton = document.getElementById("mode-button");
const darkModeIcon = document.getElementById("mode-icon-moon");
const lightModeIcon = document.getElementById("mode-icon-sun");

const updateIcon = () => {
  const darkMode = document.documentElement.classList.contains("dark");

  darkModeIcon.classList.toggle("hidden", !darkMode);
  lightModeIcon.classList.toggle("hidden", darkMode);
};

darkModeButton.addEventListener("click", () => {
  document.documentElement.classList.toggle("dark");
  updateIcon();
});

updateIcon();
