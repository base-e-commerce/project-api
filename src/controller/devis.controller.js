const createResponse = require("../utils/api.response");
const devisService = require("../services/devis.service");
const stripeService = require("../services/stripe.payement.service");
const commandeService = require("../services/commande.service");
const customerService = require("../services/customer.service");
const adresseService = require("../services/adress.service");

const toFiniteNumber = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.replace(",", ".");
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
  }

  if (typeof value === "object") {
    if (value.value !== undefined) {
      return toFiniteNumber(value.value);
    }
    if (value.amount !== undefined) {
      return toFiniteNumber(value.amount);
    }
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const isConvertibleStatus = (status) => {
  if (!status) {
    return false;
  }
  const normalized = status.toString().trim().toLowerCase();
  const convertibleTokens = ["valid", "validé", "validated", "approved", "accept"];
  const excludedTokens = ["converted", "commande", "paid", "payed"];
  const hasConvertibleToken = convertibleTokens.some((token) =>
    normalized.includes(token)
  );
  const hasExcludedToken = excludedTokens.some((token) =>
    normalized.includes(token)
  );
  return hasConvertibleToken && !hasExcludedToken;
};

const buildCommandeConversionPayload = (devis) => {
  const productInfo = devis.productJson || {};
  const quantityCandidates = [
    productInfo.quantity,
    productInfo.nombre,
    devis.nombre,
    productInfo.qty,
    productInfo.count,
  ];
  const resolvedQuantity =
    quantityCandidates
      .map((value) => toFiniteNumber(value))
      .find((value) => value !== null && value > 0) ?? 1;
  const quantity = Math.max(1, Math.round(resolvedQuantity));
  const finalPrice = toFiniteNumber(devis.price_final);
  if (!finalPrice || finalPrice <= 0) {
    throw new Error("Final price must be set by admin before converting the devis");
  }
  const unitPrice = finalPrice;

  const productIdCandidates = [
    productInfo.product_id,
    productInfo.productId,
    devis.product_id,
    productInfo.id,
  ];
  const productId = productIdCandidates
    .map((value) => toFiniteNumber(value))
    .find((value) => value !== null && Number.isInteger(value) && value > 0);

  if (!productId) {
    throw new Error("Product identifier missing on the devis");
  }

  return {
    details: [
      {
        product_id: productId,
        quantity,
        unit_price: Number(unitPrice),
      },
    ],
    currency: (productInfo.currency ?? "EUR").toString(),
    itemName:
      productInfo.name ||
      productInfo.label ||
      productInfo.title ||
      devis.entreprise ||
      "Devis",
  };
};

exports.getAllDevisByEmail = async (req, res) => {
  try {
    const { email } = req.params;
    const devisList = await devisService.getAllDevisByEmail(email);
    res
      .status(200)
      .json(createResponse("Devis for user fetched successfully", devisList));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAllDevis = async (req, res) => {
  try {
    const devisList = await devisService.getAllDevis();
    res
      .status(200)
      .json(createResponse("All devis fetched successfully", devisList));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getDevisById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid devis ID"));
  }

  try {
    const devis = await devisService.getDevisById(Number(id));
    if (!devis) {
      return res.status(404).json(createResponse("Devis not found"));
    }
    res.status(200).json(createResponse("Devis fetched successfully", devis));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createDevis = async (req, res) => {
  try {
    const newDevis = await devisService.createDevis(req.body);
    res
      .status(201)
      .json(createResponse("Devis created successfully", newDevis));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateDevis = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res
      .status(400)
      .json(createResponse("Invalid devis ID", null, false));
  }

  try {
    const updatedDevis = await devisService.updateDevis(Number(id), req.body);
    res
      .status(200)
      .json(createResponse("Devis updated successfully", updatedDevis));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteDevis = async (req, res) => {
  const { id } = req.params;

  try {
    const deletedDevis = await devisService.deleteDevis(Number(id));
    res
      .status(200)
      .json(createResponse("Devis deleted successfully", deletedDevis));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createDevisPayment = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res.status(400).json(createResponse("Invalid devis ID", null, false));
  }

  try {
    const devis = await devisService.getDevisById(Number(id));
    if (!devis) {
      return res.status(404).json(createResponse("Devis not found", null, false));
    }

    const metadata = {
      devis_id: String(devis.id),
    };

    const productInfo = devis.productJson || {};
    const unitPrice = Number(productInfo.price_pro ?? productInfo.price ?? 0);
    const quantity = Number(devis.nombre ?? 1);
    const currency = (productInfo.currency ?? "EUR").toLowerCase();

    if (!unitPrice || unitPrice <= 0) {
      return res
        .status(400)
        .json(createResponse("Invalid unit price for devis", null, false));
    }

    const amount = unitPrice * Math.max(quantity, 1);
    const session = await stripeService.createCheckoutSession({
      amount,
      currency,
      metadata,
      itemName: productInfo.name || devis.entreprise || "Devis",
    });

    return res.status(200).json(
      createResponse("Payment session ready", {
        sessionId: session.id,
        url: session.url,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Failed to create payment session", error.message, false));
  }
};

exports.convertDevisToCommande = async (req, res) => {
  const { id } = req.params;
  const { shippingAddressId, type, currency } = req.body;
  const customer = req.customer;

  if (!customer || !customer.customer_id) {
    return res
      .status(401)
      .json(createResponse("Authentication required for conversion", null, false));
  }

  if (isNaN(id)) {
    return res
      .status(400)
      .json(createResponse("Invalid devis ID", null, false));
  }

  try {
    const devis = await devisService.getDevisById(Number(id));
    if (!devis) {
      return res.status(404).json(createResponse("Devis not found", null, false));
    }

    const ownsByUserId =
      devis.user_id && Number(devis.user_id) === customer.customer_id;
    const ownsByEmail =
      devis.email &&
      customer.email &&
      devis.email.toLowerCase() === customer.email.toLowerCase();
    if (!ownsByUserId && !ownsByEmail) {
      return res
        .status(403)
        .json(
          createResponse(
            "You are not authorized to convert this devis",
            null,
            false
          )
        );
    }

    if (!isConvertibleStatus(devis.status)) {
      return res
        .status(400)
        .json(
          createResponse(
            "Devis must be validated before converting it to a commande",
            null,
            false
          )
        );
    }

    let conversionPayload;
    try {
      conversionPayload = buildCommandeConversionPayload(devis);
    } catch (error) {
      return res
        .status(400)
        .json(createResponse(error.message, null, false));
    }

    const customerRecord = await customerService.getCustomerById(
      customer.customer_id
    );
    if (!customerRecord) {
      return res
        .status(404)
        .json(createResponse("Customer not found", null, false));
    }

    const customerAddresses =
      await adresseService.getAllAddressesForCustomerClient(
        customerRecord.customer_id
      );

    const resolvedAddressId =
      shippingAddressId ??
      customerRecord.default_address_id ??
      (customerAddresses[0]?.address_id ?? null);

    if (!resolvedAddressId) {
      return res
        .status(400)
        .json(createResponse("Shipping address is required", null, false));
    }

    const ownsAddress = customerAddresses.some(
      (address) => address.address_id === resolvedAddressId
    );

    if (!ownsAddress) {
      return res
        .status(400)
        .json(
          createResponse(
            "Shipping address does not belong to this customer",
            null,
            false
          )
        );
    }

    const commandeType =
      typeof type === "string" && type.trim().toLowerCase() === "pro"
        ? "pro"
        : "standard";

    const { commande } = await commandeService.createCommande(
      customerRecord.customer_id,
      conversionPayload.details,
      { payment_method: "stripe" },
      resolvedAddressId,
      commandeType
    );

    const totalAmount =
      Number(commande.total_amount ?? commande.totalAmount ?? 0);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      return res
        .status(500)
        .json(createResponse("Commande total is invalid", null, false));
    }

    const session = await stripeService.createCheckoutSession({
      amount: totalAmount,
      currency:
        (currency ?? conversionPayload.currency ?? "EUR").toString().toLowerCase(),
      commande_id: commande.commande_id,
      metadata: { devis_id: String(devis.id) },
      itemName: conversionPayload.itemName,
    });

    await devisService.updateDevis(Number(id), { status: "commande_created" });

    return res.status(201).json(
      createResponse("Commande créée, session de paiement prête", {
        commandeId: commande.commande_id,
        checkoutUrl: session.url,
        sessionId: session.id,
      })
    );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Conversion failed", error.message, false));
  }
};
