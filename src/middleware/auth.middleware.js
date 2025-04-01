const { verifyToken } = require("../utils/jwt");
const createResponse = require("../utils/api.response");

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json(createResponse("Access token is missing", []));
  }

  const user = verifyToken(token);

  if (!user) {
    return res.status(403).json(createResponse("Invalid or expired token", []));
  }

  req.user = user;
  next();
};

module.exports = authenticateToken;
