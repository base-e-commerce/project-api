const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const { createMachineSchema, updateMachineSchema } = require("../dtos/machine.dto");
const {
  listPublicMachines,
  getPublicMachineBySlug,
  listAdminMachines,
  getAdminMachineById,
  createMachine,
  updateMachine,
  deleteMachine,
} = require("../controller/machine.controller");

const router = express.Router();

router.get(
  "/admin",
  authenticateToken,
  authenticateAdmin,
  listAdminMachines
);
router.get(
  "/admin/:identifier",
  authenticateToken,
  authenticateAdmin,
  getAdminMachineById
);
router.post(
  "/admin",
  authenticateToken,
  authenticateAdmin,
  validateDto(createMachineSchema),
  createMachine
);
router.put(
  "/admin/:identifier",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateMachineSchema),
  updateMachine
);
router.delete(
  "/admin/:identifier",
  authenticateToken,
  authenticateAdmin,
  deleteMachine
);

router.get("/", listPublicMachines);
router.get("/:slug", getPublicMachineBySlug);

module.exports = router;
