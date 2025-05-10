const express = require("express");
const {
  getAllContactInfo,
  createContactInfo,
  createNewsLetter,
  getGlobalStat,
  getAllNewLetter,
  patchContactInfo,
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
 * /stat/:
 *   get:
 *     summary: Get all stat for administration
 *     tags:
 *       - Common
 *     responses:
 *       200:
 *         description: Get all stat for administration
 */
router.get("/stat", getGlobalStat);

/**
 * @swagger
 * /common/contact-info:
 *   get:
 *     summary: Get all contact info in administration
 *     tags:
 *       - Common
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of list to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: The number of list to skip
 *     responses:
 *       200:
 *         description: Get all contact info in administration
 */
router.get("/contact-info", getAllContactInfo);

/**
 * @swagger
 * /common/contact-info/{id}:
 *   patch:
 *     summary: Partially update a contact info
 *     tags:
 *       - Common
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the contact info to update
 *     requestBody:
 *       required: true
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
 *               seen:
 *                 type: boolean
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Contact info updated successfully
 *       400:
 *         description: No fields provided to update
 *       500:
 *         description: Internal server error
 */
router.patch("/contact-info/:id", authenticateToken, authenticateAdmin, patchContactInfo);


/**
 * @swagger
 * /common/new-letter:
 *   get:
 *     summary: Get all new letter in administration
 *     tags:
 *       - Common
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The number of list to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: The number of list to skip
 *     responses:
 *       200:
 *         description: Get all new letter in administration
 */
router.get("/new-letter", getAllNewLetter);

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
