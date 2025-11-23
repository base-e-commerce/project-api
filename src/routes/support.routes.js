const express = require("express");
const {
  createTicket,
  listCustomerTickets,
  getCustomerTicket,
  listCustomerMessages,
  createCustomerMessage,
  listAdminTickets,
  getAdminTicket,
  listAdminMessages,
  createAdminMessage,
  updateTicketStatus,
} = require("../controller/support.controller");
const authenticateCustomer = require("../middleware/auth.client.middleware");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createTicketSchema,
  supportMessageSchema,
  updateTicketStatusSchema,
} = require("../dtos/support.dto");

const router = express.Router();

router.post(
  "/tickets",
  authenticateCustomer,
  validateDto(createTicketSchema),
  createTicket
);

router.get("/tickets", authenticateCustomer, listCustomerTickets);
router.get("/tickets/:ticketId", authenticateCustomer, getCustomerTicket);
router.get(
  "/tickets/:ticketId/messages",
  authenticateCustomer,
  listCustomerMessages
);

router.post(
  "/tickets/:ticketId/messages",
  authenticateCustomer,
  validateDto(supportMessageSchema),
  createCustomerMessage
);

router.get(
  "/admin/tickets",
  authenticateToken,
  authenticateAdmin,
  listAdminTickets
);

router.get(
  "/admin/tickets/:ticketId",
  authenticateToken,
  authenticateAdmin,
  getAdminTicket
);

router.get(
  "/admin/tickets/:ticketId/messages",
  authenticateToken,
  authenticateAdmin,
  listAdminMessages
);

router.post(
  "/admin/tickets/:ticketId/messages",
  authenticateToken,
  authenticateAdmin,
  validateDto(supportMessageSchema),
  createAdminMessage
);

router.patch(
  "/admin/tickets/:ticketId/status",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateTicketStatusSchema),
  updateTicketStatus
);

module.exports = router;
