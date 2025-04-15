const express = require("express");
const {
  getAllContactInfo,
  createContactInfo,
  createNewsLetter,
} = require("../controller/common.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     ContactInfoIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the contact info
 *       schema:
 *         type: integer
 *   requestBodies:
 *     ContactRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               subject:
 *                 type: string
 *               message:
 *                 type: string
 *     NewsLetterRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 */

/**
 * @swagger
 * /common/:
 *   get:
 *     summary: Get all contact info in administration
 *     tags:
 *       - Common
 *     responses:
 *       200:
 *         description: Get all contact info in administration
 */
router.get("/", getAllContactInfo);

/**
 * @swagger
 * /common/news-letter:
 *   post:
 *     summary: Abonnement client
 *     tags:
 *       - Common
 *     requestBody:
 *       $ref: '#/components/requestBodies/NewsLetterRequestBody'
 *     responses:
 *       201:
 *         description: News letter created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/news-letter", createNewsLetter);

/**
 * @swagger
 * /common/:
 *   post:
 *     summary: Create a new contact info
 *     tags:
 *       - Common
 *     requestBody:
 *       $ref: '#/components/requestBodies/ContactRequestBody'
 *     responses:
 *       201:
 *         description: Contact created successfully
 *       400:
 *         description: Invalid input data
 */
router.post("/", createContactInfo);

module.exports = router;
