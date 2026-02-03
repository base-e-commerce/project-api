const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createDevisSchema,
  updateDevisSchema,
  convertDevisToCommandeSchema,
} = require("../dtos/devis.dto");
const {
  getAllDevis,
  getAllDevisByEmail,
  getDevisById,
  createDevis,
  updateDevis,
  deleteDevis,
  createDevisPayment,
  convertDevisToCommande,
} = require("../controller/devis.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const authenticateCustomer = require("../middleware/auth.client.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     DevisIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the devis
 *       schema:
 *         type: integer
 *       example: 1
 *     DevisEmailParam:
 *       name: email
 *       in: path
 *       required: true
 *       description: Email associated with the devis
 *       schema:
 *         type: string
 *       example: user@example.com
 *   requestBodies:
 *     DevisRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               product_id:
 *                 type: integer
 *               nombre:
 *                 type: integer
 *               email:
 *                 type: string
 *               telephone:
 *                 type: string
 *               productJson:
 *                 type: object
 */

/**
 * @swagger
 * /devis/:
 *   get:
 *     summary: Get all devis
 *     tags:
 *       - Devis
 *     responses:
 *       200:
 *         description: List all devis
 */
router.get("/", getAllDevis);

/**
 * @swagger
 * /devis/all/{email}:
 *   get:
 *     summary: Get all devis by email
 *     tags:
 *       - Devis
 *     parameters:
 *       - $ref: '#/components/parameters/DevisEmailParam'
 *     responses:
 *       200:
 *         description: List all devis for a specific user
 *       404:
 *         description: No devis found
 */
router.get("/all/:email", getAllDevisByEmail);

/**
 * @swagger
 * /devis/{id}:
 *   get:
 *     summary: Get devis by ID
 *     tags:
 *       - Devis
 *     parameters:
 *       - $ref: '#/components/parameters/DevisIdParam'
 *     responses:
 *       200:
 *         description: Devis fetched successfully
 *       404:
 *         description: Devis not found
 */
router.get("/:id", getDevisById);

/**
 * @swagger
 * /devis/{id}/payment:
 *   post:
 *     summary: Create a Stripe checkout session for a devis
 *     tags:
 *       - Devis
 *     parameters:
 *       - $ref: '#/components/parameters/DevisIdParam'
 *     responses:
 *       200:
 *         description: Session created successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Devis not found
 */
router.post(
  "/:id/payment",
  authenticateCustomer,
  createDevisPayment
);

/**
 * @swagger
 * /devis/{id}/commande:
 *   post:
 *     summary: Convert a validated devis into a commande and get a Stripe session
 *     tags:
 *       - Devis
 *     parameters:
 *       - $ref: '#/components/parameters/DevisIdParam'
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               shippingAddressId:
 *                 type: integer
 *               type:
 *                 type: string
 *                 enum: [standard, pro]
 *               currency:
 *                 type: string
 *             examples:
 *               default:
 *                 value:
 *                   shippingAddressId: 4
 *                   type: standard
 *                   currency: EUR
 *     responses:
 *       201:
 *         description: Commande created and Stripe session ready
 *       400:
 *         description: Invalid input or unvalidated devis
 *       401:
 *         description: Unauthorized (authentication required)
 *       403:
 *         description: Forbidden (not the owner of the devis)
 *       404:
 *         description: Devis or customer not found
 */
router.post(
  "/:id/commande",
  authenticateCustomer,
  validateDto(convertDevisToCommandeSchema),
  convertDevisToCommande
);

/**
 * @swagger
 * /devis/:
 *   post:
 *     summary: Create a new devis
 *     tags:
 *       - Devis
 *     requestBody:
 *       $ref: '#/components/requestBodies/DevisRequestBody'
 *     responses:
 *       201:
 *         description: Devis created successfully
 *       400:
 *         description: Invalid input
 */
router.post(
  "/",
  // authenticateToken,
  // authenticateAdmin,
  // authenticateCustomer,
  validateDto(createDevisSchema),
  createDevis
);

/**
 * @swagger
 * /devis/{id}:
 *   put:
 *     summary: Update devis information
 *     tags:
 *       - Devis
 *     parameters:
 *       - $ref: '#/components/parameters/DevisIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/DevisRequestBody'
 *     responses:
 *       200:
 *         description: Devis updated successfully
 *       400:
 *         description: Invalid input
 *       404:
 *         description: Devis not found
 */
router.put(
  "/:id",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateDevisSchema),
  updateDevis
);

/**
 * @swagger
 * /devis/{id}:
 *   delete:
 *     summary: Delete devis by ID
 *     tags:
 *       - Devis
 *     parameters:
 *       - $ref: '#/components/parameters/DevisIdParam'
 *     responses:
 *       200:
 *         description: Devis deleted successfully
 *       404:
 *         description: Devis not found
 */
router.delete("/:id", authenticateToken, authenticateAdmin, deleteDevis);

module.exports = router;
