const createResponse = require("../utils/api.response");
const supportService = require("../services/support.service");

const parsePaginationParams = (query) => {
  const page =
    query.page === undefined || query.page === null
      ? 1
      : Number(query.page);
  const limit =
    query.limit === undefined || query.limit === null
      ? 10
      : Number(query.limit);

  if (
    Number.isNaN(page) ||
    Number.isNaN(limit) ||
    page <= 0 ||
    limit <= 0
  ) {
    throw Object.assign(new Error("Invalid pagination parameters"), {
      statusCode: 400,
    });
  }

  return { page, limit };
};

const parseTicketId = (ticketIdParam) => {
  const ticketId = Number(ticketIdParam);
  if (Number.isNaN(ticketId) || ticketId <= 0) {
    throw Object.assign(new Error("Invalid ticket id"), { statusCode: 400 });
  }
  return ticketId;
};

const handleError = (res, error, fallbackMessage = "Internal server error") => {
  const statusCode = error.statusCode || 500;
  const message = error.statusCode ? error.message : fallbackMessage;
  return res
    .status(statusCode)
    .json(createResponse(message, error.details ?? null, false));
};

const validateMessagePayload = (content, files = []) => {
  const hasContent = typeof content === "string" && content.trim().length > 0;
  const hasFiles = Array.isArray(files) && files.length > 0;
  if (!hasContent && !hasFiles) {
    throw Object.assign(
      new Error("Un message ou au moins une piece jointe est requis"),
      { statusCode: 400 }
    );
  }
};

exports.createTicket = async (req, res) => {
  try {
    const { subject, content } = req.body;
    const customerId = req.customer.customer_id;
    const attachments = req.files ?? [];
    validateMessagePayload(content, attachments);

    const { ticket, message } = await supportService.createTicket({
      customerId,
      subject,
      content,
      attachments,
    });

    return res.status(201).json(
      createResponse("Support ticket created successfully", {
        ticket,
        firstMessage: message,
      })
    );
  } catch (error) {
    return handleError(res, error, "Unable to create support ticket");
  }
};

exports.listCustomerTickets = async (req, res) => {
  try {
    const pagination = parsePaginationParams(req.query);
    const customerId = req.customer.customer_id;

    const data = await supportService.listCustomerTickets({
      customerId,
      ...pagination,
    });

    return res
      .status(200)
      .json(createResponse("Support tickets fetched successfully", data));
  } catch (error) {
    return handleError(res, error, "Unable to fetch support tickets");
  }
};

exports.getCustomerTicket = async (req, res) => {
  try {
    const ticketId = parseTicketId(req.params.ticketId);
    const customerId = req.customer.customer_id;

    const ticket = await supportService.getCustomerTicket(ticketId, customerId);

    return res
      .status(200)
      .json(createResponse("Support ticket fetched successfully", ticket));
  } catch (error) {
    return handleError(res, error, "Unable to fetch support ticket");
  }
};

exports.listCustomerMessages = async (req, res) => {
  try {
    const ticketId = parseTicketId(req.params.ticketId);
    const customerId = req.customer.customer_id;
    await supportService.getCustomerTicket(ticketId, customerId);

    const pagination = parsePaginationParams(req.query);
    const data = await supportService.listMessages(ticketId, pagination);

    return res
      .status(200)
      .json(createResponse("Messages fetched successfully", data));
  } catch (error) {
    return handleError(res, error, "Unable to fetch messages");
  }
};

exports.createCustomerMessage = async (req, res) => {
  try {
    const ticketId = parseTicketId(req.params.ticketId);
    const customerId = req.customer.customer_id;
    await supportService.getCustomerTicket(ticketId, customerId);

    const { content } = req.body;
    const attachments = req.files ?? [];
    validateMessagePayload(content, attachments);
    const message = await supportService.createMessage({
      ticketId,
      senderType: "CUSTOMER",
      content,
      customerId,
      attachments,
    });

    return res
      .status(201)
      .json(createResponse("Message envoyé avec succès", message));
  } catch (error) {
    return handleError(res, error, "Unable to send message");
  }
};

exports.closeCustomerTicket = async (req, res) => {
  try {
    const ticketId = parseTicketId(req.params.ticketId);
    const customerId = req.customer.customer_id;

    const ticket = await supportService.closeCustomerTicket(
      ticketId,
      customerId
    );

    return res
      .status(200)
      .json(createResponse("Ticket cloture avec succes", ticket));
  } catch (error) {
    return handleError(res, error, "Unable to close support ticket");
  }
};

exports.listAdminTickets = async (req, res) => {
  try {
    const pagination = parsePaginationParams(req.query);
    const { status } = req.query;

    const data = await supportService.listAdminTickets({
      ...pagination,
      status,
    });

    return res
      .status(200)
      .json(createResponse("Support tickets fetched successfully", data));
  } catch (error) {
    return handleError(res, error, "Unable to fetch support tickets");
  }
};

exports.getAdminTicket = async (req, res) => {
  try {
    const ticketId = parseTicketId(req.params.ticketId);
    const ticket = await supportService.getAdminTicket(ticketId);

    return res
      .status(200)
      .json(createResponse("Support ticket fetched successfully", ticket));
  } catch (error) {
    return handleError(res, error, "Unable to fetch support ticket");
  }
};

exports.listAdminMessages = async (req, res) => {
  try {
    const ticketId = parseTicketId(req.params.ticketId);
    await supportService.getAdminTicket(ticketId);

    const pagination = parsePaginationParams(req.query);
    const data = await supportService.listMessages(ticketId, pagination);

    return res
      .status(200)
      .json(createResponse("Messages fetched successfully", data));
  } catch (error) {
    return handleError(res, error, "Unable to fetch messages");
  }
};

exports.createAdminMessage = async (req, res) => {
  try {
    const ticketId = parseTicketId(req.params.ticketId);
    const adminId = req.user.userId;
    await supportService.getAdminTicket(ticketId);

    const { content } = req.body;
    const attachments = req.files ?? [];
    validateMessagePayload(content, attachments);
    const message = await supportService.createMessage({
      ticketId,
      senderType: "ADMIN",
      content,
      adminId,
      attachments,
    });

    return res
      .status(201)
      .json(createResponse("Message envoyé avec succès", message));
  } catch (error) {
    return handleError(res, error, "Unable to send message");
  }
};

exports.updateTicketStatus = async (req, res) => {
  try {
    const ticketId = parseTicketId(req.params.ticketId);
    const adminId = req.user.userId;
    const { status } = req.body;

    const ticket = await supportService.updateTicketStatus(
      ticketId,
      status,
      adminId
    );

    return res
      .status(200)
      .json(createResponse("Ticket mis à jour avec succès", ticket));
  } catch (error) {
    return handleError(res, error, "Unable to update support ticket");
  }
};
