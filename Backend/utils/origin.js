function stripSlash(value) {
  return String(value || "").trim().replace(/\/$/, "");
}

function isAllowedOrigin(origin, allowedOrigins, allowVercelPreviews) {
  if (!origin) return false;
  const normalized = stripSlash(origin);
  if (allowedOrigins.has(normalized) || allowedOrigins.has(origin)) return true;
  if (!allowVercelPreviews) return false;
  try {
    return new URL(origin).hostname.endsWith(".vercel.app");
  } catch (_error) {
    return false;
  }
}

module.exports = { stripSlash, isAllowedOrigin };
