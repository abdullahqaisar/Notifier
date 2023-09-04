const { StatusCodes } = require("http-status-codes");
const config = require("config");
const { Notification } = require("../../models/mongo/notification.model");
const { Event } = require("../../models/mongo/event.model");

// controller to get all notifications
exports.getAllNotifications = async (req, res) => {
  const {
    page = config.get("defaultPage"),
    pageSize = config.get("defaultPageSize"),
    sort = config.get("defaultSort"),
    eventId,
    name,
  } = req.query;

  const query = {
    isDeleted: false,
  };

  if (eventId) query.eventId = eventId;
  if (name) query.name = { $regex: new RegExp(name, "i") };

  const totalCount = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  if (notifications.length === 0)
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "No notifications found.",
    });

  const response = {
    currentPage: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    totalCount,
    notifications,
  };

  return res.status(StatusCodes.OK).json(response);
};

// Controller to get single notification by Id
exports.getNotificationById = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Notification not found" });
  }

  return res.status(StatusCodes.OK).json(notification);
};

// Controller to create a new notification
exports.createNotification = async (req, res) => {
  const { eventId, name, templateBody } = req.body;

  const event = await Event.findById(eventId);

  if (!event)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Event not found" });

  const existingNotification = await Notification.findOne({
    name,
    eventId,
  });

  if (existingNotification)
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "Notification with the given name already exists." });

  const templateTags = templateBody.match(/{(.*?)}/g) || [];
  const notificationTags = templateTags.map((tag) => tag.slice(1, -1));

  const notification = new Notification({ ...req.body, notificationTags });

  const savedNotification = await notification.save();

  if (!savedNotification)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "The notification could not be created." });

  return res.status(StatusCodes.CREATED).json({
    message: "Notification created successfully.",
    notification: savedNotification,
  });
};

// Controller to update an existing notification
exports.updateNotification = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: "Notification not found" });

  const { eventId } = notification;
  const { name, templateBody } = req.body;

  const existingNotification = await Notification.findOne({
    name,
    eventId,
    isDeleted: false,
    _id: { $ne: req.params.id },
  });

  if (existingNotification)
    return res
      .status(StatusCodes.CONFLICT)
      .json({ error: "Notification with the given name already exists." });

  Object.assign(notification, req.body);

  const templateTags = templateBody.match(/{(.*?)}/g) || [];
  notification.notificationTags = templateTags.map((tag) => tag.slice(1, -1));
  notification.modifiedDate = Date.now();

  const updatedNotification = await notification.save();

  if (!updatedNotification) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "The notification could not be updated." });
  }

  return res.status(StatusCodes.OK).json({
    message: "Notification updated successfully.",
    notification: updatedNotification,
  });
};

// Controller to deactivate an existing notification
exports.deactivateNotification = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: "Notification not found" });

  notification.isActive = false;
  notification.modifiedDate = Date.now();

  const updatedNotification = await notification.save();

  if (!updatedNotification)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: "The notification could not be updated." });

  return res.status(StatusCodes.OK).json({
    message: "Notification deactivated successfully.",
    notification: updatedNotification,
  });
};

// Controller to delete an existing notification
exports.deleteNotification = async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: "Notification not found" });

  notification.isDeleted = true;
  notification.modifiedDate = Date.now();

  await notification.save();

  return res.status(StatusCodes.OK).json({
    message: "Notification deleted successfully.",
    notification,
  });
};
