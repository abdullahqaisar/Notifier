const express = require("express");
const requestLogger = require("../utils/requestLogger");
const traceId = require("../middleware/traceId");

const applicationRoutes = require(`../routes/application.routes`);
const eventRoutes = require(`../routes/event.routes`);
const notificationRoutes = require(`../routes/notification.routes`);
const messageRoutes = require(`../routes/message.routes`);
const error = require("../middleware/error");

module.exports = function (app) {
  app.use(express.json());
  app.use(traceId);
  app.use(requestLogger());

  // app.use("/api/auth", authRoutes);
  app.use("/api/applications", applicationRoutes);
  app.use("/api/events", eventRoutes);
  app.use("/api/notifications", notificationRoutes);
  app.use("/api/messages", messageRoutes);
  app.use(error);
};
