const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createProductSchema,
  updateProductSchema,
} = require("../dtos/product.dto");
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addImageToProduct,
  deleteProductImage,
  getSearchProducts,
  getProductsCategory
} = require("../controller/product.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     ProductIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the product
 *       schema:
 *         type: string
 *     idCategory:
 *       name: idCategory
 *       in: path
 *       required: true
 *       description: ID of the category
 *       schema:
 *         type: string
 *     key:
 *       name: key
 *       in: path
 *       required: true
 *       description: key search
 *       schema:
 *         type: string
 *     ProductIdImageParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the product image
 *       schema:
 *         type: string
 *   requestBodies:
 *     ProductRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the product
 *               description:
 *                 type: string
 *                 description: The description of the product
 *               currency:
 *                 type: string
 *                 description: The currency of the product
 *               currency_name:
 *                 type: string
 *                 description: The currency name of the product
 *               price:
 *                 type: number
 *               stock_quantity:
 *                 type: number
 *                 description: The stock quantity of the product
 *               category_id:
 *                 type: number
 *                 description: The ID of the category
 *             required:
 *               - name
 *               - price
 *               - categoryId
 */

/**
 * @swagger
 * /product/category/{idCategory}:
 *   get:
 *     summary: Get products for category
 *     tags:
 *       - Product
 *     parameters:
 *        - $ref: '#/components/parameters/idCategory'
 *     responses:
 *       200:
 *         description: Get products for category
 */

router.get("/category/:idCategory", getProductsCategory);
/**
 * @swagger
 * /product/search/{key}:
 *   get:
 *     summary: Get search products with pagination
 *     tags:
 *       - Product
 *     parameters:
 *        - $ref: '#/components/parameters/key'
 *     responses:
 *       200:
 *         description: Get search products
 */
router.get("/search/:key", getSearchProducts);

/**
 * @swagger
 * /product/:
 *   get:
 *     summary: Get all products with pagination
 *     tags:
 *       - Product
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of products to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: The number of products to skip
 *     responses:
 *       200:
 *         description: Get all products
 */
router.get("/", getAllProducts);

/**
 * @swagger
 * /product/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags:
 *       - Product
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdParam'
 *     responses:
 *       200:
 *         description: Get a single product by ID
 *       404:
 *         description: Product not found
 */
router.get("/:id", getProductById);

/**
 * @swagger
 * /product/:
 *   post:
 *     summary: Create a new product
 *     tags:
 *       - Product
 *     requestBody:
 *       $ref: '#/components/requestBodies/ProductRequestBody'
 *     responses:
 *       201:
 *         description: Product created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", validateDto(createProductSchema), createProduct);

/**
 * @swagger
 * /product/image:
 *   post:
 *     summary: Add an image to a product
 *     tags:
 *       - Product
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: integer
 *                 description: The ID of the product
 *               imageUrl:
 *                 type: string
 *                 description: The URL of the image
 *     responses:
 *       201:
 *         description: Image added successfully
 *       400:
 *         description: Bad Request
 *       500:
 *         description: Internal server error
 */
router.post("/image", addImageToProduct);

/**
 * @swagger
 * /product/{id}:
 *   put:
 *     summary: Update product information by ID
 *     tags:
 *       - Product
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/ProductRequestBody'
 *     responses:
 *       200:
 *         description: Product updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Product not found
 */
router.put(
  "/:id",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateProductSchema),
  updateProduct
);

/**
 * @swagger
 * /product/{id}:
 *   delete:
 *     summary: Delete product by ID
 *     tags:
 *       - Product
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdParam'
 *     responses:
 *       200:
 *         description: Product deleted successfully
 *       404:
 *         description: Product not found
 */
router.delete("/:id", deleteProduct);

/**
 * @swagger
 * /product/image/{productIdImage}:
 *   delete:
 *     summary: Delete  image by ID
 *     tags:
 *       - Product
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdImageParam'
 *     responses:
 *       200:
 *         description: Product Image deleted successfully
 *       404:
 *         description: Product Image not found
 */
router.delete("/image/:productIdImage", deleteProductImage);

/**
 * @swagger
 * /product/image/{productIdImage}:
 *   delete:
 *     summary: Delete  image by ID
 *     tags:
 *       - Product
 *     parameters:
 *       - $ref: '#/components/parameters/ProductIdImageParam'
 *     responses:
 *       200:
 *         description: Product Image deleted successfully
 *       404:
 *         description: Product Image not found
 */
router.delete(
  "/image/:productIdImage",
  authenticateToken,
  authenticateAdmin,
  deleteProductImage
);

module.exports = router;
