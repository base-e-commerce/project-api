const Joi = require("joi");

exports.createCategorySchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 100 characters",
    "any.required": "Name is required",
  }),
  description: Joi.string().max(255).optional().allow(null, '').messages({
    "string.base": "Description must be a string",
    "string.max": "Description must not exceed 255 characters",
  }),
  service_id: Joi.number().integer().required().messages({
    "number.base": "Service ID must be a number",
    "number.integer": "Service ID must be an integer",
    "any.required": "Service ID is required",
  }),
});

exports.updateCategorySchema = Joi.object({
  name: Joi.string().min(3).max(100).optional().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 100 characters",
  }),
  description: Joi.string().max(255).optional().allow(null, '').messages({
    "string.base": "Description must be a string",
    "string.max": "Description must not exceed 255 characters",
  }),
  service_id: Joi.number().integer().optional().messages({
    "number.base": "Service ID must be a number",
    "number.integer": "Service ID must be an integer",
  }),
});
