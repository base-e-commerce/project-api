const createResponse = require("../utils/api.response");
const imageUploadService = require("../services/image-upload.service");

exports.createUploadImage = async (req, res) => {
  try {
    const productId = parseInt(req.body.product_id);
 

    if (!productId || !req.files || req.files.length === 0) {
      return res.status(400).json(createResponse("Missing required fields", null));
    }

    const uploads = await Promise.all(
      req.files.map(async (file) => {
        const data = {
          product_id: productId,
          image_url: `http://localhost:3000/${file.filename}`,
        };

        return await imageUploadService.uploadMultipleImage(data);
      })
    );

    res.status(200).json(createResponse("Upload(s) completed successfully", uploads));
  } catch (error) {
    res.status(500).json(
      createResponse("Error while performing upload", error.message)
    );
  }
};
