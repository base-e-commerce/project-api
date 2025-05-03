const express = require("express");
const { validateDto } = require("../middleware/dto.validation.middleware");
const {
  createCustomerSchema,
  updateCustomerSchema,
  createAddressSchema,
  updateAddressSchema,
} = require("../dtos/customer.dto");
const {
  getAllCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  getAllAddressesForCustomer,
  getAddressById,
  createAddressForCustomer,
  updateAddress,
  deleteAddress,
  checkAddressIfExists,
  searchCustomers,
  login,
  getCurrentCustomer,
} = require("../controller/customer.controller");
const authenticateToken = require("../middleware/auth.middleware");
const authenticateAdmin = require("../middleware/auth.admin.middleware");
const authenticateCustomer = require("../middleware/auth.client.middleware");

const router = express.Router();

/**
 * @swagger
 * components:
 *   parameters:
 *     CustomerIdParam:
 *       name: id
 *       in: path
 *       required: true
 *       description: ID of the customer
 *       schema:
 *         type: integer
 *     AddressIdParam:
 *       name: addressId
 *       in: path
 *       required: true
 *       description: ID of the address
 *       schema:
 *         type: integer
 *     CustomerIdPathParam:
 *       name: customerId
 *       in: path
 *       required: true
 *       description: ID of the customer
 *       schema:
 *         type: integer
 *   requestBodies:
 *     CustomerRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               first_name:
 *                 type: string
 *               last_name:
 *                 type: string
 *               email:
 *                 type: string
 *               password_hash:
 *                 type: string
 *               oauth_provider:
 *                 type: string
 *               oauth_id:
 *                 type: string
 *               phone:
 *                 type: string
 *               default_address_id:
 *                 type: integer
 *     AddressRequestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               line1:
 *                 type: string
 *               line2:
 *                 type: string
 *               city:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               country:
 *                 type: string
 */

/**
 * @swagger
 * /search-customer:
 *   get:
 *     summary: Search customers by key
 *     tags:
 *       - Address
 *     parameters:
 *       - in: query
 *         name: searchTerm
 *         schema:
 *           type: string
 *         required: true
 *         description: Key of the search
 *     responses:
 *       200:
 *         description: Customes seach
 *       404:
 *         description: Customes not found
 */
router.get(
  "/search-customer",
  authenticateToken,
  authenticateAdmin,
  searchCustomers
);

/**
 * @swagger
 * /customer/login:
 *   post:
 *     summary: Authenticate customer
 *     tags:
 *       - Auth Customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 *       401:
 *         description: Invalid email or password
 */
router.post("/login", login);

/**
 * @swagger
 * /customer/current:
 *   get:
 *     summary: Get the currently authenticated customer's information
 *     tags:
 *       - Auth Customer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current customer's information retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
router.get("/current", authenticateCustomer, getCurrentCustomer);

/**
 * @swagger
 * /customer/:
 *   get:
 *     summary: Get all customers
 *     tags:
 *       - Customer
 *     responses:
 *       200:
 *         description: Get all customers
 */
router.get("/", authenticateToken, authenticateAdmin, getAllCustomers);

/**
 * @swagger
 * /customer/{id}:
 *   get:
 *     summary: Get customer by ID
 *     tags:
 *       - Customer
 *     parameters:
 *       - $ref: '#/components/parameters/CustomerIdParam'
 *     responses:
 *       200:
 *         description: Get a single customer by ID
 *       404:
 *         description: Customer not found
 */
router.get("/:id", authenticateToken, authenticateAdmin, getCustomerById);

/**
 * @swagger
 * /customer/:
 *   post:
 *     summary: Create a new customer
 *     tags:
 *       - Customer
 *     requestBody:
 *       $ref: '#/components/requestBodies/CustomerRequestBody'
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Invalid input data
 */
router.post(
  "/",

  createCustomer
);

/**
 * @swagger
 * /customer/{id}:
 *   put:
 *     summary: Update customer information by ID
 *     tags:
 *       - Customer
 *     parameters:
 *       - $ref: '#/components/parameters/CustomerIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/CustomerRequestBody'
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Customer not found
 */
router.put(
  "/:id",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateCustomerSchema),
  updateCustomer
);

/**
 * @swagger
 * /customer/{id}:
 *   delete:
 *     summary: Delete customer by ID
 *     tags:
 *       - Customer
 *     parameters:
 *       - $ref: '#/components/parameters/CustomerIdParam'
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       404:
 *         description: Customer not found
 */
router.delete("/:id", authenticateToken, authenticateAdmin, deleteCustomer);

/**
 * @swagger
 * /customer/{customerId}/address:
 *   get:
 *     summary: Get all addresses for a customer
 *     tags:
 *       - Address
 *     parameters:
 *       - $ref: '#/components/parameters/CustomerIdPathParam'
 *     responses:
 *       200:
 *         description: Get all addresses for a customer
 */
router.get(
  "/:customerId/address",
  authenticateToken,
  authenticateAdmin,
  getAllAddressesForCustomer
);

/**
 * @swagger
 * /address/check:
 *   get:
 *     summary: Check if an address exists
 *     tags:
 *       - Address
 *     parameters:
 *       - in: query
 *         name: line1
 *         schema:
 *           type: string
 *         required: true
 *         description: First line of the address
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         required: true
 *         description: City of the address
 *       - in: query
 *         name: country
 *         schema:
 *           type: string
 *         required: true
 *         description: Country of the address
 *     responses:
 *       200:
 *         description: Address exists
 *       404:
 *         description: Address not found
 */
router.get(
  "/address/check",
  authenticateToken,
  authenticateAdmin,
  checkAddressIfExists
);

/**
 * @swagger
 * /customer/address/{addressId}:
 *   get:
 *     summary: Get address by ID
 *     tags:
 *       - Address
 *     parameters:
 *       - $ref: '#/components/parameters/AddressIdParam'
 *     responses:
 *       200:
 *         description: Get a single address by ID
 *       404:
 *         description: Address not found
 */
router.get(
  "/address/:addressId",
  authenticateToken,
  authenticateAdmin,
  getAddressById
);

/**
 * @swagger
 * /customer/create-address/{customerId}:
 *   post:
 *     summary: Create a new address for a customer
 *     tags:
 *       - Address
 *     parameters:
 *       - $ref: '#/components/parameters/CustomerIdPathParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/AddressRequestBody'
 *     responses:
 *       201:
 *         description: Address created successfully
 *       400:
 *         description: Invalid input data
 */
router.post(
  "/create-address/:customerId",
  authenticateToken,
  authenticateAdmin,
  validateDto(createAddressSchema),
  createAddressForCustomer
);

/**
 * @swagger
 * /customer/address/{addressId}:
 *   put:
 *     summary: Update address information by ID
 *     tags:
 *       - Address
 *     parameters:
 *       - $ref: '#/components/parameters/AddressIdParam'
 *     requestBody:
 *       $ref: '#/components/requestBodies/AddressRequestBody'
 *     responses:
 *       200:
 *         description: Address updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Address not found
 */
router.put(
  "/address/:addressId",
  authenticateToken,
  authenticateAdmin,
  validateDto(updateAddressSchema),
  updateAddress
);

/**
 * @swagger
 * /customer/address/{addressId}:
 *   delete:
 *     summary: Delete address by ID
 *     tags:
 *       - Address
 *     parameters:
 *       - $ref: '#/components/parameters/AddressIdParam'
 *     responses:
 *       200:
 *         description: Address deleted successfully
 *       404:
 *         description: Address not found
 */
router.delete(
  "/address/:addressId",
  authenticateToken,
  authenticateAdmin,
  deleteAddress
);

module.exports = router;
