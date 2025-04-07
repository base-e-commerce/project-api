const Joi = require("joi");

const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional(),
  email: Joi.string().email().required(),
  phone: Joi.string().optional(),
  password: Joi.string()
    .min(8)
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d]{8,}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      "string.min": "Password must be at least 8 characters long.",
    }),
  role_id: Joi.number().integer().required(),
});

const updateUserSchema = Joi.object({
  username: Joi.string().min(3).max(30).optional(),
  phone: Joi.string().optional(),
  email: Joi.string().email().optional(),
  role_id: Joi.number().integer().optional(),
  last_login: Joi.date().optional(),
});

module.exports = {
  createUserSchema,
  updateUserSchema,
};
