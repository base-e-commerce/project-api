const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const { createUserSchema, updateUserSchema } = require("../dtos/user.dto");
const {
  getAllUser,
  getUserById,
  createUser,
  deleteUser,
  updateUser,
  login,
  getCurrentUser,
  updateCurrentUser,
  resetPassUser,
  checkPassUserCurrent,
} = require("../controller/user.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");

const router = express.Router();

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Authenticate a user and generate a JWT token
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 example: ratovonirina@gmail.com
 *               password:
 *                 type: string
 *                 example: 123456789Eric
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Internal server error
 */
router.post("/login", login);

/**
 * @swagger
 * /user/checkpass:
 *   post:
 *     summary: Check user pass information
 *     tags:
 *      - User
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *                 example: 123456789Eric
 *     responses:
 *       200:
 *         description: Password is valid
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 */
router.post("/checkpass", authenticateToken, checkPassUserCurrent);

/**
 * @swagger
 * /user/current:
 *   get:
 *     summary: Get the currently authenticated user's information
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user's information retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/current", getCurrentUser);

/**
 * @swagger
 * /user/current:
 *   put:
 *     summary: Update the currently authenticated user's information
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
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
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User information updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.put("/current", updateCurrentUser);

/**
 * @swagger
 * /user/:
 *   get:
 *     summary: Get all users in administration with pagination
 *     tags:
 *       - User
 *     parameters:
 *       - name: page
 *         in: query
 *         description: The page number to retrieve (default is 1)
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *       - name: limit
 *         in: query
 *         description: The number of users per page (default is 10)
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of users in the administration with pagination metadata
 *       500:
 *         description: Internal server error
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
 *               phone:
 *                 type: string
 *               password:
 *                 type: string
 *               role_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", createUser);
// router.post(
//   "/",
//   authenticateToken,
//   authenticateAdmin,
//   validateDto(createUserSchema),
//   createUser
// );

// router.post(
//   "/",
//   authenticateToken,
//   authenticateAdmin,
//   validateDto(createUserSchema),
//   createUser
// );

/**
 * @swagger
 * /user/{id}:
 *   put:
 *     summary: Update user pass information by
 *     tags:
 *      - User
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the user to update pass
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password_hash:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: User not found
 */
router.put(
  "/resetpass/:id",
  authenticateToken,
  authenticateAdmin,
  resetPassUser
);

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
