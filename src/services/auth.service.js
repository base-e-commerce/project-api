const prisma = require("../database/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET_CLIENT || "miaouuuuuu";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION_CLIENT || "1h";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

class AuthService {
  async authenticateCustomer(email, password) {
    try {
      const customer = await prisma.customer.findFirst({
        where: {
          OR: [{ email: email }, { phone: email }],
        },
        include: {
          accounts: true,
        },
      });

      if (!customer) {
        throw new Error("Invalid email or password");
      }

      if (
        customer.password_hash === null &&
        customer.oauth_provider === "google"
      ) {
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
            phone: customer.phone,
            accounts: customer.accounts,
          },
        };
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        customer.password_hash
      );

      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

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
          phone: customer.phone,
          accounts: customer.accounts,
        },
      };
    } catch (error) {
      throw new Error(`Authentication failed: ${error.message}`);
    }
  }

  async authenticateGmailCustomer(id_token) {
    const ticket = await googleClient.verifyIdToken({
      idToken: id_token,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub } = payload;

    let customer = await prisma.customer.findUnique({
      where: { email },
      include: {
        accounts: true,
      },
    });

    if (!customer) {
      const result = await prisma.$transaction(async (prisma) => {
        const newCustomer = await prisma.customer.create({
          data: {
            email,
            first_name: given_name,
            last_name: family_name,
            oauth_provider: "google",
            oauth_id: sub,
          },
        });

        const newAccount = await prisma.customerAccount.create({
          data: {
            customer_id: newCustomer.customer_id,
            type: "standard"
          },
        });

        return newCustomer;
      });

      customer = result;
    }

    const token = jwt.sign({ customer_id: customer.customer_id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });

    return { token, customer };
  }
}

module.exports = new AuthService();
