const Joi = require("joi");

const positiveInteger = Joi.number()
  .integer()
  .positive()
  .messages({
    "number.base": "Value must be a number",
    "number.integer": "Value must be an integer",
    "number.positive": "Value must be positive",
  });

const positiveNumber = Joi.number()
  .positive()
  .messages({
    "number.base": "Value must be a number",
    "number.positive": "Value must be positive",
  });

const statusSchema = Joi.string()
  .trim()
  .min(1)
  .max(50)
  .messages({
    "string.base": "Status must be a string",
    "string.empty": "Status cannot be empty",
    "string.min": "Status must have at least 1 character",
    "string.max": "Status must not exceed 50 characters",
  });

exports.createCommandBoxSchema = Joi.object({
  commande_id: positiveInteger.required(),
  box_id: positiveInteger.required(),
  quantity: positiveInteger.optional(),
  unit_price: positiveNumber.required(),
  status: statusSchema.optional(),
}).messages({
  "any.required": "Missing required command box field",
});

exports.updateCommandBoxSchema = Joi.object({
  commande_id: positiveInteger.optional(),
  box_id: positiveInteger.optional(),
  quantity: positiveInteger.optional(),
  unit_price: positiveNumber.optional(),
  status: statusSchema.optional(),
})
  .or("commande_id", "box_id", "quantity", "unit_price")
  .messages({
    "object.missing": "Provide at least one field to update",
  });
