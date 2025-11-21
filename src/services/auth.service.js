const prisma = require("../database/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const customerAccountService = require("../services/customer.account.service");
const { OAuth2Client } = require("google-auth-library");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const JWT_SECRET = process.env.JWT_SECRET_CLIENT || "miaouuuuuu";
const JWT_EXPIRATION = process.env.JWT_EXPIRATION_CLIENT || "5m";
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

class AuthService {
  async authenticateCustomer(email, password) {
    try {
      let customer = await prisma.customer.findFirst({
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

      if (customer.deleted_at) {
        customer = await prisma.customer.update({
          where: { customer_id: customer.customer_id },
          data: {
            deleted_at: null,
            delete_scheduled_for: null,
            is_active: true,
          },
          include: { accounts: true },
        });
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
            deleted_at: customer.deleted_at,
            delete_scheduled_for: customer.delete_scheduled_for,
            hasPassword: Boolean(customer.password_hash),
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
          deleted_at: customer.deleted_at,
          delete_scheduled_for: customer.delete_scheduled_for,
          hasPassword: Boolean(customer.password_hash),
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

    if (customer.deleted_at) {
      customer = await prisma.customer.update({
        where: { customer_id: customer.customer_id },
        data: {
          deleted_at: null,
          delete_scheduled_for: null,
          is_active: true,
        },
        include: { accounts: true },
      });
    }

    const token = jwt.sign({ customer_id: customer.customer_id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRATION,
    });

    return {
      token,
      customer: {
        ...customer,
        hasPassword: Boolean(customer.password_hash),
      },
    };
  }
}

module.exports = new AuthService();
