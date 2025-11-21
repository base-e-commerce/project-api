const BlogService = require("../services/blog.service");

// Admin endpoints
exports.createBlog = async (req, res) => {
  try {
    const authorId = req.user.userId; // From auth middleware
    const newBlog = await BlogService.createBlog(req.body, authorId);
    res.status(201).json({
      status: true,
      message: "Blog created successfully",
      data: newBlog,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.getAllBlogs = async (req, res) => {
  try {
    const includeInactive = req.query.include_inactive === "true";
    const blogs = await BlogService.getAllBlogs(includeInactive);
    res.status(200).json({
      status: true,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    const blog = await BlogService.getBlogById(blogId);

    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      status: true,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    const updatedBlog = await BlogService.updateBlog(blogId, req.body);
    res.status(200).json({
      status: true,
      message: "Blog updated successfully",
      data: updatedBlog,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blogId = parseInt(req.params.id);
    const deletedBlog = await BlogService.deleteBlog(blogId);
    res.status(200).json({
      status: true,
      message: "Blog deleted successfully",
      data: deletedBlog,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Public endpoints
exports.getPublishedBlogs = async (req, res) => {
  try {
    const blogs = await BlogService.getPublishedBlogs();
    res.status(200).json({
      status: true,
      data: blogs,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;
    const blog = await BlogService.getBlogBySlug(slug);

    if (!blog) {
      return res.status(404).json({
        status: false,
        message: "Blog not found",
      });
    }

    if (!blog.published_at || new Date(blog.published_at) > new Date()) {
      return res.status(404).json({
        status: false,
        message: "Blog not found",
      });
    }

    res.status(200).json({
      status: true,
      data: blog,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
