const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Otp = require("../models/Otp");
const env = require("../config/env");
const { generateOtp, hashOtp, safeCompareHash } = require("../utils/otp");
const { signToken } = require("../utils/jwt");
const { sendOtpEmail } = require("../services/mailer");
const audit = require("../utils/audit");

function cookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "strict" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/"
  };
}

function resetCookieOptions() {
  return {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "strict" : "lax",
    maxAge: env.otpExpiresMinutes * 60 * 1000,
    path: "/api/auth"
  };
}

async function issueOtp(user, purpose) {
  const otp = generateOtp();
  const otpHash = hashOtp(otp);
  await Otp.deleteMany({ userId: user._id, purpose, consumedAt: { $exists: false } });
  await Otp.create({
    userId: user._id,
    email: user.email,
    purpose,
    otpHash,
    expiresAt: new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000)
  });
  return otp;
}

async function login(req, res) {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password are required." });

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select("+passwordHash");
  if (!user || user.status !== "active") {
    return res.status(401).json({ message: "Invalid credentials." });
  }

  const roleMatches =
    role === "student"
      ? user.role === "student"
      : ["admin", "co-member"].includes(user.role);

  if (!roleMatches) return res.status(401).json({ message: "Selected account type does not match this account." });

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ message: "Invalid credentials." });

  if (user.role === "student" && !user.emailVerified) {
    const otp = await issueOtp(user, "email-verification");
    await sendOtpEmail({ to: user.email, name: user.name, otp, purpose: "email-verification" });
    return res.json({ requiresOtp: true, purpose: "email-verification", userId: user._id });
  }

  if (["admin", "co-member"].includes(user.role)) {
    const otp = await issueOtp(user, "admin-login");
    await sendOtpEmail({ to: user.email, name: user.name, otp, purpose: "admin-login" });
    return res.json({ requiresOtp: true, purpose: "admin-login", userId: user._id });
  }

  const token = signToken(user);
  res.cookie(env.cookieName, token, cookieOptions());
  user.lastLoginAt = new Date();
  await user.save();
  await audit(req, "login", "User", user._id);
  res.json({ redirect: "/dashboard-student.html", user: publicUser(user) });
}

async function verifyOtp(req, res) {
  const { userId, otp, purpose } = req.body;
  if (!userId || !otp || !/^\d{7}$/.test(String(otp))) {
    return res.status(400).json({ message: "A valid 7-digit OTP is required." });
  }

  const user = await User.findById(userId).select("+passwordHash");
  if (!user) return res.status(404).json({ message: "Account not found." });

  const query = {
    userId: user._id,
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  };
  if (purpose) {
    query.purpose = purpose === "email-verification" ? "email-verification" : "admin-login";
  } else {
    query.purpose = { $in: ["admin-login", "email-verification"] };
  }

  const record = await Otp.findOne(query).sort({ createdAt: -1 });
  if (!record) return res.status(400).json({ message: "OTP is invalid or expired." });
  if (record.attempts >= 5) return res.status(429).json({ message: "Too many OTP attempts." });

  record.attempts += 1;
  if (!safeCompareHash(otp, record.otpHash)) {
    await record.save();
    return res.status(400).json({ message: "OTP is invalid." });
  }

  record.consumedAt = new Date();
  await record.save();

  if (record.purpose === "email-verification") {
    user.emailVerified = true;
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken(user);
  res.cookie(env.cookieName, token, cookieOptions());
  await audit(req, "otp-login", "User", user._id, { purpose: record.purpose });

  res.json({
    redirect: user.role === "student" ? "/dashboard-student.html" : "/dashboard-admin.html",
    user: publicUser(user)
  });
}

async function forgotPassword(req, res) {
  const { email, role } = req.body;
  const generic = { message: "If the account exists, an OTP has been sent." };
  if (!email) return res.status(200).json(generic);

  const roleFilter = role === "student" ? "student" : { $in: ["admin", "co-member"] };
  const user = await User.findOne({ email: email.toLowerCase().trim(), role: roleFilter, status: "active" });
  if (!user) return res.json(generic);

  const otp = await issueOtp(user, "password-reset");
  await sendOtpEmail({ to: user.email, name: user.name, otp, purpose: "password-reset" });
  const resetTicket = require("jsonwebtoken").sign({ sub: user._id.toString(), purpose: "password-reset" }, env.jwtSecret, { expiresIn: `${env.otpExpiresMinutes}m` });
  res.cookie("scim_reset_ticket", resetTicket, resetCookieOptions());
  return res.json(generic);
}

async function resetPassword(req, res) {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword || !/^\d{7}$/.test(String(otp))) {
    return res.status(400).json({ message: "Email, 7-digit OTP and new password are required." });
  }
  if (String(newPassword).length < 8) {
    return res.status(400).json({ message: "New password must be at least 8 characters." });
  }

  let user = null;
  if (email) {
    user = await User.findOne({ email: email.toLowerCase().trim(), status: "active" }).select("+passwordHash");
  } else {
    try {
      const ticket = require("jsonwebtoken").verify(req.cookies?.scim_reset_ticket || "", env.jwtSecret);
      if (ticket.purpose === "password-reset") {
        user = await User.findOne({ _id: ticket.sub, status: "active" }).select("+passwordHash");
      }
    } catch (_) {}
  }
  if (!user) return res.status(400).json({ message: "Invalid recovery request." });

  const record = await Otp.findOne({
    userId: user._id,
    purpose: "password-reset",
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });

  if (!record) return res.status(400).json({ message: "OTP is invalid or expired." });
  if (record.attempts >= 5) return res.status(429).json({ message: "Too many OTP attempts." });

  record.attempts += 1;
  if (!safeCompareHash(otp, record.otpHash)) {
    await record.save();
    return res.status(400).json({ message: "OTP is invalid." });
  }

  user.passwordHash = await bcrypt.hash(newPassword, 12);
  await user.save();
  record.consumedAt = new Date();
  await record.save();
  await audit(req, "password-reset", "User", user._id);
  res.clearCookie("scim_reset_ticket", {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "strict" : "lax",
    path: "/api/auth"
  });

  res.json({ message: "Password updated successfully." });
}

async function logout(req, res) {
  res.clearCookie(env.cookieName, {
    httpOnly: true,
    secure: env.nodeEnv === "production",
    sameSite: env.nodeEnv === "production" ? "strict" : "lax",
    path: "/"
  });
  res.json({ message: "Logged out." });
}

async function me(req, res) {
  res.json({ user: publicUser(req.user) });
}

function publicUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    course: user.course,
    semester: user.semester,
    status: user.status,
    emailVerified: user.emailVerified,
    permissions: user.permissions,
    lastLoginAt: user.lastLoginAt
  };
}

module.exports = { login, verifyOtp, forgotPassword, resetPassword, logout, me, publicUser };
