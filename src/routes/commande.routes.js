const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const { createCommandeSchema, resendCommandeSchema, receiveCommandeSchema } = require("../dtos/commande.dto");
const {
  createCommande,
  getCommandesByCustomer,
  resendCommande,
  getAllCommandes,
  receiveCommande,
  cancelCommande,
} = require("../controller/commande.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const authenticateCustomer = require("../middleware/auth.client.middleware");

const router = express.Router();

/**
 * @swagger
 * /commande/:
 *   post:
 *     summary: Create a new commande
 *     tags:
 *       - Commande
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               customerId:
 *                 type: integer
 *               details:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product_id:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     unit_price:
 *                       type: number
 *     responses:
 *       201:
 *         description: Commande created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", authenticateCustomer, validateDto(createCommandeSchema), createCommande);

/**
 * @swagger
 * /commande/customer/{customerId}:
 *   get:
 *     summary: Get all commandes for a customer
 *     tags:
 *       - Commande
 *     parameters:
 *       - name: customerId
 *         in: path
 *         required: true
 *         description: ID of the customer
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of commandes for the customer
 *       404:
 *         description: Customer not found
 */
router.get("/customer/:customerId", authenticateCustomer, getCommandesByCustomer);

/**
 * @swagger
 * /commande/resend/{commandeId}:
 *   post:
 *     summary: Resend a commande if it was canceled by the admin
 *     tags:
 *       - Commande
 *     parameters:
 *       - name: commandeId
 *         in: path
 *         required: true
 *         description: ID of the commande to resend
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Commande resent successfully
 *       400:
 *         description: Commande cannot be resent
 */
router.post("/resend/:commandeId", authenticateCustomer, validateDto(resendCommandeSchema), resendCommande);

/**
 * @swagger
 * /commande/:
 *   get:
 *     summary: Get all commandes with pagination
 *     tags:
 *       - Commande
 *     parameters:
 *       - name: page
 *         in: query
 *         description: The page number to retrieve (default is 1)
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: pageSize
 *         in: query
 *         description: The number of commandes per page (default is 10)
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of commandes with pagination metadata
 *       500:
 *         description: Internal server error
 */
router.get("/", authenticateToken, authenticateAdmin, getAllCommandes);

/**
 * @swagger
 * /commande/receive/{commandeId}:
 *   put:
 *     summary: Receive a commande and assign it to an admin
 *     tags:
 *       - Commande
 *     parameters:
 *       - name: commandeId
 *         in: path
 *         required: true
 *         description: ID of the commande to receive
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Commande received successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Commande not found
 */
router.put("/receive/:commandeId", authenticateToken, authenticateAdmin, validateDto(receiveCommandeSchema), receiveCommande);

/**
 * @swagger
 * /commande/cancel/{commandeId}:
 *   put:
 *     summary: Cancel a commande
 *     tags:
 *       - Commande
 *     parameters:
 *       - name: commandeId
 *         in: path
 *         required: true
 *         description: ID of the commande to cancel
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Commande canceled successfully
 *       404:
 *         description: Commande not found
 */
router.put("/cancel/:commandeId", authenticateToken, authenticateAdmin, cancelCommande);

module.exports = router;
