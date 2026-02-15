const Joi = require("joi");

const statusValues = ["PENDING", "PRICED", "APPROVED", "REJECTED"];

exports.createDemandeMachineSchema = Joi.object({
  description: Joi.string().trim().min(3).max(5000).required().messages({
    "string.base": "Description must be a string",
    "string.empty": "Description is required",
    "string.min": "Description must contain at least 3 characters",
    "string.max": "Description must not exceed 5000 characters",
    "any.required": "Description is required",
  }),
  image: Joi.string().trim().optional().messages({
    "string.base": "Image must be a string",
    "string.empty": "Image is required",
  }),
  imageUrls: Joi.array().items(Joi.string().trim()).min(1).optional().messages({
    "array.base": "Image URLs must be an array",
    "array.min": "At least one image is required",
  }),
}).or("image", "imageUrls");

exports.updateDemandeMachineAdminSchema = Joi.object({
  price: Joi.number().min(0).allow(null).messages({
    "number.base": "Price must be a number",
    "number.min": "Price cannot be negative",
  }),
  status: Joi.string()
    .valid(...statusValues)
    .messages({
      "string.base": "Status must be a string",
      "any.only": `Status must be one of: ${statusValues.join(", ")}`,
    }),
}).or("price", "status");
