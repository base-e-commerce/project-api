const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const authenticateCustomer = require("../middleware/auth.client.middleware");
const {
  createCommandBoxSchema,
  updateCommandBoxSchema,
} = require("../dtos/commandbox.dto");
const {
  listCommandBoxes,
  getCommandBoxById,
  createCommandBox,
  updateCommandBox,
  deleteCommandBox,
  createPaymentSession,
} = require("../controller/commandbox.controller");

const router = express.Router();

router.get("/", listCommandBoxes);
router.get("/:id", getCommandBoxById);

router.post(
  "/",
  authenticateToken,
  authenticateAdmin,
  validateDto(createCommandBoxSchema),
  createCommandBox
);

router.put(
  "/:id",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateCommandBoxSchema),
  updateCommandBox
);

router.delete(
  "/:id",
  authenticateToken,
  authenticateAdmin,
  deleteCommandBox
);

router.post(
  "/:id/payment",
  authenticateCustomer,
  createPaymentSession
);

module.exports = router;
