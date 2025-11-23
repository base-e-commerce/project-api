const prisma = require("../database/database");

const buildHttpError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class SupportService {
  async createTicket({ customerId, subject, content }) {
    if (!customerId) {
      throw buildHttpError("Customer is required to create a ticket", 400);
    }

    const sanitizedSubject = subject?.trim() || null;
    const sanitizedContent = content.trim();

    const result = await prisma.$transaction(async (tx) => {
      const ticket = await tx.supportTicket.create({
        data: {
          customer_id: customerId,
          subject: sanitizedSubject,
          status: "waiting-admin",
          last_message_snippet: sanitizedContent.slice(0, 250),
        },
      });

      const message = await tx.supportMessage.create({
        data: {
          ticket_id: ticket.ticket_id,
          sender: "CUSTOMER",
          content: sanitizedContent,
          customer_id: customerId,
        },
      });

      const hydratedTicket = await tx.supportTicket.findUnique({
        where: { ticket_id: ticket.ticket_id },
        include: {
          customer: true,
          assigned_admin: {
            select: { user_id: true, username: true, email: true },
          },
        },
      });

      return { ticket: hydratedTicket, message };
    });

    return result;
  }

  async listCustomerTickets({ customerId, page = 1, limit = 10 }) {
    const skip = (page - 1) * limit;
    const [tickets, total] = await prisma.$transaction([
      prisma.supportTicket.findMany({
        where: { customer_id: customerId },
        orderBy: { last_message_at: "desc" },
        skip,
        take: limit,
        include: {
          assigned_admin: {
            select: { user_id: true, username: true, email: true },
          },
        },
      }),
      prisma.supportTicket.count({
        where: { customer_id: customerId },
      }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async listAdminTickets({ page = 1, limit = 10, status }) {
    const skip = (page - 1) * limit;
    const normalizedStatus = status?.trim();
    const where = normalizedStatus ? { status: normalizedStatus } : {};

    const [tickets, total] = await prisma.$transaction([
      prisma.supportTicket.findMany({
        where,
        orderBy: { last_message_at: "desc" },
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              customer_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          assigned_admin: {
            select: { user_id: true, username: true, email: true },
          },
        },
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return {
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async getCustomerTicket(ticketId, customerId) {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        ticket_id: ticketId,
        customer_id: customerId,
      },
      include: {
        assigned_admin: {
          select: { user_id: true, username: true, email: true },
        },
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });

    if (!ticket) {
      throw buildHttpError("Support ticket not found", 404);
    }

    return ticket;
  }

  async getAdminTicket(ticketId) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { ticket_id: ticketId },
      include: {
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
        assigned_admin: {
          select: { user_id: true, username: true, email: true },
        },
      },
    });

    if (!ticket) {
      throw buildHttpError("Support ticket not found", 404);
    }

    return ticket;
  }

  async listMessages(ticketId, { page = 1, limit = 50 } = {}) {
    const skip = (page - 1) * limit;
    const [messages, total] = await prisma.$transaction([
      prisma.supportMessage.findMany({
        where: { ticket_id: ticketId },
        orderBy: { created_at: "asc" },
        skip,
        take: limit,
        include: {
          customer: {
            select: {
              customer_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          admin: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
        },
      }),
      prisma.supportMessage.count({ where: { ticket_id: ticketId } }),
    ]);

    return {
      messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  }

  async createMessage({ ticketId, senderType, content, customerId, adminId }) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { ticket_id: ticketId },
    });

    if (!ticket) {
      throw buildHttpError("Support ticket not found", 404);
    }

    if (senderType === "CUSTOMER" && ticket.customer_id !== customerId) {
      throw buildHttpError("Ticket does not belong to this customer", 403);
    }

    const trimmedContent = content.trim();

    const message = await prisma.$transaction(async (tx) => {
      const newMessage = await tx.supportMessage.create({
        data: {
          ticket_id: ticketId,
          sender: senderType,
          content: trimmedContent,
          customer_id: senderType === "CUSTOMER" ? customerId : null,
          admin_id: senderType === "ADMIN" ? adminId : null,
        },
      });

      await tx.supportTicket.update({
        where: { ticket_id: ticketId },
        data: {
          last_message_at: new Date(),
          last_message_snippet: trimmedContent.slice(0, 250),
          status: senderType === "CUSTOMER" ? "waiting-admin" : "answered",
          assigned_admin_id:
            senderType === "ADMIN"
              ? adminId ?? ticket.assigned_admin_id
              : ticket.assigned_admin_id,
        },
      });

      return tx.supportMessage.findUnique({
        where: { message_id: newMessage.message_id },
        include: {
          customer: {
            select: {
              customer_id: true,
              first_name: true,
              last_name: true,
              email: true,
            },
          },
          admin: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
        },
      });
    });

    return message;
  }

  async updateTicketStatus(ticketId, status, adminId) {
    const ticket = await prisma.supportTicket.findUnique({
      where: { ticket_id: ticketId },
    });

    if (!ticket) {
      throw buildHttpError("Support ticket not found", 404);
    }

    return prisma.supportTicket.update({
      where: { ticket_id: ticketId },
      data: {
        status,
        assigned_admin_id: adminId ?? ticket.assigned_admin_id,
      },
    });
  }

  async closeCustomerTicket(ticketId, customerId) {
    const ticket = await prisma.supportTicket.findFirst({
      where: {
        ticket_id: ticketId,
        customer_id: customerId,
      },
    });

    if (!ticket) {
      throw buildHttpError("Support ticket not found", 404);
    }

    if (ticket.status === "closed") {
      return ticket;
    }

    return prisma.supportTicket.update({
      where: { ticket_id: ticketId },
      data: {
        status: "closed",
        last_message_at: new Date(),
      },
      include: {
        assigned_admin: {
          select: { user_id: true, username: true, email: true },
        },
        customer: {
          select: {
            customer_id: true,
            first_name: true,
            last_name: true,
            email: true,
          },
        },
      },
    });
  }
}

module.exports = new SupportService();
