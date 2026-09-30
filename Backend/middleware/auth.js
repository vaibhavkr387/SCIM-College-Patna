const User = require("../models/User");
const { verifyToken } = require("../utils/jwt");
const env = require("../config/env");

async function protect(req, res, next) {
  try {
    const token = req.cookies?.[env.cookieName];
    if (!token) return res.status(401).json({ message: "Authentication required." });

    const payload = verifyToken(token);
    const user = await User.findById(payload.sub).select("+passwordHash");
    if (!user || user.status !== "active") {
      return res.status(401).json({ message: "Account is unavailable." });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired session." });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "You are not authorized for this action." });
    }
    next();
  };
}

function requirePermission(permission) {
  return (req, res, next) => {
    if (req.user?.role === "admin" || req.user?.permissions?.[permission]) return next();
    return res.status(403).json({ message: `Permission required: ${permission}` });
  };
}

module.exports = { protect, authorize, requirePermission };
