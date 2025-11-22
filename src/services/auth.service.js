const prisma = require("../database/database");
const bcrypt = require("bcrypt");
const { OAuth2Client } = require("google-auth-library");
const fetch = require("node-fetch");
const { generateToken } = require("../utils/jwt.client");
const customerOnboardingService = require("./customerOnboarding.service");

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID;
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET;
const FACEBOOK_API_VERSION = process.env.FACEBOOK_API_VERSION || "v18.0";
const FACEBOOK_GRAPH_URL = `https://graph.facebook.com/${FACEBOOK_API_VERSION}`;

class AuthService {
  sanitizeCustomer(customer) {
    if (!customer) {
      return null;
    }

    const hasPassword = Boolean(customer.password_hash);
    const { password_hash, ...safeCustomer } = customer;
    return {
      ...safeCustomer,
      email: safeCustomer.email?.toLowerCase(),
      accounts: safeCustomer.accounts || [],
      hasPassword,
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

      if (!customer.password_hash) {
        const err = new Error(
          "Ce compte est associé à une connexion externe. Veuillez vous connecter avec Google/Facebook ou créer un mot de passe."
        );
        err.code = "PASSWORD_NOT_SET";
        throw err;
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

      let newCustomerCreated = false;
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
        newCustomerCreated = true;
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

      if (newCustomerCreated) {
        await customerOnboardingService.sendWelcomeEmail(customer);
      }

      const sanitizedCustomer = this.sanitizeCustomer(customer);
      const token = generateToken(sanitizedCustomer);

      const requiresPassword = !sanitizedCustomer.hasPassword;

      return {
        token,
        customer: sanitizedCustomer,
        requiresPassword,
      };
    } catch (error) {
      throw new Error(error.message || "Google authentication failed");
    }
  }

  async authenticateFacebookCustomer(accessToken) {
    if (!FACEBOOK_APP_ID || !FACEBOOK_APP_SECRET) {
      throw new Error(
        "Facebook authentication is not configured on the server."
      );
    }

    if (!accessToken) {
      throw new Error("Access token is required");
    }

    const appAccessToken = `${FACEBOOK_APP_ID}|${FACEBOOK_APP_SECRET}`;

    const debugResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/debug_token?input_token=${accessToken}&access_token=${appAccessToken}`
    );
    const debugData = await debugResponse.json();

    if (
      !debugData?.data?.is_valid ||
      debugData?.data?.app_id !== FACEBOOK_APP_ID
    ) {
      throw new Error("Facebook token invalide");
    }

    const profileResponse = await fetch(
      `${FACEBOOK_GRAPH_URL}/me?fields=id,email,first_name,last_name&access_token=${accessToken}`
    );
    const profile = await profileResponse.json();

    if (!profile?.id) {
      throw new Error(
        profile?.error?.message ||
          "Impossible de récupérer le profil Facebook."
      );
    }

    const facebookId = profile.id;
    const normalizedEmail = profile.email
      ? profile.email.toLowerCase()
      : null;

    let customer = null;

    if (normalizedEmail) {
      customer = await prisma.customer.findUnique({
        where: { email: normalizedEmail },
        include: { accounts: true },
      });
    }

    if (!customer) {
      customer = await prisma.customer.findFirst({
        where: { oauth_provider: "facebook", oauth_id: facebookId },
        include: { accounts: true },
      });
    }

    let newCustomerCreated = false;

    if (!customer) {
      const fallbackEmail = `fb_${facebookId}@facebook.local`;
      const emailToPersist = normalizedEmail || fallbackEmail;

      const createdCustomer = await prisma.$transaction(async (trx) => {
        const newCustomer = await trx.customer.create({
          data: {
            email: emailToPersist,
            first_name: profile.first_name || "Client",
            last_name: profile.last_name || "",
            oauth_provider: "facebook",
            oauth_id: facebookId,
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
      newCustomerCreated = true;
    } else {
      const updates = {};

      if (!customer.oauth_provider || customer.oauth_provider !== "facebook") {
        updates.oauth_provider = "facebook";
      }

      if (!customer.oauth_id) {
        updates.oauth_id = facebookId;
      }

      if (!customer.email && normalizedEmail) {
        updates.email = normalizedEmail;
      }

      if (!customer.first_name && profile.first_name) {
        updates.first_name = profile.first_name;
      }

      if (!customer.last_name && profile.last_name) {
        updates.last_name = profile.last_name;
      }

      if (Object.keys(updates).length > 0) {
        customer = await prisma.customer.update({
          where: { customer_id: customer.customer_id },
          data: updates,
          include: { accounts: true },
        });
      }
    }

    if (newCustomerCreated) {
      await customerOnboardingService.sendWelcomeEmail(customer);
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
