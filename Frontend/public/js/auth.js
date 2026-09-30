document.addEventListener("DOMContentLoaded", () => {
  let pending = null;
  SCIM.qs("#loginForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      let r = await SCIM.api("/auth/login", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      if (r.requiresOtp) {
        pending = r;
        SCIM.qs("#loginForm").classList.add("d-none");
        SCIM.qs("#otpPanel").classList.remove("d-none");
        SCIM.toast("OTP sent to your registered email.", "success");
      } else location.href = r.redirect || "/dashboard-student.html";
    } catch (x) {
      SCIM.toast(x.message, "danger");
    }
  });
  SCIM.qs("#otpForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      let b = Object.fromEntries(new FormData(e.currentTarget));
      let r = await SCIM.api("/auth/verify-otp", {
        method: "POST",
        body: { ...b, userId: pending?.userId },
      });
      location.href = r.redirect || "/dashboard-admin.html";
    } catch (x) {
      SCIM.toast(x.message, "danger");
    }
  });
  SCIM.qs("#forgotForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await SCIM.api("/auth/forgot-password", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      SCIM.toast("If the account exists, an OTP has been sent.", "success");
    } catch (x) {
      SCIM.toast(x.message, "danger");
    }
  });
  SCIM.qs("#resetForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await SCIM.api("/auth/reset-password", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      SCIM.toast("Password updated.", "success");
      setTimeout(() => (location.href = "/login.html"), 700);
    } catch (x) {
      SCIM.toast(x.message, "danger");
    }
  });
});
