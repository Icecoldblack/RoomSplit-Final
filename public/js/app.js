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

// Lease forms: the end date can't come before the start date
document.querySelectorAll(".lease-form").forEach((form) => {
  const start = form.querySelector("[name=lease_start]");
  const end = form.querySelector("[name=lease_end]");
  const message = form.querySelector("[data-lease-error]");
  const validate = () => {
    const bad = start.value && end.value && end.value < start.value;
    end.setCustomValidity(bad ? "Lease end must be on or after the lease start." : "");
    end.classList.toggle("invalid", Boolean(bad));
    message.textContent = bad ? "Lease end must be on or after the lease start." : "";
    if (start.value) end.min = start.value;
  };
  start.addEventListener("input", validate);
  end.addEventListener("input", validate);
  validate();
});

// Any form with data-confirm asks before submitting (used for deletes)
document.querySelectorAll("form[data-confirm]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    if (!window.confirm(form.dataset.confirm)) event.preventDefault();
  });
});
