const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
const User = require("../models/User");
const Notice = require("../models/Notice");
const Material = require("../models/Material");
const Test = require("../models/Test");
const Doubt = require("../models/Doubt");
const TestAttempt = require("../models/TestAttempt");
const { generateOtp, hashOtp } = require("../utils/otp");
const Otp = require("../models/Otp");
const env = require("../config/env");
const { sendStudentProvisionEmail } = require("../services/mailer");
const audit = require("../utils/audit");
const { emitNotification } = require("../services/notifications");

async function dashboard(req, res) {
  const [students, materials, notices, tests, doubts, attempts] = await Promise.all([
    User.countDocuments({ role: "student" }),
    Material.countDocuments({ published: true }),
    Notice.countDocuments({ published: true }),
    Test.countDocuments(),
    Doubt.countDocuments({ status: { $ne: "resolved" } }),
    TestAttempt.countDocuments()
  ]);

  res.json({ stats: { students, materials, notices, tests, openDoubts: doubts, attempts } });
}

async function listStudents(req, res) {
  const { q, course, status } = req.query;
  const filter = { role: "student" };
  if (course) filter.course = course;
  if (status) filter.status = status;
  if (q) {
    const rx = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const students = await User.find(filter).select("-passwordHash").sort({ createdAt: -1 }).limit(200).lean();
  res.json({ students });
}

async function provisionStudent(req, res) {
  const { name, email, phone, password, course, semester } = req.body;
  if (!name || !email || !password || !course) {
    return res.status(400).json({ message: "Name, email, password and course are required." });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: "Student password must be at least 8 characters." });
  }

  const exists = await User.findOne({ email: email.toLowerCase().trim() });
  if (exists) return res.status(409).json({ message: "An account with this email already exists." });

  const passwordHash = await bcrypt.hash(password, 12);
  const student = await User.create({
    name,
    email: email.toLowerCase().trim(),
    phone,
    passwordHash,
    course,
    semester,
    role: "student",
    status: "active",
    emailVerified: false
  });

  const otp = generateOtp();
  await Otp.create({
    userId: student._id,
    email: student.email,
    purpose: "email-verification",
    otpHash: hashOtp(otp),
    expiresAt: new Date(Date.now() + env.otpExpiresMinutes * 60 * 1000)
  });

  try {
    await sendStudentProvisionEmail({
      to: student.email,
      name: student.name,
      temporaryPassword: password,
      otp
    });
  } catch (mailError) {
    await User.findByIdAndDelete(student._id);
    await Otp.deleteMany({ userId: student._id });
    throw mailError;
  }

  await audit(req, "student-provision", "User", student._id, {
    course: student.course,
    semester: student.semester
  });

  res.status(201).json({
    message: "Student account created and verification email sent.",
    student: {
      id: student._id,
      name: student.name,
      email: student.email,
      course: student.course,
      semester: student.semester
    }
  });
}

async function updateStudentStatus(req, res) {
  const { status } = req.body;
  if (!["active", "inactive", "suspended"].includes(status)) {
    return res.status(400).json({ message: "Invalid status." });
  }

  const student = await User.findOneAndUpdate(
    { _id: req.params.id, role: "student" },
    { status },
    { new: true }
  ).select("-passwordHash");

  if (!student) return res.status(404).json({ message: "Student not found." });
  await audit(req, "student-status-update", "User", student._id, { status });
  res.json({ message: "Student status updated.", student });
}

async function createNotice(req, res) {
  const { title, message, audience = "all" } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Title and message are required." });

  const notice = await Notice.create({
    title,
    message,
    audience,
    createdBy: req.user._id
  });

  emitNotification("notice-published", {
    id: notice._id,
    title: notice.title,
    audience: notice.audience
  });

  await audit(req, "notice-create", "Notice", notice._id);
  res.status(201).json({ message: "Notice published.", notice });
}

async function listNotices(req, res) {
  const notices = await Notice.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ notices });
}

async function createMaterial(req, res) {
  const { title, description, course, semester, subject, type, url, published } = req.body;

  if (!title) return res.status(400).json({ message: "Material title is required." });
  if (!req.file && !url) return res.status(400).json({ message: "Provide a file or URL." });

  const material = await Material.create({
    title,
    description,
    course: course || "Other",
    semester,
    subject,
    type: type || (req.file ? "PDF" : "LINK"),
    url: req.file ? undefined : url,
    storagePath: req.file ? path.resolve(req.file.path) : undefined,
    mimeType: req.file?.mimetype,
    originalName: req.file?.originalname,
    uploadedBy: req.user._id,
    published: published !== "false" && published !== false
  });

  await audit(req, "material-create", "Material", material._id);
  res.status(201).json({ message: "Material saved.", material });
}

async function listMaterials(req, res) {
  const materials = await Material.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ materials });
}

async function createTest(req, res) {
  const { title, subject, course, semester, duration, durationMinutes, questions, published, startsAt, endsAt } = req.body;

  let parsedQuestions = questions;
  if (typeof parsedQuestions === "string") {
    try {
      parsedQuestions = JSON.parse(parsedQuestions);
    } catch {
      return res.status(400).json({ message: "Questions must be valid JSON." });
    }
  }

  if (!title) return res.status(400).json({ message: "Test title is required." });

  const test = await Test.create({
    title,
    subject,
    course: course || "Other",
    semester,
    durationMinutes: Number(durationMinutes || duration || 15),
    questions: Array.isArray(parsedQuestions) ? parsedQuestions : [],
    published: published === true || published === "true",
    startsAt: startsAt || undefined,
    endsAt: endsAt || undefined,
    createdBy: req.user._id
  });

  await audit(req, "test-create", "Test", test._id);
  res.status(201).json({ message: "Test draft saved.", test });
}

async function listTests(req, res) {
  const tests = await Test.find().select("-questions.answer").sort({ createdAt: -1 }).limit(200).lean();
  res.json({ tests });
}

async function listDoubts(req, res) {
  const doubts = await Doubt.find()
    .populate("studentId", "name email course semester")
    .populate("repliedBy", "name email role")
    .sort({ createdAt: -1 })
    .limit(200)
    .lean();
  res.json({ doubts });
}

module.exports = {
  dashboard,
  listStudents,
  provisionStudent,
  updateStudentStatus,
  createNotice,
  listNotices,
  createMaterial,
  listMaterials,
  createTest,
  listTests,
  listDoubts
};
