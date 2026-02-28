const createResponse = require("../utils/api.response");
const commandeService = require("../services/commande.service");
const customerService = require("../services/customer.service");
const productService = require("../services/product.service");
const adresseService = require("../services/adress.service");
const deliveryPricingService = require("../services/delivery-pricing.service");
const brevoService = require("../services/brevo.service");
const invoiceService = require("../services/invoice.service");
const realtimeNotificationService = require("../services/realtime-notification.service");

const PRO_ACCOUNT_TYPE_ALIASES = new Set([
  "pro",
  "professionnel",
  "professionel",
  "professional",
]);

const isProCustomerAccount = (customer) => {
  const accounts = customer?.accounts || [];
  return accounts.some((account) => {
    const type = account?.type;
    if (!type) return false;
    const normalized = type.toString().trim().toLowerCase();
    return PRO_ACCOUNT_TYPE_ALIASES.has(normalized);
  });
};

const formatCommandeReference = (commande) => {
  if (!commande || !commande.commande_id) {
    return "";
  }

  const orderYear = new Date(
    commande.order_date || Date.now()
  ).getFullYear();

  const paddedId = String(commande.commande_id).padStart(3, "0");
  return `GDV-${orderYear}-${paddedId}`;
};

const parsePositiveQuantity = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const normalizeProductWeightKg = (value) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }

  // Legacy products may store grams in weight_kg (e.g. 4000 => 4kg).
  if (Number.isInteger(parsed) && parsed >= 1000) {
    return parsed / 1000;
  }

  return parsed;
};

const computeOrderWeight = (orderDetails, productMap) => {
  const missingWeightProducts = [];
  const totalWeightKg = (orderDetails || []).reduce((acc, detail) => {
    const product = productMap.get(Number(detail.product_id));
    if (!product) {
      return acc;
    }
    const quantity = parsePositiveQuantity(detail.quantity);
    if (!quantity) {
      return acc;
    }

    const productWeightKg = normalizeProductWeightKg(product.weight_kg);
    if (!Number.isFinite(productWeightKg) || productWeightKg <= 0) {
      missingWeightProducts.push({
        product_id: product.product_id,
        name: product.name,
      });
      return acc;
    }

    return acc + productWeightKg * quantity;
  }, 0);

  return {
    totalWeightKg,
    missingWeightProducts,
  };
};

const resolveShippingQuoteWithFallback = async ({
  country,
  totalWeightKg,
  missingWeightProducts,
}) => {
  const hasMissingWeight = Array.isArray(missingWeightProducts)
    ? missingWeightProducts.length > 0
    : false;

  if (hasMissingWeight || !Number.isFinite(totalWeightKg) || totalWeightKg <= 0) {
    return {
      shippingFee: 0,
      shippingFeeAr: null,
      shippingZone: null,
      shippingWeightKg: Number.isFinite(totalWeightKg) ? totalWeightKg : 0,
      shippingWeightTierKg: null,
      manualShippingFee: true,
      missingWeightProducts: Array.isArray(missingWeightProducts)
        ? missingWeightProducts
        : [],
      note: "Shipping fee will be added manually by admin.",
    };
  }

  const quote = await deliveryPricingService.quoteByCountryAndWeight({
    country,
    totalWeightKg,
  });

  return {
    shippingFee: quote.priceEuro,
    shippingFeeAr: quote.priceAr,
    shippingZone: quote.destination,
    shippingWeightKg: quote.totalWeightKg,
    shippingWeightTierKg: quote.billedWeightKg,
    manualShippingFee: false,
    missingWeightProducts: [],
    note: null,
  };
};

const resolveValidatedShippingAddress = async (
  customerId,
  shippingAddressId
) => {
  const parsedAddressId = Number(shippingAddressId);
  if (!Number.isInteger(parsedAddressId) || parsedAddressId <= 0) {
    throw new Error("Shipping address is required");
  }

  const shippingAddress = await adresseService.getAdresseById(parsedAddressId);
  if (!shippingAddress || shippingAddress.customer_id !== Number(customerId)) {
    throw new Error("Shipping address does not belong to this customer");
  }

  return shippingAddress;
};

// exports.createCommande = async (req, res) => {
//   try {
//     const { customerId, details } = req.body;
//     const commande = await commandeService.createCommande(customerId, details);
//     res
//       .status(201)
//       .json(createResponse(commande, "Commande créée avec succès"));
//   } catch (error) {
//     res.status(400).json(createResponse(null, error.message, true));
//   }
// };

exports.createCommande = async (req, res) => {
  try {
    const {
      customerId,
      details,
      paymentDetails,
      shippingAddressId,
      type,
    } = req.body;
    const normalizedType =
      typeof type === "string" ? type.trim().toLowerCase() : "";
    const commandeType = normalizedType === "pro" ? "pro" : "standard";
    const orderDetails = Array.isArray(details) ? details : [];

    const parsedCustomerId =
      customerId !== undefined && customerId !== null
        ? Number(customerId)
        : null;

    if (parsedCustomerId !== null && Number.isNaN(parsedCustomerId)) {
      return res
        .status(400)
        .json(createResponse("Customer ID must be a valid number", null, false));
    }

    const authenticatedCustomerId = req.customer?.customer_id;
    if (
      authenticatedCustomerId &&
      parsedCustomerId !== null &&
      authenticatedCustomerId !== parsedCustomerId
    ) {
      return res
        .status(403)
        .json(
          createResponse(
            "Customer ID does not match authenticated user",
            null,
            false
          )
        );
    }

    const targetCustomerId = authenticatedCustomerId ?? parsedCustomerId;
    if (!targetCustomerId) {
      return res
        .status(400)
        .json(createResponse("Customer ID is required", null, false));
    }

    const customerRecord = await customerService.getCustomerById(
      targetCustomerId
    );
    if (!customerRecord) {
      return res
        .status(404)
        .json(createResponse("Customer not found", null, false));
    }

    const isProAccount = isProCustomerAccount(customerRecord);

    const productIds = orderDetails.map((detail) => detail.product_id);
    const retrievedProducts = await productService.getProductsByIds(productIds);
    const productMap = new Map(
      retrievedProducts.map((product) => [product.product_id, product])
    );

    const missingProductIds = Array.from(
      new Set(
        productIds.filter((productId) => !productMap.has(productId))
      )
    );
    if (missingProductIds.length > 0) {
      return res
        .status(400)
        .json(
          createResponse(
            "Some products are not available",
            { missingProductIds },
            false
          )
        );
    }

    const quantityErrors = [];
    orderDetails.forEach((detail) => {
      const product = productMap.get(detail.product_id);
      if (!product) {
        return;
      }

      const rawMin = isProAccount
        ? product.min_co_pro
        : product.min_co_standard;
      const minValue =
        typeof rawMin === "number" && Number.isFinite(rawMin)
          ? rawMin
          : null;

      if (minValue && detail.quantity < minValue) {
        quantityErrors.push(
          `Minimum quantity for "${product.name}" is ${minValue} for ${
            isProAccount ? "professional" : "standard"
          } accounts`
        );
      }
    });

    if (quantityErrors.length > 0) {
      return res
        .status(400)
        .json(
          createResponse(
            "Minimum quantity requirements not met",
            { errors: quantityErrors },
            false
          )
        );
    }

    let shippingAddress;
    try {
      shippingAddress = await resolveValidatedShippingAddress(
        targetCustomerId,
        shippingAddressId
      );
    } catch (addressError) {
      return res
        .status(400)
        .json(createResponse(addressError.message, null, false));
    }

    const { totalWeightKg, missingWeightProducts } = computeOrderWeight(
      orderDetails,
      productMap
    );

    let shippingQuote;
    try {
      shippingQuote = await resolveShippingQuoteWithFallback({
        country: shippingAddress.country,
        totalWeightKg,
        missingWeightProducts,
      });
    } catch (shippingError) {
      return res
        .status(400)
        .json(createResponse(shippingError.message, null, false));
    }

    const { commande, payment } = await commandeService.createCommande(
      targetCustomerId,
      orderDetails,
      paymentDetails,
      shippingAddressId,
      commandeType,
      [],
      [],
      {
        shippingFee: shippingQuote.shippingFee,
        shippingWeightKg: shippingQuote.shippingWeightKg,
        shippingWeightTierKg: shippingQuote.shippingWeightTierKg,
        shippingZone: shippingQuote.shippingZone,
      }
    );

    try {
      await realtimeNotificationService.notifyAdmins({
        type: "commande_created",
        title: "Nouvelle commande client",
        message: `Commande #${commande.commande_id} creee par ${customerRecord.first_name || "Client"} ${customerRecord.last_name || ""}`.trim(),
        route: "/dashboard/gestion/orders",
        entityType: "commande",
        entityId: commande.commande_id,
        customer: {
          id: customerRecord.customer_id,
          firstName: customerRecord.first_name || null,
          lastName: customerRecord.last_name || null,
          email: customerRecord.email || null,
        },
        meta: {
          totalAmount: commande.total_amount || null,
          currency: commande.currency || null,
          type: commandeType,
        },
      });
    } catch (notificationError) {
      console.error(
        "[Realtime] Failed to persist/broadcast commande notification:",
        notificationError.message
      );
    }

    const customerForEmail = req.customer || {};
    if (customerForEmail.email) {
      const fallbackReference =
        commande && commande.commande_id
          ? `GDV-${String(commande.commande_id).padStart(3, "0")}`
          : "";
      const orderReference =
        formatCommandeReference(commande) || fallbackReference;

      if (orderReference) {
        try {
          await brevoService.sendCommandeCreatedEmail({
            email: customerForEmail.email,
            firstName: customerForEmail.first_name,
            orderId: orderReference,
          });
        } catch (brevoError) {
          console.error(
            "[Brevo] Failed to send commande confirmation email:",
            brevoError.message
          );
        }
      }
    }

    if (payment) {
      res
        .status(201)
        .json(
          createResponse(
            { commande, payment },
            "Commande et paiement créés avec succès"
          )
        );
    } else {
      res
        .status(201)
        .json(createResponse("Commande créée avec succès", commande));
    }
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getShippingQuote = async (req, res) => {
  try {
    const { customerId, shippingAddressId, details } = req.body || {};
    const parsedCustomerId =
      customerId !== undefined && customerId !== null
        ? Number(customerId)
        : null;
    const authenticatedCustomerId = req.customer?.customer_id;
    const targetCustomerId = authenticatedCustomerId ?? parsedCustomerId;

    if (!targetCustomerId) {
      return res
        .status(400)
        .json(createResponse("Customer ID is required", null, false));
    }

    const orderDetails = Array.isArray(details) ? details : [];
    if (orderDetails.length === 0) {
      return res
        .status(400)
        .json(createResponse("Details are required", null, false));
    }

    let shippingAddress;
    try {
      shippingAddress = await resolveValidatedShippingAddress(
        targetCustomerId,
        shippingAddressId
      );
    } catch (addressError) {
      return res
        .status(400)
        .json(createResponse(addressError.message, null, false));
    }

    const productIds = orderDetails.map((detail) => detail.product_id);
    const retrievedProducts = await productService.getProductsByIds(productIds);
    const productMap = new Map(
      retrievedProducts.map((product) => [product.product_id, product])
    );

    const missingProductIds = Array.from(
      new Set(
        productIds
          .map((id) => Number(id))
          .filter((productId) => !productMap.has(productId))
      )
    );
    if (missingProductIds.length > 0) {
      return res
        .status(400)
        .json(
          createResponse(
            "Some products are not available",
            { missingProductIds },
            false
          )
        );
    }

    const { totalWeightKg, missingWeightProducts } = computeOrderWeight(
      orderDetails,
      productMap
    );

    const quote = await resolveShippingQuoteWithFallback({
      country: shippingAddress.country,
      totalWeightKg,
      missingWeightProducts,
    });

    return res.json(
      createResponse("Shipping quote calculated successfully", {
        shippingFee: quote.shippingFee,
        shippingFeeAr: quote.shippingFeeAr,
        shippingZone: quote.shippingZone,
        shippingWeightKg: quote.shippingWeightKg,
        shippingWeightTierKg: quote.shippingWeightTierKg,
        manualShippingFee: quote.manualShippingFee,
        missingWeightProducts: quote.missingWeightProducts,
        note: quote.note,
        country: shippingAddress.country,
      })
    );
  } catch (error) {
    return res
      .status(400)
      .json(createResponse(error.message || "Unable to calculate shipping quote", null, false));
  }
};

exports.getCommandesByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const commandes = await commandeService.getCommandesByCustomer(
      parseInt(customerId)
    );
    res
      .status(200)
      .json(createResponse("Commandes récupérées avec succès", commandes));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.resendCommande = async (req, res) => {
  try {
    const customer = req.customer;
    const { commandeId } = req.params;
    const checkCommande = await commandeService.checkCommandeByCustomer(
      customer.customer_id
    );
    if (checkCommande.length === 0) {
      return res
        .status(404)
        .json(createResponse("Aucune commande trouvée pour ce client"));
    }
    const commande = await commandeService.resendCommande(parseInt(commandeId));
    res
      .status(200)
      .json(createResponse("Commande renvoyée avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.cancelThisCommande = async (req, res) => {
  try {
    const customer = req.customer;
    const { commandeId } = req.params;
    const checkCommande = await commandeService.checkCommandeByCustomer(
      customer.customer_id
    );
    if (checkCommande.length === 0) {
      return res
        .status(404)
        .json(createResponse("Aucune commande trouvée pour ce client"));
    }
    const commande = await commandeService.cancelThisCommande(
      parseInt(commandeId)
    );
    res
      .status(200)
      .json(createResponse("Commande renvoyée avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.requestRefund = async (req, res) => {
  try {
    const customer = req.customer;
    if (!customer || !customer.customer_id) {
      return res
        .status(401)
        .json(createResponse("Client non authentifiǸ", null, true));
    }

    const { commandeId } = req.params;
    const commande = await commandeService.requestRefund(
      parseInt(commandeId),
      parseInt(customer.customer_id)
    );
    res.status(200).json(
      createResponse(
        "Demande de remboursement enregistrǸe avec succ��s",
        commande
      )
    );
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getAllCommandes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { commandes, totalCommandes } = await commandeService.getAllCommandes(
      limit,
      offset
    );

    const totalPages = Math.ceil(totalCommandes / limit);

    res.status(200).json(
      createResponse("Commands fetched successfully", {
        commandes,
        pagination: {
          page,
          limit,
          totalPages,
          totalCommand: totalCommandes,
        },
      })
    );
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.confirmDelivery = async (req, res) => {
  const idCommande = req.params.idCommande;
  const adminId = req.user.userId;

  try {
    const commande = await commandeService.confirmDelivery(
      parseInt(idCommande),
      parseInt(adminId)
    );
    res
      .status(200)
      .json(createResponse("Commande confirmée avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getAllCommandesConfirmed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { commandes, totalCommandes } =
      await commandeService.getAllCommandesConfirmed(limit, offset);

    const totalPages = Math.ceil(totalCommandes / limit);

    res.status(200).json(
      createResponse("Commands fetched successfully", {
        commandes,
        pagination: {
          page,
          limit,
          totalPages,
          totalCommand: totalCommandes,
        },
      })
    );
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getAllCommandesLivred = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { commandes, totalCommandes } =
      await commandeService.getAllCommandesLivred(limit, offset);

    const totalPages = Math.ceil(totalCommandes / limit);

    res.status(200).json(
      createResponse("Commands fetched successfully", {
        commandes,
        pagination: {
          page,
          limit,
          totalPages,
          totalCommand: totalCommandes,
        },
      })
    );
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getAllCommandeByState = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const offset = (page - 1) * limit;

    const { commandes, totalCommandes } =
      await commandeService.getAllCommandeByState(
        req.params.status,
        limit,
        offset
      );

    const totalPages = Math.ceil(totalCommandes / limit);

    res.status(200).json(
      createResponse("Commands fetched successfully", {
        commandes,
        pagination: {
          page,
          limit,
          totalPages,
          totalCommand: totalCommandes,
        },
      })
    );
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.searchCommandes = async (req, res) => {
  try {
    const { searchTerm } = req.query;
    const commandes = await commandeService.searchCommandes(searchTerm);
    res
      .status(200)
      .json(createResponse("Commandes trouvées avec succès", commandes));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.getLastTenCommandes = async (req, res) => {
  try {
    const commandes = await commandeService.getLastTenCommandes();
    res
      .status(200)
      .json(
        createResponse("Dernières commandes récupérées avec succès", commandes)
      );
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.receiveCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const { dateDelivery } = req.body;
    const adminId = req.user.userId;
    if (!adminId) {
      return res
        .status(400)
        .json(createResponse("L'ID de l'administrateur est requis"));
    }
    const commande = await commandeService.receiveCommande(
      parseInt(commandeId),
      parseInt(adminId),
      dateDelivery
    );
    res
      .status(200)
      .json(createResponse("Commande reçue avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.cancelCommande = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const adminId = req.user.userId;
    if (!adminId) {
      return res
        .status(400)
        .json(createResponse("L'ID de l'administrateur est requis"));
    }
    const commande = await commandeService.cancelCommande(
      parseInt(commandeId),
      parseInt(adminId)
    );
    res
      .status(200)
      .json(createResponse("Commande annulée avec succès", commande));
  } catch (error) {
    res.status(400).json(createResponse(null, error.message, true));
  }
};

exports.updateShippingFee = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const { shipping_fee } = req.body;
    const updated = await commandeService.updateShippingFee(
      Number(commandeId),
      Number(shipping_fee)
    );
    return res
      .status(200)
      .json(
        createResponse("Frais de livraison mis a jour avec succes", updated)
      );
  } catch (error) {
    return res
      .status(400)
      .json(createResponse(error.message || "Erreur de mise a jour", null, false));
  }
};

exports.getLastUnpaidCommande = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId || isNaN(parseInt(customerId))) {
      return res
        .status(400)
        .json(createResponse("L'ID du client est invalide ou manquant"));
    }

    const result = await commandeService.getLastUnpaidCommandeIdByCustomer(
      parseInt(customerId)
    );

    if (!result) {
      return res
        .status(404)
        .json(createResponse("Aucune commande non payée trouvée"));
    }

    res.status(200).json(createResponse("Commande non payée trouvée", result));
  } catch (error) {
    console.error("Erreur dans getLastUnpaidCommande:", error);
    res
      .status(500)
      .json(createResponse(null, error.message || "Erreur serveur", true));
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const { commandeId } = req.params;
    const { sendEmail = false } = req.body || {};
    const customerId = req.customer?.customer_id;

    if (!customerId) {
      return res
        .status(401)
        .json(createResponse("Client non authentifié", null, true));
    }

    if (!commandeId) {
      return res
        .status(400)
        .json(createResponse("Identifiant commande manquant"));
    }

    const invoice = await invoiceService.generateInvoice({
      commandeId: parseInt(commandeId, 10),
      customerId: parseInt(customerId, 10),
      sendEmail: Boolean(sendEmail),
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${invoice.fileName}\"`
    );
    return res.send(invoice.buffer);
  } catch (error) {
    return res.status(400).json(createResponse(null, error.message, true));
  }
};
