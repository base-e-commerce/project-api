const prisma = require("../database/database");

class ReviewService {
  async createReview(data) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newReview = await prisma.review.create({
          data: {
            product_id: data.product_id,
            customer_id: data.customer_id,
            rating: data.rating,
          },
        });
        return newReview;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the review: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllReviews() {
    try {
      const reviews = await prisma.review.findMany();
      return reviews;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving reviews: ${error.message}`
      );
    }
  }

  async getReviewById(reviewId) {
    try {
      const review = await prisma.review.findUnique({
        where: { review_id: reviewId },
      });
      return review;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the review: ${error.message}`
      );
    }
  }

  async getReviewsByProductId(productId) {
    try {
      const reviews = await prisma.review.findMany({
        where: { product_id: productId },
      });
      return reviews;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving reviews for the product: ${error.message}`
      );
    }
  }

  async getReviewsByCustomerId(customerId) {
    try {
      const reviews = await prisma.review.findMany({
        where: { customer_id: customerId },
      });
      return reviews;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving reviews for the customer: ${error.message}`
      );
    }
  }

  async updateReview(reviewId, data) {
    try {
      const updatedReview = await prisma.review.update({
        where: { review_id: reviewId },
        data: {
          rating: data.rating,
        },
      });
      return updatedReview;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the review: ${error.message}`
      );
    }
  }

  async deleteReview(reviewId) {
    try {
      const deletedReview = await prisma.review.delete({
        where: { review_id: reviewId },
      });
      return deletedReview;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the review: ${error.message}`
      );
    }
  }
}

module.exports = new ReviewService();
