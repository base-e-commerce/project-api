const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ensureDirExists = (targetPath) => {
  fs.mkdirSync(targetPath, { recursive: true });
};

const ONE_MB = 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE_MB = 200;

const parsePositiveNumber = (value) => {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const resolveFileSizeLimit = () => {
  const fromEnv = parsePositiveNumber(process.env.MEDIA_MAX_FILE_SIZE_MB);
  return (fromEnv || DEFAULT_MAX_FILE_SIZE_MB) * ONE_MB;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let destination;
    if (file.mimetype.startsWith("image/")) {
      destination = path.join("uploads", "media", "image");
    } else if (file.mimetype.startsWith("video/")) {
      destination = path.join("uploads", "media", "video");
    } else {
      cb(new Error("Unsupported file type"), false);
      return;
    }
    ensureDirExists(destination);
    cb(null, destination);
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

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: resolveFileSizeLimit(),
  },
});
module.exports = upload;
