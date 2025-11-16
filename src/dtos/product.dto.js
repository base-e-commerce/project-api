const Joi = require("joi");

const tierSchema = Joi.object({
  min_quantity: Joi.number().integer().min(0).required().messages({
    "number.base": "min_quantity must be a number",
    "number.integer": "min_quantity must be an integer",
    "number.min": "min_quantity must be at least 0",
    "any.required": "min_quantity is required",
  }),
  max_quantity: Joi.number().integer().min(0).allow(null).messages({
    "number.base": "max_quantity must be a number",
    "number.integer": "max_quantity must be an integer",
    "number.min": "max_quantity must be at least 0",
  }),
  unit_price: Joi.number().positive().required().messages({
    "number.base": "unit_price must be a number",
    "number.positive": "unit_price must be a positive number",
    "any.required": "unit_price is required",
  }),
});

const minCommandeSchema = Joi.object({
  tiers: Joi.array().items(tierSchema).default([]).messages({
    "array.base": "tiers must be an array",
  }),
}).default({ tiers: [] });

exports.createProductSchema = Joi.object({
  name: Joi.string().min(3).max(200).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 200 characters",
    "any.required": "Name is required",
  }),
  description: Joi.string().optional().allow(null, "").messages({
    "string.base": "Description must be a string",
  }),
  descriptionRich: Joi.string().optional().allow(null, "").messages({
    "string.base": "Rich description must be a string",
  }),
  currency: Joi.string().required().messages({
    "string.base": "Currency must be a string",
    "any.required": "Currency is required",
  }),
  currency_name: Joi.string().required().messages({
    "string.base": "Currency name must be a string",
    "any.required": "Currency name is required",
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
    "any.required": "Price is required",
  }),
  price_pro: Joi.number().min(0).optional().default(0).messages({
    "number.base": "Pro price must be a number",
    "number.min": "Pro price must be at least 0",
  }),
  stock_quantity: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock quantity must be a number",
    "number.integer": "Stock quantity must be an integer",
    "number.min": "Stock quantity must be at least 0",
    "any.required": "Stock quantity is required",
  }),
  image_url: Joi.string().uri().optional().allow(null, "").messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be a valid URI",
  }),
  secure: Joi.boolean().optional().default(false).messages({
    "boolean.base": "Secure must be a boolean value",
  }),
  is_for_pro: Joi.boolean().optional().default(false).messages({
    "boolean.base": "is_for_pro must be a boolean value",
  }),
  service_id: Joi.number().integer().required().messages({
    "number.base": "Service ID must be a number",
    "number.integer": "Service ID must be an integer",
    "any.required": "Service ID is required",
  }),
  category_id: Joi.number().integer().required().messages({
    "number.base": "Category ID must be a number",
    "number.integer": "Category ID must be an integer",
    "any.required": "Category ID is required",
  }),

  min_commande_standard: minCommandeSchema.optional().messages({
    "object.base": "min_commande_standard must be an object",
  }),
  min_commande_prof: minCommandeSchema.optional().messages({
    "object.base": "min_commande_prof must be an object",
  }),
});

exports.updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(200).optional().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 200 characters",
  }),
  description: Joi.string().optional().allow(null, "").messages({
    "string.base": "Description must be a string",
  }),
  descriptionRich: Joi.string().optional().allow(null, "").messages({
    "string.base": "Rich description must be a string",
  }),
  currency: Joi.string().optional().messages({
    "string.base": "Currency must be a string",
  }),
  currency_name: Joi.string().optional().messages({
    "string.base": "Currency name must be a string",
  }),
  price: Joi.number().positive().optional().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive number",
  }),
  price_pro: Joi.number().min(0).optional().messages({
    "number.base": "Pro price must be a number",
    "number.min": "Pro price must be at least 0",
  }),
  stock_quantity: Joi.number().integer().min(0).optional().messages({
    "number.base": "Stock quantity must be a number",
    "number.integer": "Stock quantity must be an integer",
    "number.min": "Stock quantity must be at least 0",
  }),
  image_url: Joi.string().uri().optional().allow(null, "").messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be a valid URI",
  }),
  secure: Joi.boolean().optional().messages({
    "boolean.base": "Secure must be a boolean value",
  }),
  is_for_pro: Joi.boolean().optional().messages({
    "boolean.base": "is_for_pro must be a boolean value",
  }),
  service_id: Joi.number().integer().optional().messages({
    "number.base": "Service ID must be a number",
    "number.integer": "Service ID must be an integer",
  }),
  category_id: Joi.number().integer().optional().messages({
    "number.base": "Category ID must be a number",
    "number.integer": "Category ID must be an integer",
  }),
  is_active: Joi.boolean().optional().messages({
    "boolean.base": "is_active must be a boolean value",
  }),

  min_commande_standard: minCommandeSchema.optional().messages({
    "object.base": "min_commande_standard must be an object",
  }),
  min_commande_prof: minCommandeSchema.optional().messages({
    "object.base": "min_commande_prof must be an object",
  }),
});
