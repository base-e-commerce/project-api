const Joi = require("joi");

exports.createProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 100 characters",
    "any.required": "Name is required",
  }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  descriptionRich: Joi.string().optional().messages({
    "string.base": "Description Rich must be a string",
  }),
  currency: Joi.string().messages({
    "string.base": "Description must be a string",
  }),
  currency_name: Joi.string().messages({
    "string.base": "Description must be a string",
  }),
  is_for_pro: Joi.boolean().optional().messages({
    "boolean.base": "Is Price Pro must be a boolean value",
  }),
  price: Joi.number().precision(2).greater(0).required().messages({
    "number.base": "Price must be a number",
    "number.greater": "Price must be greater than 0",
    "any.required": "Price is required",
  }),
  price_pro: Joi.number().precision(2).greater(0).optional().messages({
    "number.base": "Price Pro must be a number",
    "number.greater": "Price Pro must be greater than 0",
  }),
  stock_quantity: Joi.number().integer().min(0).required().messages({
    "number.base": "Stock quantity must be a number",
    "number.integer": "Stock quantity must be an integer",
    "number.min": "Stock quantity cannot be negative",
    "any.required": "Stock quantity is required",
  }),
  image_url: Joi.string().uri().optional().messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be a valid URI",
  }),
  category_id: Joi.number().integer().required().messages({
    "number.base": "Category ID must be a number",
    "number.integer": "Category ID must be an integer",
    "any.required": "Category ID is required",
  }),
  service_id: Joi.number().integer().required().messages({
    "number.base": "Service ID must be a number",
    "number.integer": "Service ID must be an integer",
    "any.required": "Service ID is required",
  }),
  is_active: Joi.boolean().optional().messages({
    "boolean.base": "Is active must be a boolean value",
  }),
});

exports.updateProductSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 100 characters",
  }),
  description: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  descriptionRich: Joi.string().optional().messages({
    "string.base": "Description Rich must be a string",
  }),
  currency: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  currency_name: Joi.string().optional().messages({
    "string.base": "Description must be a string",
  }),
  is_for_pro: Joi.boolean().optional().messages({
    "boolean.base": "Is Price Pro must be a boolean value",
  }),
  price: Joi.number().precision(2).greater(0).optional().messages({
    "number.base": "Price must be a number",
    "number.greater": "Price must be greater than 0",
  }),
  price_pro: Joi.number().precision(2).greater(0).optional().messages({
    "number.base": "Price Pro must be a number",
    "number.greater": "Price Pro must be greater than 0",
  }),
  stock_quantity: Joi.number().integer().min(0).optional().messages({
    "number.base": "Stock quantity must be a number",
    "number.integer": "Stock quantity must be an integer",
    "number.min": "Stock quantity cannot be negative",
  }),
  image_url: Joi.string().uri().optional().messages({
    "string.base": "Image URL must be a string",
    "string.uri": "Image URL must be a valid URI",
  }),
  category_id: Joi.number().integer().optional().messages({
    "number.base": "Category ID must be a number",
    "number.integer": "Category ID must be an integer",
  }),
  service_id: Joi.number().integer().optional().messages({
    "number.base": "Service ID must be a number",
    "number.integer": "Service ID must be an integer",
  }),
  is_active: Joi.boolean().optional().messages({
    "boolean.base": "Is active must be a boolean value",
  }),
});
