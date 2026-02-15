const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ensureDirExists = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const ONE_MB = 1024 * 1024;
const DEFAULT_MAX_FILE_SIZE_MB = 25;

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
  const fromEnv = parsePositiveNumber(process.env.DEMANDE_MACHINE_MEDIA_MAX_FILE_SIZE_MB);
  return (fromEnv || DEFAULT_MAX_FILE_SIZE_MB) * ONE_MB;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join("uploads", "demande-machines");
    ensureDirExists(dir);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(
      null,
      `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
        file.originalname
      )}`
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype?.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Unsupported file type"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: resolveFileSizeLimit(),
    files: 10,
  },
});

module.exports = upload;
