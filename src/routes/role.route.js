const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const { createRoleSchema, updateRoleSchema } = require("../dtos/role.dto");
const {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
} = require("../controller/role.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     RoleIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the role
 *       schema:
 *         type: integer
 *   requestBodies:
 *     RoleRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 */

/**
 * @swagger
 * /role/:
 *   get:
 *     summary: Get all roles in administration
 *     tags:
 *       - Role
 *     responses:
 *       200:
 *         description: Get all roles in administration
 */
router.get("/", getAllRoles);

/**
 * @swagger
 * /role/{id}:
 *   get:
 *     summary: Get role by ID
 *     tags:
 *       - Role
 *     parameters:
 *       - $ref: '#/components/parameters/RoleIdParam'
 *     responses:
 *       200:
 *         description: Get a single role by ID
 *       404:
 *         description: Role not found
 */
router.get("/:id", getRoleById);

/**
 * @swagger
 * /role/:
 *   post:
 *     summary: Create a new role
 *     tags:
 *       - Role
 *     requestBody:
 *       $ref: '#/components/requestBodies/RoleRequestBody'
 *     responses:
 *       201:
 *         description: Role created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", validateDto(createRoleSchema), createRole);

/**
 * @swagger
 * /role/{id}:
 *   put:
 *     summary: Update role information by ID
 *     tags:
 *       - Role
 *     parameters:
 *       - $ref: '#/components/parameters/RoleIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/RoleRequestBody'
 *     responses:
 *       200:
 *         description: Role updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Role not found
 */
router.put("/:id", validateDto(updateRoleSchema), updateRole);

/**
 * @swagger
 * /role/{id}:
 *   delete:
 *     summary: Delete role by ID
 *     tags:
 *       - Role
 *     parameters:
 *       - $ref: '#/components/parameters/RoleIdParam'
 *     responses:
 *       200:
 *         description: Role deleted successfully
 *       404:
 *         description: Role not found
 */
router.delete("/:id", deleteRole);

module.exports = router;
