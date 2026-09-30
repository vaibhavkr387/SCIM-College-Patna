const nodemailer = require("nodemailer");
const env = require("../config/env");

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtpHost || !env.smtpUser || !env.smtpPass) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS.");
  }

  transporter = nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpSecure,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass
    }
  });

  return transporter;
}

async function sendMail({ to, subject, text, html }) {
  const mailer = getTransporter();
  return mailer.sendMail({
    from: `"${env.mailFromName}" <${env.smtpUser}>`,
    to,
    subject,
    text,
    html
  });
}

async function sendOtpEmail({ to, name, otp, purpose }) {
  const purposeText = {
    "admin-login": "administrator/co-member login verification",
    "password-reset": "password recovery",
    "email-verification": "student email verification"
  }[purpose] || "account verification";

  return sendMail({
    to,
    subject: `SCIM College — Your 7-digit OTP`,
    text: `Dear ${name || "User"},\n\nYour SCIM College ${purposeText} OTP is ${otp}. It expires in ${env.otpExpiresMinutes} minutes.\n\nDo not share this OTP with anyone.\n\nSCIM College Portal`,
    html: `<p>Dear ${name || "User"},</p><p>Your SCIM College <strong>${purposeText}</strong> OTP is:</p><h2 style="letter-spacing:4px">${otp}</h2><p>This OTP expires in ${env.otpExpiresMinutes} minutes.</p><p><strong>Do not share this OTP with anyone.</strong></p><p>SCIM College Portal</p>`
  });
}

async function sendStudentProvisionEmail({ to, name, temporaryPassword, otp }) {
  return sendMail({
    to,
    subject: "SCIM College — Student Portal Account Created",
    text: `Dear ${name},\n\nYour SCIM College student portal account has been created by an authorized administrator.\n\nTemporary password: ${temporaryPassword}\nEmail verification OTP: ${otp}\n\nPlease sign in and change your password after verification.\n\nSCIM College Portal`,
    html: `<p>Dear ${name},</p><p>Your student portal account has been created by an authorized administrator.</p><p><strong>Temporary password:</strong> ${temporaryPassword}</p><p><strong>Email verification OTP:</strong> ${otp}</p><p>Please sign in and change your password after verification.</p>`
  });
}

module.exports = { sendMail, sendOtpEmail, sendStudentProvisionEmail };
