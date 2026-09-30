(() => {
  let stream = null,
    active = false,
    switches = 0;
  async function startCamera(video) {
    if (!navigator.mediaDevices?.getUserMedia)
      throw Error("Camera access is not supported.");
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "user" },
      audio: false,
    });
    video.srcObject = stream;
    active = true;
    return stream;
  }
  function stopCamera() {
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    active = false;
  }
  function bindAntiCheat(cb) {
    const h = () => {
      if (document.hidden && active) {
        switches++;
        cb?.(switches);
      }
    };
    document.addEventListener("visibilitychange", h);
    return () => document.removeEventListener("visibilitychange", h);
  }
  window.SCIM_PROCTOR = {
    startCamera,
    stopCamera,
    bindAntiCheat,
    getTabSwitches: () => switches,
  };
  window.addEventListener("beforeunload", stopCamera);
})();
