const sitePreference = document.documentElement.getAttribute("data-default-appearance");
const userPreference = localStorage.getItem("appearance");

if ((sitePreference === "dark" && userPreference === null) || userPreference === "dark") {
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

  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
    if (localStorage.getItem("appearance") === null) {
      document.documentElement.classList.toggle("dark", event.matches);
    }
  });
}
