const createResponse = require("../utils/api.response");
const validateDto = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errorMessages = error.details.map((detail) => detail.message);
    return res
      .status(400)
      .json(createResponse("Validation failed", errorMessages, false));
  }

  req.body = value;
  next();
};

module.exports = { validateDto };
