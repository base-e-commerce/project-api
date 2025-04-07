const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createServiceSchema,
  updateServiceSchema,
} = require("../dtos/service.dto");
const {
  getAllServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} = require("../controller/service.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     ServiceIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the service
 *       schema:
 *         type: integer
 *   requestBodies:
 *     ServiceRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 */

/**
 * @swagger
 * /service/:
 *   get:
 *     summary: Get all services
 *     tags:
 *       - Service
 *     responses:
 *       200:
 *         description: Get all services
 */
router.get("/", getAllServices);

/**
 * @swagger
 * /service/{id}:
 *   get:
 *     summary: Get service by ID
 *     tags:
 *       - Service
 *     parameters:
 *       - $ref: '#/components/parameters/ServiceIdParam'
 *     responses:
 *       200:
 *         description: Get a single service by ID
 *       404:
 *         description: Service not found
 */
router.get("/:id", getServiceById);

/**
 * @swagger
 * /service/:
 *   post:
 *     summary: Create a new service
 *     tags:
 *       - Service
 *     requestBody:
 *       $ref: '#/components/requestBodies/ServiceRequestBody'
 *     responses:
 *       201:
 *         description: Service created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", validateDto(createServiceSchema), createService);

/**
 * @swagger
 * /service/{id}:
 *   put:
 *     summary: Update service information by ID
 *     tags:
 *       - Service
 *     parameters:
 *       - $ref: '#/components/parameters/ServiceIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/ServiceRequestBody'
 *     responses:
 *       200:
 *         description: Service updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Service not found
 */
router.put("/:id", validateDto(updateServiceSchema), updateService);

/**
 * @swagger
 * /service/{id}:
 *   delete:
 *     summary: Delete service by ID
 *     tags:
 *       - Service
 *     parameters:
 *       - $ref: '#/components/parameters/ServiceIdParam'
 *     responses:
 *       200:
 *         description: Service deleted successfully
 *       404:
 *         description: Service not found
 */
router.delete("/:id", deleteService);

module.exports = router;
