const express = require("express");
const userRoutes = require("./src/routes/user.route");
const roleRoutes = require("./src/routes/role.route");

const app = express();
app.use("/user", userRoutes);
app.use("/role", roleRoutes);

module.exports = app;
