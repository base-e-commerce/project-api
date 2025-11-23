const Joi = require("joi");

const createTicketSchema = Joi.object({
  subject: Joi.string().allow("", null).max(190).optional(),
  content: Joi.string().min(1).max(2000).required(),
});

const supportMessageSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
});

const updateTicketStatusSchema = Joi.object({
  status: Joi.string()
    .valid("open", "waiting-admin", "answered", "closed")
    .required(),
});

module.exports = {
  createTicketSchema,
  supportMessageSchema,
  updateTicketStatusSchema,
};
