// Reads and checks submitted form fields. Each method returns the cleaned value
// (or null when empty) and records a message in `errors` when the value is invalid.
class Form {
  constructor(body) {
    this.body = body || {};
    this.errors = [];
  }

  get ok() {
    return this.errors.length === 0;
  }

  raw(field) {
    return String(this.body[field] ?? "").trim();
  }

  text(field, label, { required = false, max = 100 } = {}) {
    const value = this.raw(field);
    if (required && !value) this.errors.push(`${label} is required.`);
    else if (value.length > max) this.errors.push(`${label} must be ${max} characters or fewer.`);
    return value || null;
  }

  number(field, label, { required = false, min = 0, integer = false } = {}) {
    const value = this.raw(field);
    if (!value) {
      if (required) this.errors.push(`${label} is required.`);
      return null;
    }
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || (integer && !Number.isInteger(n))) {
      this.errors.push(`${label} must be a ${integer ? "whole " : ""}number of at least ${min}.`);
      return null;
    }
    return integer ? n : Math.round(n * 100) / 100;
  }

  date(field, label, { required = false } = {}) {
    const value = this.raw(field);
    if (!value) {
      if (required) this.errors.push(`${label} is required.`);
      return null;
    }
    const [y, m, d] = value.split("-").map(Number);
    const valid = /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(y, m - 1, d).getDate() === d;
    if (!valid) this.errors.push(`${label} must be a valid date.`);
    return valid ? value : null;
  }

  month(field, label, { required = false } = {}) {
    const value = this.raw(field);
    if (!value) {
      if (required) this.errors.push(`${label} is required.`);
      return null;
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
      this.errors.push(`${label} must be a valid month.`);
      return null;
    }
    return value;
  }

  choice(field, label, options) {
    const value = this.raw(field);
    if (!options.includes(value)) {
      this.errors.push(`Choose a valid ${label.toLowerCase()}.`);
      return null;
    }
    return value;
  }

  // Shows the problems as a one-time message on the next page
  flashErrors(req) {
    req.session.flash = { type: "error", message: this.errors.join(" ") };
  }
}

module.exports = Form;
