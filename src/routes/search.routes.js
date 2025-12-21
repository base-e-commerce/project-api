const express = require("express");
const { getSpotlightSearch } = require("../controller/search.controller");

const router = express.Router();

/**
 * @swagger
 * /search/spotlight:
 *   get:
 *     summary: Unified search endpoint returning products, categories and services suggestions
 *     tags:
 *       - Search
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search keyword
 *       - in: query
 *         name: products
 *         schema:
 *           type: integer
 *         description: Maximum number of products to return (default 6)
 *       - in: query
 *         name: categories
 *         schema:
 *           type: integer
 *         description: Maximum number of categories to return (default 6)
 *       - in: query
 *         name: services
 *         schema:
 *           type: integer
 *         description: Maximum number of services to return (default 6)
 *     responses:
 *       200:
 *         description: Spotlight payload with search results and suggestions
 */
router.get("/spotlight", getSpotlightSearch);

module.exports = router;
