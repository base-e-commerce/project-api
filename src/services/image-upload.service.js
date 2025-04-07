const prisma = require("../database/database");

class ImageUploadService {
  async uploadMultipleImage(data) {
    const db = prisma;
  

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const newImageFile = await prisma.productImage.create({
          data: {
            product_id: data.product_id,
            image_url: data.image_url
          },
        });
        return newImageFile;
      } catch (error) {
        throw new Error(
            `Error occurred while uploading the image: ${error.message}`
          );
      }
    });
    return transaction;
  }
}
module.exports=new ImageUploadService();