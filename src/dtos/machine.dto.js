const Joi = require("joi");

const imageArraySchema = Joi.array()
  .items(Joi.string().trim().min(1))
  .optional()
  .messages({
    "array.base": "imageUrls must be an array of image paths",
    "string.base": "Each image path must be a string",
  });

const baseSchema = {
  name: Joi.string().min(3).max(200).messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 200 characters",
  }),
  slug: Joi.string().min(2).max(200).optional().allow(null, "").messages({
    "string.base": "Slug must be a string",
    "string.min": "Slug must have at least 2 characters",
    "string.max": "Slug must not exceed 200 characters",
  }),
  description: Joi.string().optional().allow(null, "").messages({
    "string.base": "Description must be a string",
  }),
  descriptionRich: Joi.string().optional().allow(null, "").messages({
    "string.base": "Rich description must be a string",
  }),
  price: Joi.number().positive().messages({
    "number.base": "Price must be a number",
    "number.positive": "Price must be a positive value",
  }),
  currency: Joi.string().trim().min(1).max(10).optional().allow(null, "").messages({
    "string.base": "Currency must be a string",
    "string.min": "Currency must contain at least one character",
    "string.max": "Currency must not exceed 10 characters",
  }),
  cover: Joi.string().optional().allow(null, "").messages({
    "string.base": "Cover path must be a string",
  }),
  imageUrls: imageArraySchema,
  is_active: Joi.boolean().optional().messages({
    "boolean.base": "is_active must be a boolean",
  }),
};

exports.createMachineSchema = Joi.object({
  ...baseSchema,
  name: baseSchema.name.required(),
  price: baseSchema.price.required(),
}).messages({
  "any.required": "Missing required machine payload field",
});

exports.updateMachineSchema = Joi.object({
  ...baseSchema,
}).min(1).messages({
  "object.min": "Provide at least one field to update",
});
