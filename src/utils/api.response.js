/**
 * Helper function to format API responses.
 * @param {string} message - The message describing the outcome.
 * @param {object} [data] - Optional data to include in the response.
 * @returns {object} Formatted API response object.
 */
const createResponse = (message, data = null) => {
    const response = {
        message,
    };

    if (data) {
        response.data = data;
    }

    return response;
};
module.exports = createResponse;