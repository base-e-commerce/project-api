const createResponse = require("../utils/api.response");
const commonService = require("../services/common.service");

exports.getAllContactInfo = async (req, res) => {
  try {
    const contactInfo = await commonService.getAllContactInfo();
    res
      .status(200)
      .json(createResponse("ContactInfo fetched successfully", contactInfo));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createContactInfo = async (req, res) => {
  const { name, email, phone, subject, message } = req.body;
  try {
    const newRole = await commonService.createContactInfo({
      name,
      email,
      phone,
      subject,
      message,
    });
    res
      .status(201)
      .json(createResponse("ContactInfo created successfully", newRole));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
