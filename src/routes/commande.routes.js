const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createCommandeSchema,
  resendCommandeSchema,
  receiveCommandeSchema,
  invoiceRequestSchema,
} = require("../dtos/commande.dto");
const {
  createCommande,
  getCommandesByCustomer,
  resendCommande,
  getAllCommandes,
  receiveCommande,
  cancelCommande,
  searchCommandes,
  getLastTenCommandes,
  getAllCommandeByState,
  cancelThisCommande,
  getAllCommandesConfirmed,
  confirmDelivery,
  getAllCommandesLivred,
  getLastUnpaidCommande,
  requestRefund,
  downloadInvoice,
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
 *               type:
 *                 type: string
 *                 enum: [pro, standard]
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
router.post(
  "/",
  authenticateCustomer,
  validateDto(createCommandeSchema),
  createCommande
);

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
router.get(
  "/customer/:customerId",
  authenticateCustomer,
  getCommandesByCustomer
);

/**
 * @swagger
 * /commande/state/{status}:
 *   get:
 *     summary: Get all commandes ny status with pagination
 *     tags:
 *       - Commande
 *     parameters:
 *       - name: status
 *         in: path
 *         required: true
 *         description: Status of the commande to receive
 *         schema:
 *           type: string
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
router.get("/state/:status", getAllCommandeByState);

/**
 * @swagger
 * /commande/last/:
 *   get:
 *     summary: Get last ten
 *     tags:
 *       - Commande
 *     responses:
 *       200:
 *         description: List of last ten
 *       500:
 *         description: Internal server error
 */
router.get("/last", getLastTenCommandes);

/**
 * @swagger
 * /commande/search/:
 *   get:
 *     summary: Get search
 *     tags:
 *       - Commande
 *     parameters:
 *       - name: searchTerm
 *         in: query
 *         description: key search
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of search
 *       500:
 *         description: Internal server error
 */
router.get("/search", searchCommandes);

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

router.get("/", getAllCommandes);

router.get("/confirmed", getAllCommandesConfirmed);
router.get("/livred", getAllCommandesLivred);

router.get(
  "/confirmedelivery/:idCommande",
  authenticateToken,
  authenticateAdmin,
  confirmDelivery
);

/**
 * @swagger
 * /commande/cancelbyuser/{commandeId}:
 *   post:
 *     summary: Cancel a commande if it was canceled by the admin
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
 *         description: Commande resent successfully
 *       400:
 *         description: Commande cannot be resent
 */
router.post(
  "/cancelbyuser/:commandeId",
  authenticateCustomer,
  validateDto(resendCommandeSchema),
  cancelThisCommande
);

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
router.post(
  "/resend/:commandeId",
  authenticateCustomer,
  validateDto(resendCommandeSchema),
  resendCommande
);

router.post(
  "/refund-request/:commandeId",
  authenticateCustomer,
  validateDto(resendCommandeSchema),
  requestRefund
);

router.post(
  "/invoice/:commandeId",
  authenticateCustomer,
  validateDto(invoiceRequestSchema),
  downloadInvoice
);

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
 *     responses:
 *       200:
 *         description: Commande received successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Commande not found
 */
router.put(
  "/receive/:commandeId",
  authenticateToken,
  authenticateAdmin,
  receiveCommande
);

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
router.put(
  "/cancel/:commandeId",
  authenticateToken,
  authenticateAdmin,
  cancelCommande
);

router.get('last-unpaid/:customerId',authenticateToken,getLastUnpaidCommande)

module.exports = router;
