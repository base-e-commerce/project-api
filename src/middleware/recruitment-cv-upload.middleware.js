const multer = require("multer");
const path = require("path");
const fs = require("fs");

const defaultUploadDir = process.env.RECRUITMENT_CV_STORAGE || path.join("uploads", "recru");
const maxSizeMb = Number(process.env.RECRUITMENT_CV_MAX_SIZE_MB) || 15;
const allowedMimeTypesRaw =
  process.env.RECRUITMENT_CV_ALLOWED_TYPES ||
  "application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const allowedMimeTypes = allowedMimeTypesRaw
  .split(",")
  .map((type) => type.trim())
  .filter((type) => !!type);

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      ensureDirectory(defaultUploadDir);
      cb(null, defaultUploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e5);
    const sanitizedBase = path
      .basename(file.originalname, path.extname(file.originalname))
      .replace(/[^\w.-]/g, "-")
      .slice(0, 60);
    const extension = path.extname(file.originalname) || "";
    const safeBase = sanitizedBase || "cv";
    cb(null, `${safeBase}-${timestamp}-${randomSuffix}${extension}`.toLowerCase());
  },
});

const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new multer.MulterError("LIMIT_UNEXPECTED_FILE", "cv");
    error.message =
      "Format de fichier non pris en charge. Merci d'envoyer un PDF ou document Word.";
    cb(error);
  }
};

const limits = {
  fileSize: maxSizeMb * 1024 * 1024,
};

const recruitmentCvUpload = multer({
  storage,
  fileFilter,
  limits,
});

module.exports = recruitmentCvUpload;
