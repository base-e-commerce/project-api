const jwt = require("jsonwebtoken");

const secretKey = process.env.JWT_SECRET_CLIENT | "miaouuuuuu";

const generateToken = (customer) => {
  const payload = {
    customer_id: customer.customer_id,
    first_name: customer.first_name,
    last_name: customer.last_name,
    email: customer.email,
  };

  const options = {
    expiresIn: process.env.JWT_EXPIRATION_CLIENT || "1h",
  };

  return jwt.sign(payload, secretKey, options);
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, secretKey);
  } catch (error) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
