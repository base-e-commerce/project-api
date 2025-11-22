const brevoService = require("./brevo.service");

class CustomerOnboardingService {
  async sendWelcomeEmail(customer, options = {}) {
    if (!customer || !customer.email) {
      return;
    }

    const { params = {} } = options;
    const phone = customer.phone || customer.phone_number;

    const firstName =
      customer.first_name ?? customer.firstName ?? customer.first ?? "";
    const lastName =
      customer.last_name ?? customer.lastName ?? customer.last ?? "";

    const mergedParams = {
      ...(phone && params.PHONE === undefined ? { PHONE: phone } : {}),
      ...params,
    };

    try {
      await brevoService.sendCustomerWelcomeEmail({
        email: customer.email,
        firstName,
        lastName,
        params: mergedParams,
      });
    } catch (error) {
      console.error(
        "[CustomerOnboarding] Failed to send welcome email:",
        error.message
      );
    }
  }
}

module.exports = new CustomerOnboardingService();
