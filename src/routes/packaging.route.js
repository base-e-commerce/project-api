const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createPackagingSchema,
  updatePackagingSchema,
} = require("../dtos/packaging.dto");
const {
  getAllPackagings,
  getAllPackagingUser,
  getPackagingById,
  createPackaging,
  updatePackaging,
  deletePackaging,
} = require("../controller/packaging.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const authenticateCustomer = require("../middleware/auth.client.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     PackagingIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the packaging
 *       schema:
 *         type: integer
 *       example: 1
 *     PackagingEmailParam:
 *       name: email
 *       in: path
 *       required: true
 *       description: Email of the packaging
 *       schema:
 *         type: string
 *       example: user@example.com
 *   requestBodies:
 *     PackagingRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *               information:
 *                 type: string
 */

/**
 * @swagger
 * /packaging/:
 *   get:
 *     summary: Get all packagings
 *     tags:
 *       - Packaging
 *     responses:
 *       200:
 *         description: Get all packagings
 */
router.get("/", getAllPackagings);

/**
 * @swagger
 * /packaging/all/{email}:
 *   get:
 *     summary: Get packaging by email
 *     tags:
 *       - Packaging
 *     parameters:
 *       - $ref: '#/components/parameters/PackagingEmailParam'
 *     responses:
 *       200:
 *         description: Get a single packaging by email
 *       404:
 *         description: Packaging not found
 */
router.get("/all/:email", authenticateCustomer, getAllPackagingUser);

/**
 * @swagger
 * /packaging/{id}:
 *   get:
 *     summary: Get packaging by ID
 *     tags:
 *       - Packaging
 *     parameters:
 *       - $ref: '#/components/parameters/PackagingIdParam'
 *     responses:
 *       200:
 *         description: Get a single packaging by ID
 *       404:
 *         description: Packaging not found
 */
router.get("/:id", getPackagingById);

/**
 * @swagger
 * /packaging/:
 *   post:
 *     summary: Create a new packaging
 *     tags:
 *       - Packaging
 *     requestBody:
 *       $ref: '#/components/requestBodies/PackagingRequestBody'
 *     responses:
 *       201:
 *         description: Packaging created successfully
 *       400:
 *         description: Invalid input data
 */
router.post(
  "/",
  // authenticateToken,
  // authenticateAdmin,
  authenticateCustomer,
  validateDto(createPackagingSchema),
  createPackaging
);

/**
 * @swagger
 * /packaging/{id}:
 *   put:
 *     summary: Update packaging information by ID
 *     tags:
 *       - Packaging
 *     parameters:
 *       - $ref: '#/components/parameters/PackagingIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/PackagingRequestBody'
 *     responses:
 *       200:
 *         description: Packaging updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Packaging not found
 */
router.put(
  "/:id",
  authenticateToken,
  authenticateAdmin,
  validateDto(updatePackagingSchema),
  updatePackaging
);

/**
 * @swagger
 * /packaging/{id}:
 *   delete:
 *     summary: Delete packaging by ID
 *     tags:
 *       - Packaging
 *     parameters:
 *       - $ref: '#/components/parameters/PackagingIdParam'
 *     responses:
 *       200:
 *         description: Packaging deleted successfully
 *       404:
 *         description: Packaging not found
 */
router.delete("/:id", authenticateToken, authenticateAdmin, deletePackaging);

module.exports = router;
