(() => {
  const root = document.documentElement;
  const applyThemeToggleState = () => {
    const isDark = root.dataset.theme === "dark";
    document.querySelectorAll("[data-theme-toggle]").forEach((button) => {
      button.type = "button";
      button.setAttribute(
        "aria-label",
        isDark ? "Switch to light mode" : "Switch to dark mode",
      );
      button.title = isDark ? "Switch to light mode" : "Switch to dark mode";
      button.innerHTML =
        '<span class="theme-icon">' + (isDark ? "☀" : "☾") + "</span>";
      button.classList.toggle("dark", isDark);
    });
  };

  root.dataset.theme = localStorage.getItem("scim-theme") || "light";

  window.SCIM = {
    qs: (s, e = document) => e.querySelector(s),
    qsa: (s, e = document) => [...e.querySelectorAll(s)],
    escapeHTML: (v = "") =>
      String(v).replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[c],
      ),
    toast(message, type = "primary") {
      const c =
        document.querySelector(".toast-container") ||
        (() => {
          let x = document.createElement("div");
          x.className = "toast-container position-fixed bottom-0 end-0 p-3";
          document.body.appendChild(x);
          return x;
        })();
      let t = document.createElement("div");
      t.className = "toast align-items-center text-bg-" + type + " border-0";
      t.innerHTML =
        '<div class="d-flex"><div class="toast-body">' +
        SCIM.escapeHTML(message) +
        '</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>';
      c.appendChild(t);
      bootstrap.Toast.getOrCreateInstance(t, { delay: 3200 }).show();
    },
    async api(path, o = {}) {
      let x = {
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(o.headers || {}) },
        ...o,
      };
      if (x.body && typeof x.body !== "string") x.body = JSON.stringify(x.body);
      let r = await fetch((SCIM_CONFIG.API_BASE || "/api") + path, x),
        ct = r.headers.get("content-type") || "",
        d = ct.includes("json") ? await r.json() : await r.text();
      if (!r.ok) throw Error(d?.message || d || "Request failed");
      return d;
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    applyThemeToggleState();

    SCIM.qsa("[data-theme-toggle]").forEach(
      (b) =>
        (b.onclick = () => {
          let n = root.dataset.theme === "dark" ? "light" : "dark";
          root.dataset.theme = n;
          localStorage.setItem("scim-theme", n);
          applyThemeToggleState();
        }),
    );

    SCIM.qsa("[data-current-year]").forEach(
      (x) => (x.textContent = new Date().getFullYear()),
    );

    let s = document.querySelector(".sidebar");
    SCIM.qsa("[data-sidebar-toggle]").forEach(
      (b) => (b.onclick = () => s?.classList.toggle("show")),
    );
  });
})();
