const { verifyToken } = require("../utils/jwt");

const adminAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token is missing" });
  }

  const user = verifyToken(token);

  if (!user) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }

  if (user.role.role_id !== 1) {
    return res
      .status(403)
      .json({ message: "Access forbidden: Admin role required" });
  }

  req.user = user;
  next();
};

module.exports = adminAuth;
