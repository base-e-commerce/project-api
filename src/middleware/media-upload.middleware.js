const multer = require("multer");
const path = require("path");
const fs = require("fs");

const ensureDirExists = (targetPath) => {
  fs.mkdirSync(targetPath, { recursive: true });
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

const upload = multer({ storage, fileFilter });
module.exports = upload;
