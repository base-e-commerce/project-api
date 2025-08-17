const Joi = require("joi");

exports.createPackagingSchema = Joi.object({
  user_id: Joi.number().integer().optional().messages({
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
    "any.required": "User ID is required",
  }),
  email: Joi.string().email().required(),
  information: Joi.object().required().messages({
    "object.base": "Information must be a valid JSON object",
    "any.required": "Information is required",
  }),
});

exports.updatePackagingSchema = Joi.object({
  user_id: Joi.number().integer().optional().messages({
    "number.base": "User ID must be a number",
    "number.integer": "User ID must be an integer",
  }),
  email: Joi.string().email().optional(),
  information: Joi.object().optional().messages({
    "object.base": "Information must be a valid JSON object",
  }),
});
