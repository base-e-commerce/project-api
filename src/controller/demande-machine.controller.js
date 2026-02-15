const createResponse = require("../utils/api.response");
const demandeMachineService = require("../services/demande-machine.service");

const parsePagination = (query, defaultLimit) => {
  const page = query.page ? Number(query.page) : 1;
  const limit = query.limit ? Number(query.limit) : defaultLimit;
  return { page, limit };
};

exports.uploadDemandeMachineImage = async (req, res) => {
  try {
    if (!req.files || !req.files.length) {
      return res
        .status(400)
        .json(createResponse("At least one file is required", null, false));
    }

    const urls = req.files.map((file) =>
      demandeMachineService.buildAssetUrl(file.filename)
    );
    return res
      .status(200)
      .json(
        createResponse("Machine request images uploaded successfully", {
          urls,
        })
      );
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Error while performing upload", error.message, false));
  }
};

exports.createDemandeMachine = async (req, res) => {
  try {
    const customerId = req.customer?.customer_id;
    if (!customerId) {
      return res.status(401).json(createResponse("Unauthorized", null, false));
    }

    const demande = await demandeMachineService.createDemandeMachine({
      customerId,
      description: req.body.description,
      image: req.body.image,
      imageUrls: req.body.imageUrls,
    });

    return res
      .status(201)
      .json(createResponse("Machine request created successfully", demande));
  } catch (error) {
    if (error.message === "At least one image is required") {
      return res.status(400).json(createResponse(error.message, null, false));
    }
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.listCustomerDemandeMachines = async (req, res) => {
  try {
    const customerId = req.customer?.customer_id;
    if (!customerId) {
      return res.status(401).json(createResponse("Unauthorized", null, false));
    }
    const { page, limit } = parsePagination(req.query, 10);

    const payload = await demandeMachineService.listCustomerDemandes({
      customerId,
      page,
      limit,
    });
    return res
      .status(200)
      .json(createResponse("Machine requests fetched successfully", payload));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.listAdminDemandeMachines = async (req, res) => {
  try {
    const { page, limit } = parsePagination(req.query, 20);
    const status = req.query.status
      ? String(req.query.status).toUpperCase()
      : undefined;

    const payload = await demandeMachineService.listAdminDemandes({
      page,
      limit,
      status,
    });
    return res
      .status(200)
      .json(createResponse("Machine requests fetched successfully", payload));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};

exports.updateDemandeMachineByAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await demandeMachineService.updateDemandeMachineAdmin(id, {
      price: req.body.price,
      status: req.body.status,
    });

    if (!updated) {
      return res
        .status(404)
        .json(createResponse("Machine request not found", null, false));
    }
    return res
      .status(200)
      .json(createResponse("Machine request updated successfully", updated));
  } catch (error) {
    return res
      .status(500)
      .json(createResponse("Internal server error", error.message, false));
  }
};
