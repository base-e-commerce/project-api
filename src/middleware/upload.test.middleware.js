const multer = require("multer");
const path = require("path");
const fs = require("fs");

/**
 * Crée un middleware multer avec un sous-dossier configurable dynamiquement
 * @param {string} subDir - Le sous-dossier pour organiser les fichiers
 * @returns {object} - Middleware multer configuré
 */
const createUploader = (subDir) => {
  const basePath = "uploads-test";

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const targetDir = path.join(basePath, subDir);

      try {
        if (!fs.existsSync(basePath)) {
          fs.mkdirSync(basePath, { recursive: true });
        }

        if (!fs.existsSync(targetDir)) {
          fs.mkdirSync(targetDir, { recursive: true });
        }

        const isImage = ["image/png", "image/jpeg", "image/jpg"].includes(
          file.mimetype
        );
        if (!isImage) {
          return cb(new Error("Unsupported file type"), false);
        }

        cb(null, targetDir);
      } catch (err) {
        cb(err);
      }
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });

  const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "video/mp4"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unauthorized file type"));
    }
  };

  return multer({ storage, fileFilter });
};

module.exports = createUploader;
