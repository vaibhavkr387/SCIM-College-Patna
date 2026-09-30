document.addEventListener("DOMContentLoaded", () => {
  let rows = SCIM.qs("#studentRows");
  let data = [
    ["STU-1024", "Ananya Sharma", "BCA", "Sem 3", "92%", "Active"],
    ["STU-1088", "Rohan Kumar", "BBA", "Sem 2", "84%", "Active"],
    ["STU-1117", "Priya Singh", "BCA", "Sem 1", "76%", "Review"],
  ];
  rows &&
    (rows.innerHTML = data
      .map(
        (r) =>
          "<tr>" +
          r.map((x, i) => "<td>" + SCIM.escapeHTML(x) + "</td>").join("") +
          "<td><button class='btn btn-sm btn-outline-secondary'><i class='bi bi-three-dots'></i></button></td></tr>",
      )
      .join(""));
  for (const [id, path, msg] of [
    ["studentProvisionForm", "/admin/students", "Student provisioned."],
    ["noticeForm", "/admin/notices", "Notice published."],
    ["materialForm", "/admin/materials", "Material saved."],
    ["testBuilderForm", "/admin/tests", "Test draft saved."],
  ])
    SCIM.qs("#" + id)?.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        await SCIM.api(path, {
          method: "POST",
          body: Object.fromEntries(new FormData(e.currentTarget)),
        });
        e.currentTarget.reset();
        SCIM.toast(msg, "success");
      } catch (x) {
        SCIM.toast(x.message, "danger");
      }
    });
});
