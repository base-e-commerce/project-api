const express = require("express");
const upload = require("../middleware/upload.middleware");
const mediaUpload = require("../middleware/media-upload.middleware");
const boxUpload = require("../middleware/box-upload.middleware");
const machineUpload = require("../middleware/machine-upload.middleware");
const createUploader = require ("../middleware/upload.test.middleware")
const {
  createUploadImage,
  uploadMediaAsset,
  listMediaAssets,
  deleteMediaAsset,
  uploadBoxAssets,
  uploadMachineAssets,
} = require("../controller/image.controller");
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
/**
 * @swagger
 * /upload/media:
 *   post:
 *     summary: Upload a standalone media asset (image or video)
 *     tags:
 *       - Image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               media:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 *       400:
 *         description: Bad request, invalid input
 *       500:
 *         description: Internal server error
 */
router.post("/media", mediaUpload.single("media"), uploadMediaAsset);
router.get("/media", listMediaAssets);
router.post("/box", boxUpload.array("box_images", 10), uploadBoxAssets);
router.post("/machine", machineUpload.array("machine_images", 10), uploadMachineAssets);
/**
 * @swagger
 * /upload/media:
 *   delete:
 *     summary: Delete a media asset
 *     tags:
 *       - Image
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - folder
 *               - filename
 *             properties:
 *               folder:
 *                 type: string
 *                 enum: [image, video]
 *               filename:
 *                 type: string
 *     responses:
 *       200:
 *         description: Media deleted
 *       400:
 *         description: Invalid request
 *       500:
 *         description: Internal server error
 */
router.delete("/media", deleteMediaAsset);

// exemple utilisation middleware avec personnalisation du dossier d'upload de l'image 
// dossier source : uploads (deja definie dans le code)
// sous-dossier : users
//Creation automatique du dossier "users au niveau de /uploads"
const uploadToUserFolder = createUploader("users");
router.post("/image-test",uploadToUserFolder.array("image_url",5),createUploadImage)


module.exports = router;
