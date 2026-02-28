const fs = require("fs");
const path = require("path");
const ejs = require("ejs");
const pdf = require("html-pdf");
const commandeService = require("./commande.service");
const brevoService = require("./brevo.service");

const pdfOptions = {
  format: "A4",
  orientation: "portrait",
  border: "10mm",
};

const createPdfBuffer = (html) =>
  new Promise((resolve, reject) => {
    pdf.create(html, pdfOptions).toBuffer((error, buffer) => {
      if (error) {
        return reject(error);
      }
      resolve(buffer);
    });
  });

class InvoiceService {
  constructor() {
    this.templatesDir = path.join(__dirname, "..", "templates", "invoices");
    this.templatePath = path.join(this.templatesDir, "invoice.ejs");
    this.outputDir = path.join(process.cwd(), "uploads", "invoices");
    this.companyProfile = {
      name: process.env.COMPANY_NAME || "Graine de Valeur",
      address:
        process.env.COMPANY_ADDRESS ||
        "France, Madagascar, Cote d'Ivoire, Togo, Mauritanie",
      email: process.env.COMPANY_EMAIL || "contact@grainedevaleur.com",
      phone: process.env.COMPANY_PHONE || "+33 6 44 70 31 41",
      website: process.env.COMPANY_WEBSITE || "https://grainedevaleur.com",
      logoUrl:
        process.env.COMPANY_LOGO_URL ||
        "https://grainedevaleur.com/assets/logo-wb.png",
    };
    this.decimalFormatter = new Intl.NumberFormat("fr-FR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    });
  }

  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  normalizeStatus(value) {
    return (value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  normalizeText(value) {
    if (typeof value !== "string") {
      return "";
    }
    return value
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
  }

  formatCommandeReference(commande) {
    if (!commande || !commande.commande_id) {
      return "";
    }
    const orderYear = new Date(
      commande.order_date || Date.now()
    ).getFullYear();
    const paddedId = String(commande.commande_id).padStart(3, "0");
    return `GDV-${orderYear}-${paddedId}`;
  }

  formatCurrency(value) {
    const numericValue = Number(value) || 0;
    const formatted = this.decimalFormatter
      .format(numericValue)
      .replace(/\u00a0/g, ".")
      .replace(/\s/g, ".");
    return `${formatted} \u20ac`;
  }

  translatePaymentStatus(status) {
    const key = this.normalizeStatus(status);
    const translations = {
      pending: "En attente",
      payed: "Pay\u00e9e",
      paid: "Pay\u00e9e",
      livre: "Livr\u00e9e",
      confirme: "Confirm\u00e9e",
      annule: "Annul\u00e9e",
      rembourse: "Rembours\u00e9e",
      "demande remboursement": "Demande de remboursement",
    };
    return translations[key] || status || "N/A";
  }

  translatePaymentMethod(method) {
    const key = this.normalizeText(method);
    const translations = {
      card: "Carte bancaire",
      cash: "Esp\u00e8ces",
      transfert: "Virement bancaire",
      transfer: "Virement bancaire",
      cheque: "Ch\u00e8que",
      stripe: "Stripe",
      "mobile money": "Mobile Money",
    };
    return translations[key] || method || "N/A";
  }

  async getCommandeInvoiceData(commandeId, customerId) {
    const commande = await commandeService.getCommandeWithDetails(commandeId);

    if (!commande) {
      throw new Error("Commande introuvable");
    }

    if (commande.customer_id !== customerId) {
      throw new Error("Vous ne pouvez pas accéder \u00e0 cette commande");
    }

    const hasPaid =
      Array.isArray(commande.payments) &&
      commande.payments.some((payment) =>
        ["payed", "paid", "livre"].includes(
          this.normalizeStatus(payment.status)
        )
      );

    if (!hasPaid) {
      throw new Error(
        "La facture est disponible uniquement pour les commandes payées"
      );
    }

    return commande;
  }

  buildInvoicePayload(commande) {
    const reference =
      this.formatCommandeReference(commande) ||
      `CMD-${commande.commande_id || "0000"}`;

    const items = (commande.details || []).map((detail) => {
      const product = detail.product || {};
      return {
        name: product.name || "Produit",
        sku: product.sku || "",
        quantity: detail.quantity || 0,
        unitPrice: detail.unit_price || 0,
        unitPriceFormatted: this.formatCurrency(detail.unit_price || 0),
        total: (detail.quantity || 0) * (detail.unit_price || 0),
        totalFormatted: this.formatCurrency(
          (detail.quantity || 0) * (detail.unit_price || 0)
        ),
      };
    });

    const subTotal = items.reduce((sum, item) => sum + item.total, 0);
    const shippingAmount =
      Number(commande.shipping_fee ?? commande.shipping_amount) || 0;
    const totalAmount =
      Number(commande.total_amount) || subTotal + shippingAmount;

    return {
      reference,
      customer: commande.customer || {},
      shipping: commande.shipping_address_relation || {},
      items,
      totals: {
        subTotal,
        shipping: shippingAmount,
        total: totalAmount,
        subTotalFormatted: this.formatCurrency(subTotal),
        shippingFormatted: this.formatCurrency(shippingAmount),
        totalFormatted: this.formatCurrency(totalAmount),
      },
      payment: {
        method:
          (commande.payments && commande.payments[0]?.payment_method) || "N/A",
        methodLabel: this.translatePaymentMethod(
          commande.payments && commande.payments[0]?.payment_method
        ),
        status: commande.payments && commande.payments[0]?.status,
        statusLabel: this.translatePaymentStatus(
          commande.payments && commande.payments[0]?.status
        ),
      },
      issuedAt: commande.created_at || commande.order_date || new Date(),
      company: this.companyProfile,
    };
  }

  async renderInvoiceHtml(invoiceData) {
    return ejs.renderFile(this.templatePath, { invoice: invoiceData }, {
      async: true,
    });
  }

  async generateInvoice({ commandeId, customerId, sendEmail }) {
    const commande = await this.getCommandeInvoiceData(
      commandeId,
      customerId
    );
    const invoiceData = this.buildInvoicePayload(commande);
    const html = await this.renderInvoiceHtml(invoiceData);
    const pdfBuffer = await createPdfBuffer(html);

    this.ensureOutputDir();
    const fileName = `${invoiceData.reference || "facture"}-${Date.now()}.pdf`;
    const safeFileName = fileName.replace(/[^\w.-]/g, "_");
    const filePath = path.join(this.outputDir, safeFileName);
    await fs.promises.writeFile(filePath, pdfBuffer);

    if (sendEmail && invoiceData.customer?.email) {
      const attachment = pdfBuffer.toString("base64");
      try {
        await brevoService.sendInvoiceEmail({
          email: invoiceData.customer.email,
          firstName: invoiceData.customer.first_name,
          orderReference: invoiceData.reference,
          totalAmount: invoiceData.totals.total,
          attachmentName: safeFileName,
          attachmentContent: attachment,
        });
      } catch (error) {
        console.error("[Brevo] Impossible d'envoyer la facture:", error);
      }
    }

    return {
      buffer: pdfBuffer,
      fileName: safeFileName,
      path: filePath,
    };
  }
}

module.exports = new InvoiceService();
