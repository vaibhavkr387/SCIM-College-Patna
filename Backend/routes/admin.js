const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize, requirePermission } = require("../middleware/auth");
const upload = require("../middleware/upload");
const controller = require("../controllers/adminController");

const router = express.Router();

router.use(protect, authorize("admin", "co-member"));

router.get("/dashboard", requirePermission("viewAnalytics"), asyncHandler(controller.dashboard));
router.get("/students", requirePermission("manageStudents"), asyncHandler(controller.listStudents));
router.post("/students", requirePermission("manageStudents"), asyncHandler(controller.provisionStudent));
router.patch("/students/:id/status", requirePermission("manageStudents"), asyncHandler(controller.updateStudentStatus));

router.post("/notices", requirePermission("manageContent"), asyncHandler(controller.createNotice));
router.get("/notices", requirePermission("manageContent"), asyncHandler(controller.listNotices));

router.post("/materials", requirePermission("manageContent"), upload.single("file"), asyncHandler(controller.createMaterial));
router.get("/materials", requirePermission("manageContent"), asyncHandler(controller.listMaterials));

router.post("/tests", requirePermission("manageTests"), asyncHandler(controller.createTest));
router.get("/tests", requirePermission("manageTests"), asyncHandler(controller.listTests));

router.get("/doubts", requirePermission("viewAnalytics"), asyncHandler(controller.listDoubts));

module.exports = router;
