const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const authenticateCustomer = require("../middleware/auth.client.middleware");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const demandeMachineUpload = require("../middleware/demande-machine-upload.middleware");
const {
  createDemandeMachineSchema,
  updateDemandeMachineAdminSchema,
} = require("../dtos/demande-machine.dto");
const {
  uploadDemandeMachineImage,
  createDemandeMachine,
  listCustomerDemandeMachines,
  listAdminDemandeMachines,
  updateDemandeMachineByAdmin,
} = require("../controller/demande-machine.controller");

const router = express.Router();

router.post(
  "/image",
  authenticateCustomer,
  demandeMachineUpload.array("images", 10),
  uploadDemandeMachineImage
);

router.post(
  "/",
  authenticateCustomer,
  validateDto(createDemandeMachineSchema),
  createDemandeMachine
);

router.get("/my", authenticateCustomer, listCustomerDemandeMachines);

router.get(
  "/admin",
  authenticateToken,
  authenticateAdmin,
  listAdminDemandeMachines
);

router.patch(
  "/admin/:id",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateDemandeMachineAdminSchema),
  updateDemandeMachineByAdmin
);

module.exports = router;
