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
  email: Joi.string().email().required().messages({
    "string.email": "Email must be a valid email address",
    "any.required": "Email is required",
  }),
  nombre: Joi.number().integer().optional().messages({
    "number.base": "Product ID must be a number",
    "number.integer": "Product ID must be an integer",
  }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  telephone: Joi.string().optional().messages({
    "string.pattern.base":
      "Telephone must contain only numbers, spaces, or symbols (+ - ( ))",
  }),
  productJson: Joi.object().required().messages({
    "object.base": "Product JSON must be a valid JSON object",
    "any.required": "Product JSON is required",
  }),
});

exports.updateDevisSchema = Joi.object({
  user_id: Joi.number().integer().optional().messages({
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
  }),
  product_id: Joi.number().integer().optional().messages({
    "number.base": "Product ID must be a number",
    "number.integer": "Product ID must be an integer",
  }),
  nombre: Joi.number().integer().optional().messages({
    "number.base": "Product ID must be a number",
    "number.integer": "Product ID must be an integer",
  }),
  email: Joi.string().email().optional().messages({
    "string.email": "Email must be a valid email address",
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
  productJson: Joi.object().optional().messages({
    "object.base": "Product JSON must be a valid JSON object",
  }),
});
