// Shared behaviour for every page

// Mobile menu toggle
const navToggle = document.querySelector(".nav-toggle");
const navMenu = document.getElementById("nav-menu");
if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", String(open));
  });
}

// Flash messages: close on click, fade out on their own after a few seconds
document.querySelectorAll(".flash").forEach((flash) => {
  const hide = () => {
    flash.style.opacity = "0";
    setTimeout(() => flash.remove(), 300);
  };
  flash.querySelector(".flash-close")?.addEventListener("click", hide);
  setTimeout(hide, 6000);
});

// Any form with data-confirm asks before submitting (used for deletes)
document.querySelectorAll("form[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (!window.confirm(form.dataset.confirm)) event.preventDefault();
  });
});
