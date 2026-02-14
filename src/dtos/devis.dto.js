const Joi = require("joi");

exports.createDevisSchema = Joi.object({
  user_id: Joi.number().integer().optional().messages({
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
  }),
  product_id: Joi.number().integer().optional().messages({
    "number.base": "Product ID must be a number",
    "number.integer": "Product ID must be an integer",
  }),
  box_id: Joi.number().integer().optional().messages({
    "number.base": "Box ID must be a number",
    "number.integer": "Box ID must be an integer",
  }),
  machine_id: Joi.number().integer().optional().messages({
    "number.base": "Machine ID must be a number",
    "number.integer": "Machine ID must be an integer",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  country: Joi.string().max(100).optional().messages({
    "string.base": "Country must be a string",
    "string.max": "Country must not exceed 100 characters",
  }),
  nombre: Joi.number().integer().optional().messages({
    "number.base": "Product ID must be a number",
    "number.integer": "Product ID must be an integer",
  }),
  entreprise: Joi.string().optional().messages({
    "string.base": "Entreprise must be a string",
  }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  telephone: Joi.string().optional().messages({
    "string.pattern.base":
      "Telephone must contain only numbers, spaces, or symbols (+ - ( ))",
  }),
  productJson: Joi.object().optional().unknown(true).messages({
    "object.base": "Product JSON must be a valid JSON object",
  }),
  price_final: Joi.number()
    .precision(4)
    .min(0)
    .messages({
      "number.base": "Final price must be a number",
      "number.min": "Final price cannot be negative",
    })
    .optional(),
}).or("productJson", "product_id", "box_id", "machine_id");

exports.updateDevisSchema = Joi.object({
  user_id: Joi.number().integer().optional().messages({
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
  }),
  product_id: Joi.number().integer().optional().messages({
    "number.base": "Product ID must be a number",
    "number.integer": "Product ID must be an integer",
  }),
  box_id: Joi.number().integer().optional().messages({
    "number.base": "Box ID must be a number",
    "number.integer": "Box ID must be an integer",
  }),
  machine_id: Joi.number().integer().optional().messages({
    "number.base": "Machine ID must be a number",
    "number.integer": "Machine ID must be an integer",
  }),
  nombre: Joi.number().integer().optional().messages({
    "number.base": "Product ID must be a number",
    "number.integer": "Product ID must be an integer",
  }),
  email: Joi.string().email().optional().messages({
    "string.base": "Description must be a string",
  }),
  country: Joi.string().max(100).optional().messages({
    "string.base": "Country must be a string",
    "string.max": "Country must not exceed 100 characters",
  }),
  entreprise: Joi.string().optional().messages({
    "string.base": "Entreprise must be a string",
  }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  telephone: Joi.string()
    .pattern(/^[0-9+\-()\s]*$/)
    .optional()
    .messages({
      "string.pattern.base":
        "Telephone must contain only numbers, spaces, or symbols (+ - ( ))",
    }),
  productJson: Joi.object().optional().unknown(true).messages({
    "object.base": "Product JSON must be a valid JSON object",
  }),
  status: Joi.string()
    .max(50)
    .messages({
      "string.base": "Status must be a string",
      "string.max": "Status must not exceed 50 characters",
    })
    .optional(),
  price_final: Joi.number()
    .precision(4)
    .min(0)
    .messages({
      "number.base": "Final price must be a number",
      "number.min": "Final price cannot be negative",
    })
    .optional(),
});

exports.convertDevisToCommandeSchema = Joi.object({
  shippingAddressId: Joi.number().integer().optional().messages({
    "number.base": "Shipping Address ID must be a number",
    "number.integer": "Shipping Address ID must be an integer",
  }),
  type: Joi.string()
    .valid("pro", "standard")
    .optional()
    .messages({
      "string.base": "Type must be a string",
      "any.only": "Type must be either 'pro' or 'standard'",
    }),
  currency: Joi.string().max(10).optional().messages({
    "string.base": "Currency must be a string",
    "string.max": "Currency identifier must not exceed 10 characters",
  }),
});
