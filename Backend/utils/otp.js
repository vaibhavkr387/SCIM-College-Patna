const crypto = require("crypto");

function generateOtp() {
  return String(crypto.randomInt(1000000, 10000000));
}

function hashOtp(otp) {
  return crypto.createHash("sha256").update(String(otp)).digest("hex");
}

function safeCompareHash(otp, hash) {
  const actual = Buffer.from(hashOtp(otp), "hex");
  const expected = Buffer.from(hash, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

module.exports = { generateOtp, hashOtp, safeCompareHash };
