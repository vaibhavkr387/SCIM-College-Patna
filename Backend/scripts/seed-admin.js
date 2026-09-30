const bcrypt = require("bcryptjs");
const connectDB = require("../config/db");
const User = require("../models/User");

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || "SCIM Portal Administrator";

  if (!email || !password) {
    throw new Error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD before running this script.");
  }
  if (password.length < 12) {
    throw new Error("Seed admin password should be at least 12 characters.");
  }

  await connectDB();

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email: email.toLowerCase() });

  if (existing) {
    existing.name = name;
    existing.passwordHash = passwordHash;
    existing.role = "admin";
    existing.status = "active";
    existing.emailVerified = true;
    existing.permissions = {
      manageStudents: true,
      manageContent: true,
      manageTests: true,
      viewAnalytics: true
    };
    await existing.save();
    console.log(`Admin updated: ${existing.email}`);
  } else {
    const admin = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: "admin",
      status: "active",
      emailVerified: true,
      permissions: {
        manageStudents: true,
        manageContent: true,
        manageTests: true,
        viewAnalytics: true
      }
    });
    console.log(`Admin created: ${admin.email}`);
  }

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
