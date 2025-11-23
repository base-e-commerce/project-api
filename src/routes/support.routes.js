const express = require("express");
const {
  createTicket,
  listCustomerTickets,
  getCustomerTicket,
  listCustomerMessages,
  createCustomerMessage,
  closeCustomerTicket,
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
const supportAttachmentUpload = require("../middleware/support.attachment.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     SupportTicketIdParam:
 *       name: ticketId
 *       in: path
 *       required: true
 *       description: ID of the support ticket
 *       schema:
 *         type: integer
 *     SupportPageParam:
 *       name: page
 *       in: query
 *       required: false
 *       description: Page number (default 1)
 *       schema:
 *         type: integer
 *         minimum: 1
 *     SupportLimitParam:
 *       name: limit
 *       in: query
 *       required: false
 *       description: Items per page (default 10)
 *       schema:
 *         type: integer
 *         minimum: 1
 *     SupportStatusParam:
 *       name: status
 *       in: query
 *       required: false
 *       description: Filter tickets by status
 *       schema:
 *         type: string
 *         enum:
 *           - open
 *           - waiting-admin
 *           - answered
 *           - closed
 *   requestBodies:
 *     SupportTicketRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: string
 *                 maxLength: 190
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *             required:
 *               - content
 *     SupportMessageRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 2000
 *             required:
 *               - content
 *     SupportStatusUpdateRequest:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum:
 *                   - open
 *                   - waiting-admin
 *                   - answered
 *                   - closed
 *             required:
 *               - status
 */

/**
 * @swagger
 * /support/tickets:
 *   post:
 *     summary: Create a support ticket (Customer)
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/SupportTicketRequest'
 *     responses:
 *       201:
 *         description: Ticket created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/tickets",
  authenticateCustomer,
  supportAttachmentUpload,
  validateDto(createTicketSchema),
  createTicket
);

/**
 * @swagger
 * /support/tickets:
 *   get:
 *     summary: List customer support tickets
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportPageParam'
 *       - $ref: '#/components/parameters/SupportLimitParam'
 *     responses:
 *       200:
 *         description: Paginated list of tickets
 */
router.get("/tickets", authenticateCustomer, listCustomerTickets);

/**
 * @swagger
 * /support/tickets/{ticketId}:
 *   get:
 *     summary: Get a customer support ticket
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportTicketIdParam'
 *     responses:
 *       200:
 *         description: Ticket details
 *       404:
 *         description: Ticket not found
 */
router.get("/tickets/:ticketId", authenticateCustomer, getCustomerTicket);

/**
 * @swagger
 * /support/tickets/{ticketId}/messages:
 *   get:
 *     summary: List customer ticket messages
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportTicketIdParam'
 *       - $ref: '#/components/parameters/SupportPageParam'
 *       - $ref: '#/components/parameters/SupportLimitParam'
 *     responses:
 *       200:
 *         description: Paginated list of messages
 *       404:
 *         description: Ticket not found
 */
router.get(
  "/tickets/:ticketId/messages",
  authenticateCustomer,
  listCustomerMessages
);

/**
 * @swagger
 * /support/tickets/{ticketId}/messages:
 *   post:
 *     summary: Create a message on a ticket (Customer)
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportTicketIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/SupportMessageRequest'
 *     responses:
 *       201:
 *         description: Message created successfully
 *       404:
 *         description: Ticket not found
 */
router.post(
  "/tickets/:ticketId/messages",
  authenticateCustomer,
  supportAttachmentUpload,
  validateDto(supportMessageSchema),
  createCustomerMessage
);

/**
 * @swagger
 * /support/tickets/{ticketId}/close:
 *   patch:
 *     summary: Close a ticket (Customer)
 *     tags:
 *       - Support
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportTicketIdParam'
 *     responses:
 *       200:
 *         description: Ticket closed successfully
 *       404:
 *         description: Ticket not found
 */
router.patch(
  "/tickets/:ticketId/close",
  authenticateCustomer,
  closeCustomerTicket
);

/**
 * @swagger
 * /support/admin/tickets:
 *   get:
 *     summary: List support tickets (Admin)
 *     tags:
 *       - Support (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportPageParam'
 *       - $ref: '#/components/parameters/SupportLimitParam'
 *       - $ref: '#/components/parameters/SupportStatusParam'
 *     responses:
 *       200:
 *         description: Paginated list of tickets
 */
router.get(
  "/admin/tickets",
  authenticateToken,
  authenticateAdmin,
  listAdminTickets
);

/**
 * @swagger
 * /support/admin/tickets/{ticketId}:
 *   get:
 *     summary: Get ticket details (Admin)
 *     tags:
 *       - Support (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportTicketIdParam'
 *     responses:
 *       200:
 *         description: Ticket details
 *       404:
 *         description: Ticket not found
 */
router.get(
  "/admin/tickets/:ticketId",
  authenticateToken,
  authenticateAdmin,
  getAdminTicket
);

/**
 * @swagger
 * /support/admin/tickets/{ticketId}/messages:
 *   get:
 *     summary: List ticket messages (Admin)
 *     tags:
 *       - Support (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportTicketIdParam'
 *       - $ref: '#/components/parameters/SupportPageParam'
 *       - $ref: '#/components/parameters/SupportLimitParam'
 *     responses:
 *       200:
 *         description: Paginated list of messages
 *       404:
 *         description: Ticket not found
 */
router.get(
  "/admin/tickets/:ticketId/messages",
  authenticateToken,
  authenticateAdmin,
  listAdminMessages
);

/**
 * @swagger
 * /support/admin/tickets/{ticketId}/messages:
 *   post:
 *     summary: Create a message on a ticket (Admin)
 *     tags:
 *       - Support (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportTicketIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/SupportMessageRequest'
 *     responses:
 *       201:
 *         description: Message created successfully
 *       404:
 *         description: Ticket not found
 */
router.post(
  "/admin/tickets/:ticketId/messages",
  authenticateToken,
  authenticateAdmin,
  supportAttachmentUpload,
  validateDto(supportMessageSchema),
  createAdminMessage
);

/**
 * @swagger
 * /support/admin/tickets/{ticketId}/status:
 *   patch:
 *     summary: Update ticket status (Admin)
 *     tags:
 *       - Support (Admin)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/SupportTicketIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/SupportStatusUpdateRequest'
 *     responses:
 *       200:
 *         description: Ticket updated successfully
 *       404:
 *         description: Ticket not found
 */
router.patch(
  "/admin/tickets/:ticketId/status",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateTicketStatusSchema),
  updateTicketStatus
);

module.exports = router;
