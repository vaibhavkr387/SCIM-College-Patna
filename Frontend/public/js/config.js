(() => {
  const env = window.SCIM_ENV || {};
  const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
  const backendOrigin = (
    (isLocal ? env.BACKEND_URL : env.BACKEND_URL_ALT || env.BACKEND_URL) ||
    (["3000", "8080"].includes(window.location.port)
      ? "http://localhost:5000"
      : window.location.origin)
  ).replace(/\/$/, "");

  window.SCIM_CONFIG = {
    API_BASE: backendOrigin + "/api",
    SOCKET_URL: backendOrigin,
    SOCKET_PATH: "/socket.io",
    COLLEGE_NAME: "SCIM College, Patna",
  };
})();
