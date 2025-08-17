const express = require("express");
const userRoutes = require("./src/routes/user.route");
const roleRoutes = require("./src/routes/role.route");
const categoryRoutes = require("./src/routes/category.routes");
const serviceRoutes = require("./src/routes/service.pro.routes");
const productRoutes = require("./src/routes/product.routes");
const commonRoutes = require("./src/routes/common.routes");
const uploadRoutes = require("./src/routes/upload.route");
const customerRoutes = require("./src/routes/customer.routes");
const commandeRoutes = require("./src/routes/commande.routes");
const stripeRoutes = require("./src/routes/stripe.routes");
const reviewRoutes = require("./src/routes/review.routes");
const packagingRoutes = require("./src/routes/packaging.route");

const app = express();
app.use("/user", userRoutes);
app.use("/role", roleRoutes);
app.use("/category", categoryRoutes);
app.use("/product", productRoutes);
app.use("/common", commonRoutes);
app.use("/service", serviceRoutes);
app.use("/upload", uploadRoutes);
app.use("/customer", customerRoutes);
app.use("/commande", commandeRoutes);
app.use("/stripe", stripeRoutes);
app.use("/review", reviewRoutes);
app.use("/packaging", packagingRoutes);

module.exports = app;
