const dotenv = require("dotenv");
dotenv.config();

const allowedOrigins = [
  "http://46.62.146.89:4000",
  "http://46.62.146.89:4001",
  "https://grainedevaleur.com",
  "https://dev.grainedevaleur.com",
  "https://preprod.grainedevaleur.com",
  "https://dev.admin.grainedevaleur.com",
  "https://admin.grainedevaleur.com",
  /^https:\/\/.*\.grainedevaleur\.com$/,
  "http://localhost:4200",
  "http://localhost:4300",
  "http://localhost:3000",
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true); 

    const isAllowed = allowedOrigins.some((allowed) => {
      if (allowed instanceof RegExp) {
        return allowed.test(origin);
      }
      return allowed === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  allowedHeaders: "Content-Type,Authorization",
};

module.exports = corsOptions;