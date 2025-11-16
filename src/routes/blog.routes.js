const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const { createBlogSchema, updateBlogSchema } = require("../dtos/blog.dto");
const {
  createBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  getPublishedBlogs,
  getBlogBySlug,
} = require("../controller/blog.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     BlogIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the blog
 *       schema:
 *         type: integer
 *     BlogSlugParam:
 *       name: slug
 *       in: path
 *       required: true
 *       description: Slug of the blog
 *       schema:
 *         type: string
 *   requestBodies:
 *     BlogRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Mon premier article de blog"
 *               content:
 *                 type: string
 *                 example: "Contenu complet de l'article..."
 *               excerpt:
 *                 type: string
 *                 example: "Résumé de l'article"
 *               image_url:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *               published_at:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-01-15T10:00:00Z"
 */

// Public routes
/**
 * @swagger
 * /blog/public:
 *   get:
 *     summary: Get all published blogs (Public)
 *     tags:
 *       - Blog (Public)
 *     responses:
 *       200:
 *         description: List of published blogs
 */
router.get("/public", getPublishedBlogs);

/**
 * @swagger
 * /blog/public/{slug}:
 *   get:
 *     summary: Get blog by slug (Public)
 *     tags:
 *       - Blog (Public)
 *     parameters:
 *       - $ref: '#/components/parameters/BlogSlugParam'
 *     responses:
 *       200:
 *         description: Blog details
 *       404:
 *         description: Blog not found
 */
router.get("/public/:slug", getBlogBySlug);

// Admin routes
/**
 * @swagger
 * /blog/:
 *   get:
 *     summary: Get all blogs (Admin)
 *     tags:
 *       - Blog (Admin)
 *     parameters:
 *       - name: include_inactive
 *         in: query
 *         description: Include inactive blogs
 *         schema:
 *           type: boolean
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all blogs
 */
router.get("/", authenticateToken, authenticateAdmin, getAllBlogs);

/**
 * @swagger
 * /blog/{id}:
 *   get:
 *     summary: Get blog by ID (Admin)
 *     tags:
 *       - Blog (Admin)
 *     parameters:
 *       - $ref: '#/components/parameters/BlogIdParam'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blog details
 *       404:
 *         description: Blog not found
 */
router.get("/:id", authenticateToken, authenticateAdmin, getBlogById);

/**
 * @swagger
 * /blog/:
 *   post:
 *     summary: Create a new blog (Admin)
 *     tags:
 *       - Blog (Admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/BlogRequestBody'
 *     responses:
 *       201:
 *         description: Blog created successfully
 *       400:
 *         description: Invalid input data
 */
router.post(
  "/",
  authenticateToken,
  authenticateAdmin,
  validateDto(createBlogSchema),
  createBlog
);

/**
 * @swagger
 * /blog/{id}:
 *   put:
 *     summary: Update blog by ID (Admin)
 *     tags:
 *       - Blog (Admin)
 *     parameters:
 *       - $ref: '#/components/parameters/BlogIdParam'
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       $ref: '#/components/requestBodies/BlogRequestBody'
 *     responses:
 *       200:
 *         description: Blog updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Blog not found
 */
router.put(
  "/:id",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateBlogSchema),
  updateBlog
);

/**
 * @swagger
 * /blog/{id}:
 *   delete:
 *     summary: Delete blog by ID (Admin - Soft delete)
 *     tags:
 *       - Blog (Admin)
 *     parameters:
 *       - $ref: '#/components/parameters/BlogIdParam'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Blog deleted successfully
 *       404:
 *         description: Blog not found
 */
router.delete("/:id", authenticateToken, authenticateAdmin, deleteBlog);

module.exports = router;
