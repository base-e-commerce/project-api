const prisma = require("../database/database");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const { generateToken } = require("../utils/jwt.client");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

class AuthService {
  sanitizeCustomer(customer) {
    if (!customer) {
      return null;
    }

    const { password_hash, ...safeCustomer } = customer;
    return {
      ...safeCustomer,
      email: safeCustomer.email?.toLowerCase(),
      accounts: safeCustomer.accounts || [],
    };
  }

  buildCustomerFilters(identifier) {
    const trimmedIdentifier = (identifier || "").trim();
    const normalizedEmail = trimmedIdentifier.toLowerCase();
    const filters = [];

    if (normalizedEmail) {
      filters.push({ email: normalizedEmail });
    }

    if (trimmedIdentifier && normalizedEmail !== trimmedIdentifier) {
      filters.push({ email: trimmedIdentifier });
    }

    if (trimmedIdentifier) {
      filters.push({ phone: trimmedIdentifier });
    }

    if (filters.length === 0) {
      throw new Error("Email or phone number is required");
    }

    return filters;
  }

  async authenticateCustomer(email, password) {
    try {
      const filters = this.buildCustomerFilters(email);
      const customer = await prisma.customer.findFirst({
        where: { OR: filters },
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
        const sanitizedCustomer = this.sanitizeCustomer(customer);
        const token = generateToken(sanitizedCustomer);

        return {
          token,
          customer: sanitizedCustomer,
        };
      }

      if (!customer.password_hash) {
        throw new Error("Invalid email or password");
      }

      if (!password) {
        throw new Error("Password is required");
      }

      const isPasswordValid = await bcrypt.compare(
        password,
        customer.password_hash
      );

      if (!isPasswordValid) {
        throw new Error("Invalid email or password");
      }

      const sanitizedCustomer = this.sanitizeCustomer(customer);
      const token = generateToken(sanitizedCustomer);

      return {
        token,
        customer: sanitizedCustomer,
      };
    } catch (error) {
      throw new Error(error.message || "Authentication failed");
    }
  }

  async authenticateGmailCustomer(id_token) {
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: id_token,
        audience: GOOGLE_CLIENT_ID,
      });

      const payload = ticket.getPayload();
      const {
        email,
        email_verified,
        given_name,
        family_name,
        name,
        sub,
      } = payload;

      if (!email) {
        throw new Error("Email Google introuvable");
      }

      if (email_verified === false) {
        throw new Error("Email Google non vérifié");
      }

      const normalizedEmail = email.toLowerCase();
      const fallbackName = name || "";
      const [fallbackFirstName = "", ...fallbackLastParts] =
        fallbackName.split(" ");
      const fallbackLastName = fallbackLastParts.join(" ").trim();

      const firstNameToPersist = given_name || fallbackFirstName || "Client";
      const lastNameToPersist =
        family_name || fallbackLastName || normalizedEmail.split("@")[0];

      let customer = await prisma.customer.findUnique({
        where: { email: normalizedEmail },
        include: {
          accounts: true,
        },
      });

      if (!customer) {
        const createdCustomer = await prisma.$transaction(async (trx) => {
          const newCustomer = await trx.customer.create({
            data: {
              email: normalizedEmail,
              first_name: firstNameToPersist,
              last_name: lastNameToPersist,
              oauth_provider: "google",
              oauth_id: sub,
            },
          });

          await trx.customerAccount.create({
            data: {
              customer_id: newCustomer.customer_id,
              type: "standard",
            },
          });

          return newCustomer;
        });

        customer = await prisma.customer.findUnique({
          where: { customer_id: createdCustomer.customer_id },
          include: { accounts: true },
        });
      } else {
        const updates = {};

        if (customer.email !== normalizedEmail) {
          updates.email = normalizedEmail;
        }

        if (!customer.oauth_provider || customer.oauth_provider !== "google") {
          updates.oauth_provider = "google";
        }

        if (!customer.oauth_id) {
          updates.oauth_id = sub;
        }

        if (!customer.first_name && firstNameToPersist) {
          updates.first_name = firstNameToPersist;
        }

        if (!customer.last_name && lastNameToPersist) {
          updates.last_name = lastNameToPersist;
        }

        if (Object.keys(updates).length > 0) {
          customer = await prisma.customer.update({
            where: { customer_id: customer.customer_id },
            data: updates,
            include: { accounts: true },
          });
        }
      }

      if (!customer.accounts || customer.accounts.length === 0) {
        await prisma.customerAccount.create({
          data: {
            customer_id: customer.customer_id,
            type: "standard",
          },
        });

        customer = await prisma.customer.findUnique({
          where: { customer_id: customer.customer_id },
          include: { accounts: true },
        });
      }

      const sanitizedCustomer = this.sanitizeCustomer(customer);
      const token = generateToken(sanitizedCustomer);

      return { token, customer: sanitizedCustomer };
    } catch (error) {
      throw new Error(error.message || "Google authentication failed");
    }
  }
}

module.exports = new AuthService();
