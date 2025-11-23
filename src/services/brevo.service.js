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
    this.customerWelcomeTemplateId = this.parseTemplateId(
      process.env.BREVO_CUSTOMER_WELCOME_TEMPLATE_ID ||
        process.env.BREVO_WELCOME_TEMPLATE_ID
    );
    this.commandeCreatedTemplateId = this.parseTemplateId(
      process.env.BREVO_COMMANDE_CREATED_TEMPLATE_ID || 2
    );
    this.invoiceTemplateId = this.parseTemplateId(
      process.env.BREVO_INVOICE_TEMPLATE_ID
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

  async sendTransactionalEmail({
    to,
    templateId,
    params = {},
    sender,
    subject,
    htmlContent,
    attachment,
  }) {
    this.ensureTransactionalClient();

    const formattedRecipients = this.formatRecipients(to);

    if (!formattedRecipients.length) {
      throw new Error("At least one recipient email is required.");
    }

    const numericTemplateId = this.parseTemplateId(templateId);
    const hasHtmlContent = typeof htmlContent === "string" && htmlContent.trim().length > 0;

    if (!numericTemplateId && !hasHtmlContent) {
      throw new Error(
        "A valid templateId or htmlContent is required to send the email."
      );
    }

    const payload = {
      to: formattedRecipients,
      sender: sender || this.sender,
    };

    if (numericTemplateId) {
      payload.templateId = numericTemplateId;
      payload.params = params;
    } else if (hasHtmlContent) {
      payload.subject = subject || "Notification";
      payload.htmlContent = htmlContent;
      if (params && Object.keys(params).length > 0) {
        payload.params = params;
      }
    }

    if (attachment) {
      payload.attachment = Array.isArray(attachment) ? attachment : [attachment];
    }

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

  async sendCustomerWelcomeEmail({
    email,
    firstName,
    lastName,
    params = {},
    templateId = this.customerWelcomeTemplateId,
  }) {
    if (!email) {
      throw new Error("Email is required to send a customer welcome email.");
    }

    const mergedParams = {
      PRENOM: firstName,
      NOM: lastName,
      EMAIL: email,
      ...params,
    };

    const displayName = `${firstName || ""} ${lastName || ""}`.trim() || email;

    return this.sendTransactionalEmail({
      to: [{ email, name: displayName }],
      templateId,
      params: mergedParams,
    });
  }

  async sendCommandeCreatedEmail({
    email,
    firstName,
    orderId,
    params = {},
    templateId = this.commandeCreatedTemplateId,
  }) {
    if (!email) {
      throw new Error(
        "Email is required to send a commande confirmation email."
      );
    }

    if (!orderId) {
      throw new Error("Order ID is required to send a commande email.");
    }

    const mergedParams = {
      PRENOM: firstName || "",
      ORDER_ID: orderId,
      ...params,
    };

    const displayName = firstName?.trim() || email;

    return this.sendTransactionalEmail({
      to: [{ email, name: displayName }],
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

  async sendInvoiceEmail({
    email,
    firstName,
    orderReference,
    totalAmount,
    attachmentName,
    attachmentContent,
    templateId = this.invoiceTemplateId,
  }) {
    if (!email) {
      throw new Error("Email is required to send an invoice email.");
    }

    const attachment =
      attachmentName && attachmentContent
        ? [
            {
              name: attachmentName,
              content: attachmentContent,
            },
          ]
        : undefined;

    const recipientName = (firstName || "").trim() || email;
    const formattedTotal =
      typeof totalAmount === "number"
        ? totalAmount.toFixed(2) + " €"
        : String(totalAmount || "");

    if (templateId) {
      return this.sendTransactionalEmail({
        to: [{ email, name: recipientName }],
        templateId,
        params: {
          PRENOM: firstName || "",
          ORDER_REFERENCE: orderReference || "",
          TOTAL_AMOUNT: formattedTotal,
        },
        attachment,
      });
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <body style="font-family:Arial,sans-serif;color:#1a1a1a;">
          <p>Bonjour ${recipientName},</p>
          <p>Veuillez trouver ci-joint la facture de votre commande ${
            orderReference || ""
          }.</p>
          <p>Montant total : <strong>${formattedTotal}</strong></p>
          <p>Merci pour votre confiance.</p>
        </body>
      </html>
    `;

    return this.sendTransactionalEmail({
      to: [{ email, name: recipientName }],
      subject: `Votre facture ${orderReference || ""}`.trim(),
      htmlContent,
      attachment,
    });
  }
}

module.exports = new BrevoService();
