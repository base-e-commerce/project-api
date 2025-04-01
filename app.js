const express = require("express");
const userRoutes = require("./src/routes/user.route");
const roleRoutes = require("./src/routes/role.route");
const categoryRoutes = require("./src/routes/category.routes");
const serviceRoutes = require("./src/routes/service.pro.routes");
const productRoutes = require("./src/routes/product.routes");

const app = express();
app.use("/user", userRoutes);
app.use("/role", roleRoutes);
app.use("/category", categoryRoutes);
app.use("/product", productRoutes);
app.use("/service", serviceRoutes);

module.exports = app;
