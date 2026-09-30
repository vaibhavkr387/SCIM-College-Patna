const env = require("../config/env");

function cookieBase() {
  const production = env.nodeEnv === "production";
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? "none" : "lax"
  };
}

function authCookieOptions() {
  return {
    ...cookieBase(),
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  };
}

function resetCookieOptions() {
  return {
    ...cookieBase(),
    maxAge: env.otpExpiresMinutes * 60 * 1000,
    path: "/api/auth"
  };
}

function clearAuthCookieOptions() {
  return {
    ...cookieBase(),
    path: "/"
  };
}

function clearResetCookieOptions() {
  return {
    ...cookieBase(),
    path: "/api/auth"
  };
}

module.exports = {
  authCookieOptions,
  resetCookieOptions,
  clearAuthCookieOptions,
  clearResetCookieOptions
};
