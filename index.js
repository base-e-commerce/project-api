const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const swaggerJsdoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
const dotenv = require("dotenv");
const path = require("path")
const { Sequelize } = require("sequelize");
const app = require("./app");
const swaggerOptions = require("./config/swagger");

dotenv.config();

const server = express();

server.use(bodyParser.json());
server.use(cors());
server.use('/',express.static(path.join(__dirname,'uploads','images')))

const swaggerDocs = swaggerJsdoc(swaggerOptions);
server.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

server.use("/api", app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
