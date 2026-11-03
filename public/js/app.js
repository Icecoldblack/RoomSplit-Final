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

// Inputs with data-match="otherId" must equal that input (e.g. confirm password)
document.querySelectorAll("input[data-match]").forEach((input) => {
  const other = document.getElementById(input.dataset.match);
  const validate = () => {
    input.setCustomValidity(input.value && input.value !== other.value ? "Passwords don't match." : "");
  };
  input.addEventListener("input", validate);
  other.addEventListener("input", validate);
});

// Any form with data-confirm asks before submitting (used for deletes)
document.querySelectorAll("form[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (!window.confirm(form.dataset.confirm)) event.preventDefault();
  });
});
