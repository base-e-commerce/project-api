const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const dotenv = require("dotenv");
const path = require("path");
const multer = require("multer");

dotenv.config();

const app = require("./app");
const swaggerOptions = require("./config/swagger");
const stripeController = require("./src/controller/stripe.controller");
const createResponse = require("./src/utils/api.response");
const requestLoader = require("./src/middleware/request.loader.middleware");

const server = express();
const bodySizeLimit = process.env.REQUEST_BODY_LIMIT || "200mb";
const corsMiddleware = cors();
const resolveStoragePath = (storagePath) =>
  path.isAbsolute(storagePath) ? storagePath : path.join(__dirname, storagePath);

const parsePositiveInteger = (value) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const getMediaMaxFileSizeLabel = () => {
  const configuredLimit = parsePositiveInteger(process.env.MEDIA_MAX_FILE_SIZE_MB);
  const limitMb = configuredLimit || 200;
  return `${limitMb}MB`;
};

server.use(corsMiddleware);
server.options("*", corsMiddleware);

server.use(requestLoader);

server.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeController.webhookHandler
);

server.use(bodyParser.json({ limit: bodySizeLimit }));
server.use(bodyParser.urlencoded({ extended: true, limit: bodySizeLimit }));
server.use("/api", express.static(path.join(__dirname, "uploads", "images")));
server.use("/api/video", express.static(path.join(__dirname, "uploads", "video")));
server.use(
  "/api/media/image",
  express.static(path.join(__dirname, "uploads", "media", "image"))
);
server.use(
  "/api/media/video",
  express.static(path.join(__dirname, "uploads", "media", "video"))
);
server.use(
  "/support-attachments",
  express.static(path.join(__dirname, "uploads", "support"))
);
server.use(
  "/api/box-assets",
  express.static(path.join(__dirname, "uploads", "box"))
);
server.use(
  "/api/machine-assets",
  express.static(path.join(__dirname, "uploads", "machines"))
);
server.use(
  "/api/demande-machine-assets",
  express.static(path.join(__dirname, "uploads", "demande-machines"))
);
const recruitmentCvStorage = process.env.RECRUITMENT_CV_STORAGE || path.join("uploads", "recru");
server.use("/api/recruitment/cv", express.static(resolveStoragePath(recruitmentCvStorage)));

const swaggerDocs = swaggerJsdoc(swaggerOptions);
server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

server.use("/api", app);

server.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json(
        createResponse(
          `File too large. Maximum allowed size is ${getMediaMaxFileSizeLabel()}.`,
          null,
          false
        )
      );
    }
    return res
      .status(400)
      .json(createResponse(err.message, null, false));
  }

  if (
    err?.message === "Unsupported file type" ||
    err?.message === "Unauthorized file type"
  ) {
    return res
      .status(400)
      .json(createResponse(err.message, null, false));
  }

  return res
    .status(500)
    .json(createResponse("Internal server error", err?.message, false));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
