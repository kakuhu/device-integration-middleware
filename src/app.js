const express = require("express");
const transferRoutes = require("./routes/transferRoutes");
const externalRoutes = require("./routes/externalRoutes");
const transactionRoutes = require("./routes/transactionRoutes");

const app = express();
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "Device Integration Middleware",
    message: "API is running. See README.md for available endpoints."
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ success: true, status: "healthy" });
});

app.use("/api", transferRoutes);
app.use("/api/external", externalRoutes);
app.use("/api", transactionRoutes);

// Consistent JSON response for unknown routes.
app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

module.exports = app;
