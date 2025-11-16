const prisma = require("../database/database");

class BlogService {
  // Helper function to generate slug
  generateSlug(title) {
    return title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  async createBlog(data, authorId) {
    const db = prisma;

    const transaction = await db.$transaction(async (prisma) => {
      try {
        const slug = this.generateSlug(data.title);

        // Check if slug already exists
        let uniqueSlug = slug;
        let counter = 1;
        while (await prisma.blog.findUnique({ where: { slug: uniqueSlug } })) {
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }

        const newBlog = await prisma.blog.create({
          data: {
            title: data.title,
            slug: uniqueSlug,
            content: data.content,
            excerpt: data.excerpt,
            image_url: data.image_url,
            author_id: authorId,
            published_at: data.published_at || null,
          },
          include: {
            author: {
              select: {
                user_id: true,
                username: true,
                email: true,
              },
            },
          },
        });
        return newBlog;
      } catch (error) {
        throw new Error(
          `Error occurred while creating the blog: ${error.message}`
        );
      }
    });

    return transaction;
  }

  async getAllBlogs(includeInactive = false) {
    try {
      const whereClause = includeInactive ? {} : { is_active: true };

      const blogs = await prisma.blog.findMany({
        where: whereClause,
        orderBy: { created_at: "desc" },
        include: {
          author: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
        },
      });
      return blogs;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving blogs: ${error.message}`
      );
    }
  }

  async getPublishedBlogs() {
    try {
      const blogs = await prisma.blog.findMany({
        where: {
          is_active: true,
          published_at: {
            not: null,
            lte: new Date(),
          },
        },
        orderBy: { published_at: "desc" },
        include: {
          author: {
            select: {
              user_id: true,
              username: true,
            },
          },
        },
      });
      return blogs;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving published blogs: ${error.message}`
      );
    }
  }

  async getBlogById(blogId) {
    try {
      const blog = await prisma.blog.findUnique({
        where: { blog_id: blogId },
        include: {
          author: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
        },
      });
      return blog;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the blog: ${error.message}`
      );
    }
  }

  async getBlogBySlug(slug) {
    try {
      const blog = await prisma.blog.findUnique({
        where: { slug, is_active: true },
        include: {
          author: {
            select: {
              user_id: true,
              username: true,
            },
          },
        },
      });
      return blog;
    } catch (error) {
      throw new Error(
        `Error occurred while retrieving the blog: ${error.message}`
      );
    }
  }

  async updateBlog(blogId, data) {
    try {
      const updateData = { ...data };

      if (data.title) {
        const slug = this.generateSlug(data.title);

        let uniqueSlug = slug;
        let counter = 1;
        while (true) {
          const existing = await prisma.blog.findUnique({
            where: { slug: uniqueSlug },
          });
          if (!existing || existing.blog_id === blogId) {
            break;
          }
          uniqueSlug = `${slug}-${counter}`;
          counter++;
        }
        updateData.slug = uniqueSlug;
      }

      const updatedBlog = await prisma.blog.update({
        where: { blog_id: blogId },
        data: updateData,
        include: {
          author: {
            select: {
              user_id: true,
              username: true,
              email: true,
            },
          },
        },
      });
      return updatedBlog;
    } catch (error) {
      throw new Error(
        `Error occurred while updating the blog: ${error.message}`
      );
    }
  }

  async deleteBlog(blogId) {
    try {
      const deletedBlog = await prisma.blog.update({
        where: { blog_id: blogId },
        data: { is_active: false },
      });
      return deletedBlog;
    } catch (error) {
      throw new Error(
        `Error occurred while deleting the blog: ${error.message}`
      );
    }
  }

  async hardDeleteBlog(blogId) {
    try {
      const deletedBlog = await prisma.blog.delete({
        where: { blog_id: blogId },
      });
      return deletedBlog;
    } catch (error) {
      throw new Error(
        `Error occurred while permanently deleting the blog: ${error.message}`
      );
    }
  }
}

module.exports = new BlogService();
