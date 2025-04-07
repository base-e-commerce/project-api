const multer = require("multer");
const path = require("path")

const storage = multer.diskStorage({
    destination: (req,file,cb) => {
      if (
        file.mimetype === "image/png" ||
        file.mimetype === "image/jpeg" ||
        file.mimetype === "image/jpg"
      ) {
        cb(null, "uploads/images");
      } else if (file.mimetype === "video/mp4") {
        cb(null, "uploads/video");
      } else {
        cb(new Error("Unsupported file type"), false);
      }
    },
    filename: (req,file,cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
  const fileFilter = (req,file,cb) => {
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "video/mp4"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Unauthorized file type"));
    }
  };
  const upload = multer({ storage: storage, fileFilter: fileFilter });
//   export const uploadMultiple = upload.array("files", 10);
  module.exports=upload;