const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = require("./app");
const swaggerOptions = require("./config/swagger");
const corsOptions = require("./config/cors");
const stripeController = require("./src/controller/stripe.controller");

const server = express();
const bodySizeLimit = process.env.REQUEST_BODY_LIMIT || "200mb";

server.post(
  "/api/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeController.webhookHandler
);

server.use(bodyParser.json({ limit: bodySizeLimit }));
server.use(bodyParser.urlencoded({ extended: true, limit: bodySizeLimit }));
// server.use(cors(corsOptions));
server.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
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

const swaggerDocs = swaggerJsdoc(swaggerOptions);
server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

server.use("/api", app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
