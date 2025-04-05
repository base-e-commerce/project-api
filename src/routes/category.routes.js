const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../dtos/category.dto");
const {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/category.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     CategoryIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the category
 *       schema:
 *         type: integer
 *   requestBodies:
 *     CategoryRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               service_id:
 *                 type: number
 *                 description: The ID of the service
 */

/**
 * @swagger
 * /category/:
 *   get:
 *     summary: Get all categories
 *     tags:
 *       - Category
 *     responses:
 *       200:
 *         description: Get all categories
 */
router.get("/", authenticateToken, authenticateAdmin, getAllCategories);

/**
 * @swagger
 * /category/{id}:
 *   get:
 *     summary: Get category by ID
 *     tags:
 *       - Category
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryIdParam'
 *     responses:
 *       200:
 *         description: Get a single category by ID
 *       404:
 *         description: Category not found
 */
router.get("/:id", authenticateToken, authenticateAdmin, getCategoryById);

/**
 * @swagger
 * /category/:
 *   post:
 *     summary: Create a new category
 *     tags:
 *       - Category
 *     requestBody:
 *       $ref: '#/components/requestBodies/CategoryRequestBody'
 *     responses:
 *       201:
 *         description: Category created successfully
 *       400:
 *         description: Invalid input data
 */
router.post(
  "/",
  authenticateToken,
  authenticateAdmin,
  validateDto(createCategorySchema),
  createCategory
);

/**
 * @swagger
 * /category/{id}:
 *   put:
 *     summary: Update category information by ID
 *     tags:
 *       - Category
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/CategoryRequestBody'
 *     responses:
 *       200:
 *         description: Category updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Category not found
 */
router.put(
  "/:id",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateCategorySchema),
  updateCategory
);

/**
 * @swagger
 * /category/{id}:
 *   delete:
 *     summary: Delete category by ID
 *     tags:
 *       - Category
 *     parameters:
 *       - $ref: '#/components/parameters/CategoryIdParam'
 *     responses:
 *       200:
 *         description: Category deleted successfully
 *       404:
 *         description: Category not found
 */
router.delete("/:id", authenticateToken, authenticateAdmin, deleteCategory);

module.exports = router;
