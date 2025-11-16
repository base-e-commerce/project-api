const express = require("express");
const upload = require("../middleware/upload.middleware");
const createUploader = require ("../middleware/upload.test.middleware")
const { createUploadImage } = require("../controller/image.controller");
const router = express.Router();



/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload images for a product or a blog
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
 *                 description: The ID of the product associated with the images (required when uploading for a product)
 *                 example: 123
 *               blog_id:
 *                 type: number
 *                 description: The ID of the blog that should receive the uploaded image (required when uploading for a blog)
 *                 example: 42
 *               image_url:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Array of images to upload. Only the first file is used when uploading for a blog.
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
