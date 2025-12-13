const Joi = require("joi");

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const nullableString = Joi.string().allow(null, "").optional();
const nullableUri = Joi.string().uri().allow(null, "").optional();

const metadataFields = {
  slug: nullableString
    .pattern(slugPattern)
    .max(160)
    .messages({
      "string.pattern.base":
        "Slug must only contain lowercase letters, numbers and dashes",
    }),
  meta_title: nullableString.max(70),
  meta_description: nullableString.max(320),
  meta_keywords: nullableString.max(512),
  meta_image_url: nullableUri,
  schema_markup: Joi.alternatives()
    .try(Joi.object(), Joi.string())
    .optional()
    .allow(null, ""),
};

const baseFields = {
  name: Joi.string().min(3).max(100).messages({
    "string.base": "Name must be a string",
    "string.empty": "Name cannot be empty",
    "string.min": "Name must have at least 3 characters",
    "string.max": "Name must not exceed 100 characters",
  }),
  description: nullableString.max(255).messages({
    "string.base": "Description must be a string",
    "string.max": "Description must not exceed 255 characters",
  }),
  secure: Joi.boolean().optional().messages({
    "boolean.base": "secure must be a boolean value",
  }),
  service_id: Joi.number().integer().messages({
    "number.base": "Service ID must be a number",
    "number.integer": "Service ID must be an integer",
  }),
};

exports.createCategorySchema = Joi.object({
  ...baseFields,
  ...metadataFields,
}).fork(["name", "service_id"], (schema) => schema.required());

exports.updateCategorySchema = Joi.object({
  ...baseFields,
  ...metadataFields,
});
