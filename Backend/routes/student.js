const express = require("express");
const asyncHandler = require("../utils/asyncHandler");
const { protect, authorize } = require("../middleware/auth");
const controller = require("../controllers/studentController");

const router = express.Router();

router.use(protect, authorize("student"));

router.get("/me", asyncHandler(controller.me));
router.get("/materials", asyncHandler(controller.materials));
router.get("/materials/:id/view", asyncHandler(controller.viewMaterial));
router.get("/notices", asyncHandler(controller.notices));
router.get("/tests", asyncHandler(controller.tests));
router.post("/tests/submit", asyncHandler(controller.submitTest));
router.post("/doubts", asyncHandler(controller.createDoubt));
router.post("/tutor", asyncHandler(controller.tutor));

module.exports = router;
