const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const required = ["MONGO_URI", "JWT_SECRET"];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieName: process.env.COOKIE_NAME || "scim_token",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
  frontendUrlAlt: process.env.FRONTEND_URL_ALT || "",
  frontendPublicDir: path.resolve(
    __dirname,
    "..",
    "..",
    "Frontend",
    "public"
  ),
  corsOrigins: String(
    process.env.CORS_ORIGINS ||
      "http://localhost:5000,http://127.0.0.1:5000,http://localhost:3000,http://127.0.0.1:3000"
  )
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  smtpHost: process.env.SMTP_HOST,
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpSecure: String(process.env.SMTP_SECURE || "true") === "true",
  smtpUser: process.env.SMTP_USER,
  smtpPass: process.env.SMTP_PASS,
  adminRecipientEmail: process.env.ADMIN_RECIPIENT_EMAIL,
  mailFromName: process.env.MAIL_FROM_NAME || "SCIM College Portal",
  geminiApiKey: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  uploadDir: path.resolve(process.env.UPLOAD_DIR || "uploads"),
  maxFileSize: Number(process.env.MAX_FILE_SIZE_MB || 20) * 1024 * 1024,
  otpExpiresMinutes: Number(process.env.OTP_EXPIRES_MINUTES || 10)
};

module.exports = env;
