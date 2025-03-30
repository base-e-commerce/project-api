const express = require("express");
const exampleRoutes = require("./routes/exampe.route");

const app = express();
app.use("/example", exampleRoutes);

module.exports = app;
