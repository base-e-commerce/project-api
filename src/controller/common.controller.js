const createResponse = require("../utils/api.response");
const commonService = require("../services/common.service");

exports.getAllNewLetter = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json(createResponse("Invalid page or limit parameter", false));
    }

    const contactInfoData = await commonService.getAllNewLetter(
      Number(page),
      Number(limit)
    );
    res
      .status(200)
      .json(
        createResponse("News letter fetched successfully", contactInfoData)
      );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getAllContactInfo = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    if (isNaN(page) || isNaN(limit) || page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json(createResponse("Invalid page or limit parameter", false));
    }

    const contactInfoData = await commonService.getAllContactInfo(
      Number(page),
      Number(limit)
    );
    res
      .status(200)
      .json(
        createResponse("Contact info fetched successfully", contactInfoData)
      );
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.getGlobalStat = async (req, res) => {
  try {
    const product = await commonService.getCountProducts();
    const customer = await commonService.getCountCustomers();
    resultData = {
      product: product,
      customer: customer,
    };
    res.status(200).json(createResponse("Stat is here", resultData));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.createNewsLetter = async (req, res) => {
  const { email } = req.body;
  try {
    const newData = await commonService.createNewsLetter({
      email,
    });
    res
      .status(201)
      .json(createResponse("NewsLetter created successfully", newData));
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

exports.patchContactInfo = async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, subject, message, seen } = req.body;

  if (!name && !email && !phone && !subject && !message && !seen) {
    return res
      .status(400)
      .json(createResponse("No fields provided to update", null, false));
  }

  try {
    const updatedContact = await commonService.updateContactInfo(id, {
      name,
      email,
      phone,
      subject,
      seen,
      message,
    });

    res
      .status(200)
      .json(createResponse("ContactInfo updated successfully", updatedContact));
  } catch (error) {
    res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
