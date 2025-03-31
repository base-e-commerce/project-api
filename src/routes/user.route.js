const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const { createUserSchema, updateUserSchema } = require("../dtos/user.dto");
const {
  getAllUser,
  getUserById,
  createUser,
  deleteUser,
  updateUser,
} = require("../controller/user.controller");

const router = express.Router();

/**
 * @swagger
 * /user/:
 *   get:
 *     summary: Get all users in administration
 *     tags:
 *      - User
 *     responses:
 *       200:
 *         description: Get all users in administration
 */
router.get("/", getAllUser);

/**
 * @swagger
 * /user/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags:
 *      - User
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the user to fetch
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Get a single user by ID
 *       404:
 *         description: User not found
 */
router.get("/:id", getUserById);

/**
 * @swagger
 * /user/:
 *   post:
 *     summary: Create a new
 *     tags:
 *      - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password_hash:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", validateDto(createUserSchema), createUser);

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update user information by
 *     tags:
 *      - User
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the user to update
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password_hash:
 *                 type: string
 *               role_id:
 *                 type: integer
 *               last_login:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 */
router.put("/:id", validateDto(updateUserSchema), updateUser);

/**
 * @swagger
 * /user/{id}:
 *   delete:
 *     summary: Delete user by ID
 *     tags:
 *      - User
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the user to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete("/:id", deleteUser);

module.exports = router;
