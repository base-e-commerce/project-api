const prisma = require("../database/database");

const buildHttpError = (message, statusCode = 500) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const normalizeString = (value) => {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const normalizeEmail = (value) => {
  const normalized = normalizeString(value);
  return normalized ? normalized.toLowerCase() : null;
};

class RecruitmentService {
  async createApplication(payload) {
    const data = {
      offer_type: normalizeString(payload.offer_type)?.toLowerCase(),
      offer_title: normalizeString(payload.offer_title),
      full_name: normalizeString(payload.full_name),
      email: normalizeEmail(payload.email),
      phone: normalizeString(payload.phone),
      company: normalizeString(payload.company),
      speciality: normalizeString(payload.speciality),
      experience_years:
        typeof payload.experience_years === "number"
          ? payload.experience_years
          : null,
      availability: normalizeString(payload.availability),
      work_mode: normalizeString(payload.work_mode),
      country: normalizeString(payload.country),
      city: normalizeString(payload.city),
      budget_range: normalizeString(payload.budget_range),
      skills: normalizeString(payload.skills),
      message: normalizeString(payload.message),
      linkedin_url: normalizeString(payload.linkedin_url),
      website_url: normalizeString(payload.website_url),
      cv_url: normalizeString(payload.cv_url),
    };

    const existingCount = await prisma.recruitmentApplication.count({
      where: {
        email: data.email,
        offer_type: data.offer_type,
      },
    });

    if (existingCount >= 2) {
      throw buildHttpError(
        'Vous avez déjà soumis deux demandes pour ce type d’offre avec cet email.',
        400
      );
    }

    return prisma.recruitmentApplication.create({
      data,
    });
  }

  async listApplications({
    page = 1,
    limit = 20,
    offerType,
    status,
    search,
  }) {
    const parsedPage = Number.isFinite(Number(page)) ? Number(page) : 1;
    const parsedLimit = Number.isFinite(Number(limit)) ? Number(limit) : 20;

    const safePage = parsedPage > 0 ? parsedPage : 1;
    const safeLimit = parsedLimit > 0 ? Math.min(parsedLimit, 100) : 20;

    const filters = [];

    const normalizedStatus = normalizeString(status)?.toLowerCase();
    if (normalizedStatus) {
      filters.push({ status: normalizedStatus });
    }

    const normalizedOfferType = normalizeString(offerType)?.toLowerCase();
    if (normalizedOfferType) {
      filters.push({ offer_type: normalizedOfferType });
    }

    const searchTerm = normalizeString(search);
    if (searchTerm) {
      filters.push({
        OR: [
          { full_name: { contains: searchTerm, mode: "insensitive" } },
          { email: { contains: searchTerm, mode: "insensitive" } },
          { offer_title: { contains: searchTerm, mode: "insensitive" } },
          { speciality: { contains: searchTerm, mode: "insensitive" } },
          { company: { contains: searchTerm, mode: "insensitive" } },
        ],
      });
    }

    const where = filters.length ? { AND: filters } : undefined;
    const skip = (safePage - 1) * safeLimit;

    const [applications, total] = await prisma.$transaction([
      prisma.recruitmentApplication.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: safeLimit,
      }),
      prisma.recruitmentApplication.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page: safePage,
        limit: safeLimit,
        total,
        totalPages: total === 0 ? 0 : Math.ceil(total / safeLimit),
      },
    };
  }

  async getApplicationById(id) {
    const application = await prisma.recruitmentApplication.findUnique({
      where: { recruitment_id: id },
    });

    if (!application) {
      throw buildHttpError("Candidature introuvable", 404);
    }

    return application;
  }

  async updateStatus(id, status) {
    await this.getApplicationById(id);

    return prisma.recruitmentApplication.update({
      where: { recruitment_id: id },
      data: {
        status: normalizeString(status)?.toLowerCase(),
      },
    });
  }

  async getSummary() {
    const [total, statusCounts, offerTypeCounts] = await Promise.all([
      prisma.recruitmentApplication.count(),
      prisma.recruitmentApplication.groupBy({
        by: ["status"],
        _count: { _all: true },
      }),
      prisma.recruitmentApplication.groupBy({
        by: ["offer_type"],
        _count: { _all: true },
      }),
    ]);

    const mapCounts = (collection, key) =>
      collection.reduce((acc, item) => {
        acc[item[key]] = item._count._all;
        return acc;
      }, {});

    return {
      total,
      byStatus: mapCounts(statusCounts, "status"),
      byOfferType: mapCounts(offerTypeCounts, "offer_type"),
    };
  }
}

module.exports = new RecruitmentService();
