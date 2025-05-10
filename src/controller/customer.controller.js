const createResponse = require("../utils/api.response");
const customerService = require("../services/customer.service");
const customerAccountService = require("../services/customer.account.service");
const adresseService = require("../services/adress.service");
const authService = require("../services/auth.service");
const bcrypt = require("bcrypt");

exports.getAllCustomers = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
    return res
      .status(400)
      .json(createResponse("Invalid page or limit parameter", false));
  }

  try {
    const customersData = await customerService.getAllCustomers(
      Number(page),
      Number(limit)
    );
    res
      .status(200)
      .json(createResponse("Customers fetched successfully", customersData));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getLastTenCustomers = async (req, res) => {
  try {
    const customers = await customerService.getLastTenCustomers();
    res
      .status(200)
      .json(
        createResponse("Last ten customers fetched successfully", customers)
      );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getCurrentCustomer = async (req, res) => {
  try {
    const customer_id = req.customer.customer_id;
    const customer = await customerService.getCustomerById(customer_id);

    if (!customer) {
      return res
        .status(404)
        .json(createResponse("customer not found", null, false));
    }

    res
      .status(200)
      .json(
        createResponse("Current customer retrieved successfully", customer)
      );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.checkAddressIfExists = async (req, res) => {
  try {
    const { line1, city, country } = req.query;

    if (!line1 || !city || !country) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const result = await adresseService.checkAddressIfExists(
      line1,
      city,
      country
    );

    if (result.exists) {
      return res
        .status(200)
        .json({ message: "Address exists", address: result.address });
    } else {
      return res.status(404).json({ message: result.message });
    }
  } catch (error) {
    return res
      .status(500)
      .json({ error: `Error checking address: ${error.message}` });
  }
};

exports.getCustomerById = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res
      .status(400)
      .json(createResponse("Invalid customer ID", null, false));
  }

  try {
    const customer = await customerService.getCustomerById(Number(id));
    if (!customer) {
      return res
        .status(404)
        .json(createResponse("Customer not found", null, false));
    }
    res
      .status(200)
      .json(createResponse("Customer fetched successfully", customer));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.searchCustomers = async (req, res) => {
  const { searchTerm } = req.query;

  if (!searchTerm) {
    return res
      .status(400)
      .json(createResponse("Search term is required", null, false));
  }

  try {
    const customers = await customerService.searchCustomers(searchTerm);
    res
      .status(200)
      .json(createResponse("Customers fetched successfully", customers));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await authService.authenticateCustomer(email, password);
    return res.status(200).json({
      message: "Authentication successful",
      data: result,
    });
  } catch (error) {
    return res.status(401).json({
      message: error.message,
    });
  }
};

exports.createCustomer = async (req, res) => {
  const {
    first_name,
    last_name,
    email,
    password_hash,
    oauth_provider,
    oauth_id,
    phone,
    default_address_id,
  } = req.body;

  try {
    let hashedPassword = null;
    if (password_hash) {
      const saltRounds = 10;
      hashedPassword = await bcrypt.hash(password_hash, saltRounds);
    }

    const result = await customerService.createCustomer({
      first_name,
      last_name,
      email,
      password_hash: hashedPassword,
      oauth_provider,
      oauth_id,
      phone,
      default_address_id,
    });

    if (!result.status && result.message === "Utilisateur déjà existant") {
      const existingCustomer = result.data;
      return res.status(200).json(
        createResponse("Utilisateur déjà existant", {
          customer_id: existingCustomer.customer_id,
          email: existingCustomer.email,
          first_name: existingCustomer.first_name,
          last_name: existingCustomer.last_name,
        })
      );
    }

    const newCustomerAccount =
      await customerAccountService.createCustomerAccount({
        customer_id: result.data.customer_id,
        type: "standard",
      });

    return res.status(201).json(
      createResponse("Customer created successfully", {
        customer_id: result.data.customer_id,
        email: result.data.email,
        first_name: result.data.first_name,
        last_name: result.data.last_name,
        customerAccount: newCustomerAccount,
      })
    );
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateCustomer = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res
      .status(400)
      .json(createResponse("Invalid customer ID", null, false));
  }

  const {
    first_name,
    last_name,
    email,
    password_hash,
    oauth_provider,
    oauth_id,
    phone,
    default_address_id,
  } = req.body;

  try {
    const updatedCustomer = await customerService.updateCustomer(Number(id), {
      first_name,
      last_name,
      email,
      password_hash,
      oauth_provider,
      oauth_id,
      phone,
      default_address_id,
    });
    res
      .status(200)
      .json(createResponse("Customer updated successfully", updatedCustomer));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteCustomer = async (req, res) => {
  const { id } = req.params;

  if (isNaN(id)) {
    return res
      .status(400)
      .json(createResponse("Invalid customer ID", null, false));
  }

  try {
    const deletedCustomer = await customerService.deleteCustomer(Number(id));
    res
      .status(200)
      .json(createResponse("Customer deleted successfully", deletedCustomer));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

//  FOR ADRESS

exports.getAllAddressesForCustomer = async (req, res) => {
  const { customerId } = req.params;

  if (isNaN(customerId)) {
    return res
      .status(400)
      .json(createResponse("Invalid customer ID", null, false));
  }

  try {
    const addresses = await adresseService.getAllAddressesForCustomer(
      Number(customerId)
    );
    res
      .status(200)
      .json(createResponse("Addresses fetched successfully", addresses));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAddressById = async (req, res) => {
  const { addressId } = req.params;

  if (isNaN(addressId)) {
    return res
      .status(400)
      .json(createResponse("Invalid address ID", null, false));
  }

  try {
    const address = await adresseService.getAdresseById(Number(addressId));
    if (!address) {
      return res
        .status(404)
        .json(createResponse("Address not found", null, false));
    }
    res
      .status(200)
      .json(createResponse("Address fetched successfully", address));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createAddressForCustomer = async (req, res) => {
  const { customerId } = req.params;
  const { line1, city, country } = req.body;

  if (isNaN(customerId)) {
    return res
      .status(400)
      .json(createResponse("Invalid customer ID", null, false));
  }

  try {
    const newAddress = await adresseService.createAdresse({
      customer_id: Number(customerId),
      line1,
      city,
      country,
    });
    res
      .status(201)
      .json(createResponse("Address created successfully", newAddress));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateAddress = async (req, res) => {
  const { addressId } = req.params;
  const { line1, line2, city, postal_code, country } = req.body;

  if (isNaN(addressId)) {
    return res
      .status(400)
      .json(createResponse("Invalid address ID", null, false));
  }

  try {
    const updatedAddress = await adresseService.updateAdresse(
      Number(addressId),
      {
        line1,
        line2,
        city,
        postal_code,
        country,
      }
    );
    res
      .status(200)
      .json(createResponse("Address updated successfully", updatedAddress));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.deleteAddress = async (req, res) => {
  const { addressId } = req.params;

  if (isNaN(addressId)) {
    return res
      .status(400)
      .json(createResponse("Invalid address ID", null, false));
  }

  try {
    const deletedAddress = await adresseService.deleteAdresse(
      Number(addressId)
    );
    res
      .status(200)
      .json(createResponse("Address deleted successfully", deletedAddress));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
exports.customerGoogleLogin = async (req, res) => {
  try {
    const { id_token } = req.body;

    if (!id_token) {
      return res.status(400).json({ message: "Token Google manquant." });
    }

    const { token, customer } = await authService.authenticateGmailCustomer(
      id_token
    );

    return res.json({ token, customer });
  } catch (err) {
    console.error("Erreur de login Google :", err.message);
    return res
      .status(401)
      .json({ message: "Échec de la connexion Google", error: err.message });
  }
};
