document.addEventListener("DOMContentLoaded", () => {
  document.body.classList.add("page");

  const currentPath = window.location.pathname;
  document.querySelectorAll(".nav-link").forEach((link) => {
    if (link.dataset.path === currentPath) {
      link.classList.add("active");
    }
  });
});
