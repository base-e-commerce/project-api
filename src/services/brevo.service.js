const SibApiV3Sdk = require("sib-api-v3-sdk");

class BrevoService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.sender = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME || "Sha Project",
    };
    this.defaultListIds = this.parseListIds(
      process.env.BREVO_CONTACT_LIST_IDS
    );
    this.welcomeTemplateId = this.parseTemplateId(
      process.env.BREVO_WELCOME_TEMPLATE_ID
    );

    if (!this.apiKey) {
      console.warn(
        "[BrevoService] BREVO_API_KEY is not configured. Email features are disabled."
      );
      return;
    }

    const apiClient = SibApiV3Sdk.ApiClient.instance;
    apiClient.authentications["api-key"].apiKey = this.apiKey;

    this.transactionalApi = new SibApiV3Sdk.TransactionalEmailsApi();
    this.contactsApi = new SibApiV3Sdk.ContactsApi();
  }

  parseTemplateId(value) {
    if (!value && value !== 0) {
      return undefined;
    }
    const templateId = Number(value);
    return Number.isNaN(templateId) ? undefined : templateId;
  }

  parseListIds(value) {
    if (!value) {
      return [];
    }

    return value
      .split(",")
      .map((id) => Number(id.trim()))
      .filter((id) => !Number.isNaN(id));
  }

  ensureTransactionalClient() {
    if (!this.transactionalApi) {
      throw new Error("Brevo transactional client is not initialized.");
    }
  }

  ensureContactsClient() {
    if (!this.contactsApi) {
      throw new Error("Brevo contacts client is not initialized.");
    }
  }

  formatRecipients(to) {
    const recipients = Array.isArray(to) ? to : [to];
    return recipients
      .map((recipient) => {
        if (typeof recipient === "string") {
          return { email: recipient };
        }
        return {
          email: recipient.email,
          name: recipient.name,
        };
      })
      .filter((recipient) => recipient.email);
  }

  async sendTransactionalEmail({ to, templateId, params = {}, sender }) {
    this.ensureTransactionalClient();

    const formattedRecipients = this.formatRecipients(to);

    if (!formattedRecipients.length) {
      throw new Error("At least one recipient email is required.");
    }

    const numericTemplateId = this.parseTemplateId(templateId);

    if (!numericTemplateId) {
      throw new Error("A valid templateId is required to send the email.");
    }

    const payload = {
      to: formattedRecipients,
      templateId: numericTemplateId,
      params,
      sender: sender || this.sender,
    };

    if (!payload.sender?.email) {
      throw new Error("A sender email is required to send the email.");
    }

    return this.transactionalApi.sendTransacEmail(payload);
  }

  async sendWelcomeEmail({
    email,
    username,
    params = {},
    templateId = this.welcomeTemplateId,
  }) {
    if (!email) {
      throw new Error("Email is required to send a welcome email.");
    }

    const mergedParams = {
      USERNAME: username,
      ...params,
    };

    return this.sendTransactionalEmail({
      to: [{ email, name: username }],
      templateId,
      params: mergedParams,
    });
  }

  async importContact({
    email,
    firstName,
    lastName,
    attributes = {},
    listIds,
  }) {
    this.ensureContactsClient();

    if (!email) {
      throw new Error("Email is required to import a contact.");
    }

    const resolvedListIds =
      Array.isArray(listIds) && listIds.length
        ? listIds
        : this.defaultListIds;

    const resolvedAttributes = {
      ...attributes,
      EMAIL: email,
    };

    if (firstName) {
      resolvedAttributes.PRENOM = firstName;
    }

    if (lastName) {
      resolvedAttributes.NOM = lastName;
    }

    const payload = {
      email,
      attributes: resolvedAttributes,
      updateEnabled: true,
    };

    if (resolvedListIds.length) {
      payload.listIds = resolvedListIds;
    }

    return this.contactsApi.createContact(payload);
  }
}

module.exports = new BrevoService();
