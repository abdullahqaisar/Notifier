/* eslint-disable import/no-dynamic-require */
const express = require("express");
const config = require("config");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");

const notificationController = require(`../controllers/${config.get(
  "dbType",
)}/notification.controller`);
const {
  validateNotification,
  validateGetAllNotifications,
  validateUpdateNotification,
} = require("../models/validators/notification.validator");

const router = express.Router();

router.get(
  "/",
  validate(validateGetAllNotifications),
  notificationController.getAllNotifications,
);
router.get(
  "/:id",
  validateObjectId,
  notificationController.getNotificationById,
);
router.post(
  "/",
  validate(validateNotification),
  notificationController.createNotification,
);
router.patch(
  "/:id",
  [validateObjectId, validate(validateUpdateNotification)],
  notificationController.updateNotification,
);
router.patch(
  "/:id/deactivate",
  validateObjectId,
  notificationController.deactivateNotification,
);
router.delete(
  "/:id",
  validateObjectId,
  notificationController.deleteNotification,
);

module.exports = router;
