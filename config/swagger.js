const dotenv = require("dotenv");
dotenv.config();

const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "Sha API",
      version: "1.0.0",
      description: "API documentation with Swagger",
    },
    servers: [
      {
        url: process.env.BASE_URL || "http://localhost:3000/api",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"],
};

module.exports = swaggerOptions;
