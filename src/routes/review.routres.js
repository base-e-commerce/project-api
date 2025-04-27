const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createReviewSchema,
  updateReviewSchema,
} = require("../dtos/review.dto");
const {
  getAllReviews,
  getReviewById,
  createReview,
  updateReview,
  deleteReview,
  getReviewsByProductId,
  getReviewsByCustomerId,
} = require("../controller/review.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     ReviewIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the review
 *       schema:
 *         type: integer
 *     ProductIdParam:
 *       name: productId
 *       in: path
 *       required: true
 *       description: ID of the product
 *       schema:
 *         type: integer
 *     CustomerIdParam:
 *       name: customerId
 *       in: path
 *       required: true
 *       description: ID of the customer
 *       schema:
 *         type: integer
 *   requestBodies:
 *     ReviewRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: integer
 *               customer_id:
 *                 type: integer
 *               rating:
 *                 type: integer
 */

/**
 * @swagger
 * /review/:
 *   get:
 *     summary: Get all reviews
 *     tags:
 *       - Review
 *     responses:
 *       200:
 *         description: Get all reviews
 */
router.get("/", authenticateToken, getAllReviews);

/**
 * @swagger
 * /review/{id}:
 *   get:
 *     summary: Get review by ID
 *     tags:
 *       - Review
 *     parameters:
 *       - $ref: '#/components/parameters/ReviewIdParam'
 *     responses:
 *       200:
 *         description: Get a single review by ID
 *       404:
 *         description: Review not found
 */
router.get("/:id", authenticateToken, getReviewById);

/**
 * @swagger
 * /review/product/{productId}:
 *   get:
 *     summary: Get reviews by product ID
 *     tags:
 *       - Review
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdParam'
 *     responses:
 *       200:
 *         description: Get reviews for a specific product
 */
router.get("/product/:productId", authenticateToken, getReviewsByProductId);

/**
 * @swagger
 * /review/customer/{customerId}:
 *   get:
 *     summary: Get reviews by customer ID
 *     tags:
 *       - Review
 *     parameters:
 *       - $ref: '#/components/parameters/CustomerIdParam'
 *     responses:
 *       200:
 *         description: Get reviews for a specific customer
 */
router.get("/customer/:customerId", authenticateToken, getReviewsByCustomerId);

/**
 * @swagger
 * /review/:
 *   post:
 *     summary: Create a new review
 *     tags:
 *       - Review
 *     requestBody:
 *       $ref: '#/components/requestBodies/ReviewRequestBody'
 *     responses:
 *       201:
 *         description: Review created successfully
 *       400:
 *         description: Invalid input data
 */
router.post(
  "/",
  authenticateToken,
  validateDto(createReviewSchema),
  createReview
);

/**
 * @swagger
 * /review/{id}:
 *   put:
 *     summary: Update review information by ID
 *     tags:
 *       - Review
 *     parameters:
 *       - $ref: '#/components/parameters/ReviewIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/ReviewRequestBody'
 *     responses:
 *       200:
 *         description: Review updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Review not found
 */
router.put(
  "/:id",
  authenticateToken,
  validateDto(updateReviewSchema),
  updateReview
);

/**
 * @swagger
 * /review/{id}:
 *   delete:
 *     summary: Delete review by ID
 *     tags:
 *       - Review
 *     parameters:
 *       - $ref: '#/components/parameters/ReviewIdParam'
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       404:
 *         description: Review not found
 */
router.delete("/:id", authenticateToken, deleteReview);

module.exports = router;
