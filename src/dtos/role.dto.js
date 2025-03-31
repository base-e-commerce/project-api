const Joi = require("joi");

exports.createRoleSchema = Joi.object({
  name: Joi.string().min(3).max(50).required().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 50 characters",
    "any.required": "Name is required",
  }),
});

exports.updateRoleSchema = Joi.object({
  name: Joi.string().min(3).max(50).optional().messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 50 characters",
  }),
});
