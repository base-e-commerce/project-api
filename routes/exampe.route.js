const express = require("express");
const { examplefunction } = require("../controller/example/example.controller");

const router = express.Router();

/**
 * @swagger
 * /example/:
 *   get:
 *     summary: Renvoie example
 *     responses:
 *       200:
 *         description: example
 */
router.get("/", examplefunction);

module.exports = router;
