const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET;

function generateToken(user) {
  const payload = {
    userId: user.user_id,
    email: user.email,
    role: user.role,
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRATION || "1h",
  };

  return jwt.sign(payload, secretKey, options);
}

function verifyToken(token) {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    return null;
  }
}

module.exports = { generateToken, verifyToken };
