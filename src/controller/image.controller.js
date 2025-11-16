const createResponse = require("../utils/api.response");
const imageUploadService = require("../services/image-upload.service");
const BlogService = require("../services/blog.service");
const dotenv = require("dotenv");
dotenv.config();

exports.createUploadImage = async (req, res) => {
  try {
    const productId = req.body.product_id
      ? parseInt(req.body.product_id, 10)
      : null;
    const blogId = req.body.blog_id ? parseInt(req.body.blog_id, 10) : null;

    const hasProductTarget =
      typeof productId === "number" && !Number.isNaN(productId);
    const hasBlogTarget =
      typeof blogId === "number" && !Number.isNaN(blogId);

    if (!req.files || req.files.length === 0) {
      return res
        .status(400)
        .json(createResponse("At least one file is required", null));
    }

    if (!hasProductTarget && !hasBlogTarget) {
      return res
        .status(400)
        .json(
          createResponse(
            "Either product_id or blog_id must be provided",
            null
          )
        );
    }

    if (hasProductTarget && hasBlogTarget) {
      return res
        .status(400)
        .json(
          createResponse(
            "Please provide only product_id or blog_id, not both",
            null
          )
        );
    }

    if (hasProductTarget) {
      const uploads = await Promise.all(
        req.files.map(async (file) => {
          const data = {
            product_id: productId,
            image_url: `${process.env.BASE_URL}/api/${file.filename}`,
          };

          return await imageUploadService.uploadMultipleImage(data);
        })
      );

      return res
        .status(200)
        .json(
          createResponse("Product image upload completed successfully", uploads)
        );
    }

    const blog = await BlogService.getBlogById(blogId);
    if (!blog) {
      return res
        .status(404)
        .json(createResponse("Blog not found", null, false));
    }

    const file = req.files[0];
    const imageUrl = `${process.env.BASE_URL}/api/${file.filename}`;

    const updatedBlog = await BlogService.updateBlog(blogId, {
      image_url: imageUrl,
    });

    return res
      .status(200)
      .json(
        createResponse("Blog image updated successfully", {
          blog_id: updatedBlog.blog_id,
          image_url: updatedBlog.image_url,
        })
      );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Error while performing upload", error.message));
  }
};
