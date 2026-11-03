// Payment form helpers: prefill the rent amount and warn when a payment will count as late
const LATE_AFTER_DAY = 5;

document.querySelectorAll(".payment-form").forEach((form) => {
  const tenant = form.querySelector("[name=tenant_id]");
  const amount = form.querySelector("[name=amount]");
  const paidOn = form.querySelector("[name=paid_on]");
  const forMonth = form.querySelector("[name=for_month]");
  const hint = form.querySelector("[data-late-hint]");

  tenant.addEventListener("change", () => {
    const rent = tenant.selectedOptions[0]?.dataset.rent;
    if (rent) amount.value = rent;
  });

  const updateHint = () => {
    if (!paidOn.value || !forMonth.value) return (hint.textContent = "");
    const deadline = `${forMonth.value}-${String(LATE_AFTER_DAY).padStart(2, "0")}`;
    hint.textContent = paidOn.value > deadline
      ? `Paid after the ${LATE_AFTER_DAY}th, so this payment will be marked late.`
      : "On time.";
    hint.classList.toggle("negative", paidOn.value > deadline);
  };
  paidOn.addEventListener("input", updateHint);
  forMonth.addEventListener("input", updateHint);
  updateHint();
});
