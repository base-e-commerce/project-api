const express = require("express");
const upload = require("../middleware/upload.middleware");
const createUploader = require ("../middleware/upload.test.middleware")
const { createUploadImage } = require("../controller/image.controller");
const router = express.Router();



/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload images
 *     tags:
 *       - Image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               product_id:
 *                 type: number
 *                 description: The ID of the product associated with the images
 *                 example: 123
 *               image_url:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of images to upload
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Bad request, invalid input
 *       500:
 *         description: Internal server error
 */
router.post("/image", upload.array("image_url", 5), createUploadImage);

// exemple utilisation middleware avec personnalisation du dossier d'upload de l'image 
// dossier source : uploads (deja definie dans le code)
// sous-dossier : users
//Creation automatique du dossier "users au niveau de /uploads"
const uploadToUserFolder = createUploader("users");
router.post("/image-test",uploadToUserFolder.array("image_url",5),createUploadImage)


module.exports = router;
