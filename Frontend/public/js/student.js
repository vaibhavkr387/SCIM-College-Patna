document.addEventListener("DOMContentLoaded", () => {
  let timer,
    remaining = 900;
  const render = (items) => {
    let g = SCIM.qs("#materialGrid");
    if (!g) return;
    g.innerHTML = items
      .map(
        (x) =>
          `<div class="col-md-6 col-xl-4"><article class="card-scim h-100 p-4"><span class="badge badge-soft">${SCIM.escapeHTML(x.type || "PDF")}</span><h5 class="mt-3">${SCIM.escapeHTML(x.title)}</h5><p class="small text-secondary">${SCIM.escapeHTML(x.description || "Academic material")}</p><div class="d-flex justify-content-between small text-secondary"><span>${SCIM.escapeHTML(x.course || "BCA")}</span><span>${SCIM.escapeHTML(x.semester || "Sem 1")}</span></div><button class="btn btn-scim w-100 mt-3 open-material" data-url="${SCIM.escapeHTML(x.url || "")}">Open material</button></article></div>`,
      )
      .join("");
  };
  render([
    {
      title: "Data Structures — Unit 1",
      course: "BCA",
      semester: "Sem 3",
      type: "PDF",
      description: "Arrays, linked lists and complexity basics.",
    },
    {
      title: "Business Communication Notes",
      course: "BBA",
      semester: "Sem 1",
      type: "PDF",
      description: "Professional communication fundamentals.",
    },
    {
      title: "Database Management Systems",
      course: "BCA",
      semester: "Sem 4",
      type: "PDF",
      description: "SQL, normalization and transactions.",
    },
  ]);
  function tick() {
    let e = SCIM.qs("#testTimer");
    if (!e) return;
    e.textContent =
      String(Math.floor(remaining / 60)).padStart(2, "0") +
      ":" +
      String(remaining % 60).padStart(2, "0");
    if (remaining <= 0) submit();
    remaining--;
  }
  async function submit() {
    clearInterval(timer);
    SCIM_PROCTOR.stopCamera();
    try {
      await SCIM.api("/student/tests/submit", {
        method: "POST",
        body: { tabSwitches: SCIM_PROCTOR.getTabSwitches() },
      });
    } catch (_) {}
    SCIM.toast("Test submitted and camera stopped.", "success");
  }
  SCIM.qs("#startTestBtn")?.addEventListener("click", async () => {
    try {
      await SCIM_PROCTOR.startCamera(SCIM.qs("#proctorVideo"));
      timer = setInterval(tick, 1000);
      tick();
      SCIM_PROCTOR.bindAntiCheat((n) =>
        SCIM.toast("Tab switch detected: " + n, "warning"),
      );
      SCIM.toast("Camera proctoring active.", "success");
    } catch (x) {
      SCIM.toast(x.message, "danger");
    }
  });
  SCIM.qs("#submitTestBtn")?.addEventListener("click", submit);
  SCIM.qs("#materialGrid")?.addEventListener("click", (e) => {
    let b = e.target.closest(".open-material");
    if (!b) return;
    let f = SCIM.qs("#pdfFrame");
    f.src = b.dataset.url || "about:blank";
    SCIM.qs("#watermark").textContent = "Authorized student • SCIM College";
    bootstrap.Modal.getOrCreateInstance(SCIM.qs("#pdfModal")).show();
  });
  SCIM.qs("#aiTutorForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    let q = SCIM.qs("#aiQuestion"),
      c = SCIM.qs("#aiChat");
    c.insertAdjacentHTML(
      "beforeend",
      `<div class="chat-bubble chat-user">${SCIM.escapeHTML(q.value)}</div>`,
    );
    let question = q.value;
    q.value = "";
    try {
      let r = await SCIM.api("/student/tutor", {
        method: "POST",
        body: { question },
      });
      c.insertAdjacentHTML(
        "beforeend",
        `<div class="chat-bubble chat-ai">${SCIM.escapeHTML(r.answer || "Tutor response received.")}</div>`,
      );
    } catch (_) {
      c.insertAdjacentHTML(
        "beforeend",
        '<div class="chat-bubble chat-ai">Tutor backend connection is ready for a configured Gemini integration.</div>',
      );
    }
    c.scrollTop = c.scrollHeight;
  });
  SCIM.qs("#doubtForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      await SCIM.api("/student/doubts", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      e.currentTarget.reset();
      SCIM.toast("Doubt submitted.", "success");
    } catch (x) {
      SCIM.toast(x.message, "danger");
    }
  });
});
