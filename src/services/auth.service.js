const prisma = require("../database/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET_CLIENT || "miaouuuuuu";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION_CLIENT || "1h";

class AuthService {
  async authenticateCustomer(email, password) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { email },
      });

      if (!customer) {
        throw new Error("Invalid email or password");
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        customer.password_hash
      );

      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      console.log(customer);
      console.log(JWT_SECRET);
      console.log(JWT_EXPIRATION);

      const token = jwt.sign(
        { customer_id: customer.customer_id },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRATION,
        }
      );

      return {
        token,
        customer: {
          customer_id: customer.customer_id,
          first_name: customer.first_name,
          last_name: customer.last_name,
          email: customer.email,
        },
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }
}

module.exports = new AuthService();
