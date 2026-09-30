const path = require("path");
const fs = require("fs");
const Material = require("../models/Material");
const Notice = require("../models/Notice");
const Test = require("../models/Test");
const TestAttempt = require("../models/TestAttempt");
const Doubt = require("../models/Doubt");
const { askTutor } = require("../services/gemini");
const { emitToUser, emitNotification } = require("../services/notifications");
const audit = require("../utils/audit");

async function me(req, res) {
  res.json({ user: req.user });
}

async function materials(req, res) {
  const filter = { published: true, allowedRoles: "student" };
  if (req.user.course && req.user.course !== "Other") {
    filter.$or = [{ course: req.user.course }, { course: "Other" }];
  }
  const data = await Material.find(filter).sort({ createdAt: -1 }).lean();
  res.json({ materials: data.map((m) => ({
    ...m,
    url: m.storagePath ? `/api/student/materials/${m._id}/view` : m.url
  })) });
}

async function viewMaterial(req, res) {
  const material = await Material.findOne({
    _id: req.params.id,
    published: true,
    allowedRoles: "student"
  });

  if (!material) return res.status(404).json({ message: "Material not found." });

  if (material.storagePath) {
    const resolved = path.resolve(material.storagePath);
    const root = path.resolve(process.cwd());
    if (!resolved.startsWith(root)) return res.status(403).json({ message: "Invalid file path." });
    if (!fs.existsSync(resolved)) return res.status(404).json({ message: "File is unavailable." });

    res.setHeader("Content-Type", material.mimeType || "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${encodeURIComponent(material.originalName || material.title)}"`);
    return fs.createReadStream(resolved).pipe(res);
  }

  if (material.url) return res.redirect(material.url);
  return res.status(404).json({ message: "Material has no file or URL." });
}

async function notices(req, res) {
  const data = await Notice.find({
    published: true,
    $or: [{ audience: "all" }, { audience: "student" }, { audience: req.user.course }]
  }).sort({ publishedAt: -1 }).limit(50).lean();
  res.json({ notices: data });
}

async function tests(req, res) {
  const data = await Test.find({
    published: true,
    $or: [{ course: req.user.course }, { course: "Other" }],
    $and: [
      { $or: [{ startsAt: null }, { startsAt: { $lte: new Date() } }] },
      { $or: [{ endsAt: null }, { endsAt: { $gte: new Date() } }] }
    ]
  }).select("-questions.answer").sort({ createdAt: -1 }).lean();

  const attempted = await TestAttempt.find({ studentId: req.user._id }).select("testId submittedAt score maxScore").lean();
  const attemptedMap = new Map(attempted.map((a) => [String(a.testId), a]));

  res.json({
    tests: data.map((t) => ({
      ...t,
      questions: t.questions.map(({ answer, ...q }) => q),
      attempt: attemptedMap.get(String(t._id)) || null
    }))
  });
}

async function submitTest(req, res) {
  const { testId, answers = {}, tabSwitches = 0, startedAt } = req.body || {};
  let test = null;

  if (testId) {
    test = await Test.findOne({ _id: testId, published: true }).select("+questions.answer");
  }

  // The current frontend can submit without a selected test. Keep the endpoint usable
  // for the demo UI while still recording a server-side proctoring event.
  if (!test) {
    await audit(req, "test-submit-without-test", "Test", testId, {
      tabSwitches: Number(tabSwitches) || 0
    });
    emitToUser(req.user._id, "notification", { message: "Test submission recorded." });
    return res.json({ message: "Test submission recorded.", demo: true });
  }

  if (test.course !== "Other" && test.course !== req.user.course) {
    return res.status(403).json({ message: "This test is not assigned to your course." });
  }

  const existing = await TestAttempt.findOne({ testId: test._id, studentId: req.user._id });
  if (existing) return res.status(409).json({ message: "You have already submitted this test." });

  let score = 0;
  let maxScore = 0;

  for (const q of test.questions) {
    maxScore += Number(q.marks || 0);
    if (q.type === "mcq" && answers[String(q._id)] != null && String(answers[String(q._id)]) === String(q.answer)) {
      score += Number(q.marks || 0);
    }
  }

  const attempt = await TestAttempt.create({
    testId: test._id,
    studentId: req.user._id,
    answers,
    score,
    maxScore,
    tabSwitches: Math.max(0, Number(tabSwitches) || 0),
    startedAt: startedAt ? new Date(startedAt) : new Date(),
    submittedAt: new Date()
  });

  await audit(req, "test-submit", "TestAttempt", attempt._id, {
    testId: test._id,
    tabSwitches: attempt.tabSwitches
  });

  emitNotification("test-submitted", {
    testId: test._id,
    studentId: req.user._id,
    attemptId: attempt._id
  });

  res.status(201).json({
    message: "Test submitted successfully.",
    score,
    maxScore,
    attemptId: attempt._id
  });
}

async function createDoubt(req, res) {
  const { subject, question } = req.body;
  if (!question || String(question).trim().length < 5) {
    return res.status(400).json({ message: "Please enter a detailed question." });
  }

  const doubt = await Doubt.create({
    studentId: req.user._id,
    subject,
    question
  });

  emitNotification("doubt-created", {
    doubtId: doubt._id,
    studentId: req.user._id,
    subject: doubt.subject
  });

  res.status(201).json({ message: "Doubt submitted.", doubt });
}

async function tutor(req, res) {
  const { question } = req.body;
  if (!question || String(question).trim().length < 2) {
    return res.status(400).json({ message: "Please enter a question." });
  }

  const answer = await askTutor({
    question,
    course: req.user.course,
    semester: req.user.semester
  });

  res.json({ answer });
}

module.exports = { me, materials, viewMaterial, notices, tests, submitTest, createDoubt, tutor };
