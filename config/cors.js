const dotenv = require("dotenv");
dotenv.config();

const corsOptions = {
    origin: process.env.BASE_URL_UI || "http://localhost:4200",
  methods: "*",
  allowedHeaders: "Content-Type,Authorization",
};

module.exports = corsOptions;
