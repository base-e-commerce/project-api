const { verifyToken } = require("../utils/jwt.client");

const customerAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token is missing" });
  }

  const customer = verifyToken(token);

  if (!customer) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  req.customer = customer;
  next();
};

module.exports = customerAuth;
