
const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const { createBoxSchema, updateBoxSchema } = require("../dtos/box.dto");
const {
  listBoxes,
  getBoxById,
  createBox,
  updateBox,
  deleteBox,
} = require("../controller/box.controller");

const router = express.Router();

router.get("/", listBoxes);
router.get("/:identifier", getBoxById);
router.post(
  "/",
  authenticateToken,
  authenticateAdmin,
  validateDto(createBoxSchema),
  createBox
);
router.put(
  "/:identifier",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateBoxSchema),
  updateBox
);
router.delete(
  "/:identifier",
  authenticateToken,
  authenticateAdmin,
  deleteBox
);

module.exports = router;
