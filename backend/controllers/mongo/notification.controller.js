const httpStatus = require("http-status");
const config = require("config");
const { Notification } = require("../../models/mongo/notification.model");
const { Event } = require("../../models/mongo/event.model");

// controller to get all notifications
exports.getAllNotifications = async (req, res) => {
  console.log("getAllNotifications");
  const {
    page = config.get("defaultPage"),
    pageSize = config.get("defaultPageSize"),
    sort = config.get("defaultSort"),
  } = req.query;

  const query = {
    isDeleted: false,
    eventId: req.query.eventId,
  };

  if (req.query.name) query.name = { $regex: req.query.name, $options: "i" };

  // try this in one query
  const totalCount = await Notification.countDocuments(query);
  const notifications = await Notification.find(query)
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  if (!notifications.length)
    return res.status(httpStatus.NOT_FOUND).send("No notifications found.");

  const response = {
    currentPage: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    totalCount,
    notifications,
  };
  return res.status(httpStatus.OK).send(response);
};

// Controller to get single notification by Id
exports.getNotificationById = async (req, res) => {
  const notification = await Notification.findById(req.params.id);
  if (!notification)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The notification with the given ID was not found.");

  return res.status(httpStatus.OK).send(notification);
};

// Controller to create a new notification
exports.createNotification = async (req, res) => {
  const event = await Event.findById(req.body.eventId);
  if (!event)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The event with the given ID was not found.");

  const existingNotification = await Notification.findOne({
    name: req.body.name,
    eventId: req.body.eventId,
  });
  if (existingNotification)
    return res
      .status(httpStatus.CONFLICT)
      .send("Notification with the given name already exists.");

  const templateTags = req.body.templateBody.match(/{(.*?)}/g) || [];

  req.body.notificationTags = templateTags.map((tag) => tag.slice(1, -1));
  let notification = new Notification(req.body);
  notification = await notification.save();

  if (!notification)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("The notification could not be created.");

  return res
    .status(httpStatus.CREATED)
    .send({ message: "Notification created successfully.", notification });
};

// Controller to update an existing notification
exports.updateNotification = async (req, res) => {
  let notification = await Notification.findById(req.params.id);
  if (!notification)
    return res
      .status(httpStatus.NOT_FOUND)
      .send({ error: "The notification with the given ID was not found" });

  const { eventId } = notification;
  const existingNotification = await Notification.findOne({
    name: req.body.name,
    eventId,
    isDeleted: false,
    _id: { $ne: req.params.id },
  });
  if (existingNotification)
    return res
      .status(httpStatus.CONFLICT)
      .send({ error: "Notification with the given name already exists." });

  Object.assign(notification, req.body);

  const templateTags = req.body.templateBody.match(/{(.*?)}/g) || [];
  notification.notificationTags = templateTags.map((tag) => tag.slice(1, -1));
  notification.modifiedDate = Date.now();

  notification = await notification.save();

  if (!notification)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ error: "The notification could not be updated." });

  return res
    .status(httpStatus.OK)
    .send({ message: "Notification updated successfully.", notification });
};

// Controller to deactivate an existing notification
exports.deactivateNotification = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    {
      isActive: false,
    },
    { new: true },
  );
  if (!notification) {
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The notification with the given ID was not found.");
  }
  return res
    .status(httpStatus.OK)
    .send({ message: "Notification deactivated successfully.", notification });
};

// Controller to delete an existing notification
exports.deleteNotification = async (req, res) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
    },
    { new: true },
  );
  if (!notification) {
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The notification with the given ID was not found.");
  }
  return res
    .status(httpStatus.OK)
    .send({ message: "Notification deleted successfully.", notification });
};
