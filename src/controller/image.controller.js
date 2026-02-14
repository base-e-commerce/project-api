const createResponse = require("../utils/api.response");
const imageUploadService = require("../services/image-upload.service");
const BlogService = require("../services/blog.service");
const dotenv = require("dotenv");
const fs = require("fs/promises");
const path = require("path");
dotenv.config();

const resolveMediaUrlBase = () => {
  const baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${baseUrl}/api/media`;
};

const resolveBoxAssetBase = () => {
  const baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${baseUrl}/api/box-assets`;
};

const resolveMachineAssetBase = () => {
  const baseUrl = process.env.BASE_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${baseUrl}/api/machine-assets`;
};

const getMediaFolderSegment = (file) =>
  file.mimetype.startsWith("video/") ? "video" : "image";

const buildMediaUrl = (file) => {
  const apiBaseUrl = resolveMediaUrlBase();
  const folder = getMediaFolderSegment(file);
  return `${apiBaseUrl}/${folder}/${file.filename}`;
};

const MEDIA_FOLDERS = ["image", "video"];
const getMediaDir = (folder) => path.join(process.cwd(), "uploads", "media", folder);

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

exports.uploadMediaAsset = async (req, res) => {
  try {
    const file = req.file;
    if (!file) {
      return res
        .status(400)
        .json(createResponse("At least one file is required", null, false));
    }

    const mediaUrl = buildMediaUrl(file);

    return res
      .status(200)
      .json(createResponse("Media uploaded successfully", { url: mediaUrl }));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Error while performing upload", error.message));
  }
};

exports.uploadBoxAssets = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res
        .status(400)
        .json(createResponse("At least one file is required", null, false));
    }
    const origin = resolveBoxAssetBase();
    const urls = req.files.map((file) => `${origin}/${file.filename}`);

    return res
      .status(200)
      .json(createResponse("Box images uploaded successfully", urls));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Error while performing upload", error.message));
  }
};

exports.uploadMachineAssets = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res
        .status(400)
        .json(createResponse("At least one file is required", null, false));
    }
    const origin = resolveMachineAssetBase();
    const urls = req.files.map((file) => `${origin}/${file.filename}`);

    return res
      .status(200)
      .json(createResponse("Machine images uploaded successfully", urls));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Error while performing upload", error.message));
  }
};

exports.listMediaAssets = async (req, res) => {
  try {
    const entries = await Promise.all(
      MEDIA_FOLDERS.map(async (folder) => {
        const dirPath = getMediaDir(folder);
        let files = [];
        try {
          files = await fs.readdir(dirPath);
        } catch (error) {
          if (error.code === "ENOENT") {
            return [];
          }
          throw error;
        }

        const mapped = await Promise.all(
          files.map(async (filename) => {
            const filePath = path.join(dirPath, filename);
            const stats = await fs.stat(filePath);
            return {
              filename,
              folder,
              size: stats.size,
              updated_at: stats.mtime.toISOString(),
              url: `${resolveMediaUrlBase()}/${folder}/${filename}`,
            };
          }),
        );
        return mapped;
      }),
    );
    const mediaItems = entries.flat();
    mediaItems.sort(
      (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
    );
    return res
      .status(200)
      .json(createResponse("Media assets retrieved", { items: mediaItems }));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Error while listing media assets", null, false));
  }
};

exports.deleteMediaAsset = async (req, res) => {
  try {
    const { folder, filename } = req.body ?? {};
    if (!folder || !filename) {
      return res
        .status(400)
        .json(createResponse("Folder and filename are required", null, false));
    }

    if (!MEDIA_FOLDERS.includes(folder)) {
      return res
        .status(400)
        .json(createResponse("Invalid folder", null, false));
    }

    const safeFilename = path.basename(filename);
    if (safeFilename !== filename) {
      return res
        .status(400)
        .json(createResponse("Invalid filename", null, false));
    }

    const targetPath = path.join(getMediaDir(folder), safeFilename);
    await fs.unlink(targetPath);

    return res
      .status(200)
      .json(createResponse("Media asset deleted", { filename, folder }));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Error while deleting media asset", null, false));
  }
};
