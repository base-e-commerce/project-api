const Joi = require("joi");

const OFFER_TYPES = ["prestation", "embauche"];
const STATUS_VALUES = [
  "pending",
  "reviewed",
  "contacted",
  "qualified",
  "hired",
  "archived",
];

const optionalStringField = (max = 190) =>
  Joi.string().trim().max(max).allow(null, "");

const optionalUrlField = () =>
  Joi.string()
    .uri()
    .max(250)
    .allow(null, "")
    .messages({
      "string.uri": "Le lien doit être une URL valide",
    });

exports.createRecruitmentApplicationSchema = Joi.object({
  full_name: Joi.string().trim().min(2).max(190).required().messages({
    "string.empty": "Le nom complet est obligatoire",
    "any.required": "Le nom complet est obligatoire",
  }),
  email: Joi.string().email().required().messages({
    "string.email": "Email invalide",
    "any.required": "Email obligatoire",
  }),
  phone: optionalStringField(),
  company: optionalStringField(),
  offer_type: Joi.string()
    .valid(...OFFER_TYPES)
    .required()
    .messages({
      "any.only": "Le type doit être prestation ou embauche",
      "any.required": "Le type d'offre est obligatoire",
    }),
  offer_title: optionalStringField(),
  speciality: optionalStringField(),
  experience_years: Joi.number().integer().min(0).max(60).optional().messages({
    "number.base": "Les années d'expérience doivent être un nombre",
    "number.min": "Les années d'expérience doivent être positives",
  }),
  availability: optionalStringField(),
  work_mode: optionalStringField(),
  country: optionalStringField(),
  city: optionalStringField(),
  budget_range: optionalStringField(),
  skills: optionalStringField(2000),
  message: optionalStringField(4000),
  linkedin_url: optionalUrlField(),
  website_url: optionalUrlField(),
  cv_url: optionalStringField(500),
}).options({ stripUnknown: true });

exports.updateRecruitmentStatusSchema = Joi.object({
  status: Joi.string()
    .valid(...STATUS_VALUES)
    .required()
    .messages({
      "any.only": "Statut invalide",
      "any.required": "Le statut est obligatoire",
    }),
}).options({ stripUnknown: true });

exports.RECRUITMENT_STATUS = STATUS_VALUES;
exports.RECRUITMENT_OFFER_TYPES = OFFER_TYPES;
