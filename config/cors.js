const dotenv = require("dotenv");
dotenv.config();

const corsOptions = {
  // origin: '*',
  origin: process.env.BASE_URL_UI || "https://grainedevaleur.com",
  methods: "*",
  allowedHeaders: "Content-Type,Authorization",
};

module.exports = corsOptions;
