const status = require("http-status");
const config = require("config");
const Notification = require("../../models/postgres/notification.model");
const Event = require("../../models/postgres/event.model");

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
  if (name) query.name = name;

  const countResult = await Notification.count(query);
  const totalCount = parseInt(countResult.totalCount, 10);

  const notifications = await Notification.getAll({
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    sort,
    ...query,
  });

  if (!notifications.length)
    return res.status(status.NOT_FOUND).send("No notifications found.");

  const response = {
    currentPage: Number(page),
    pageSize: Number(pageSize),
    totalCount,
    notifications,
  };

  return res.status(status.OK).send(response);
};

exports.getNotificationById = async (req, res) => {
  const notification = await Notification.getById(req.params.id);
  if (!notification)
    return res
      .status(status.NOT_FOUND)
      .send("The notification with the given ID was not found.");

  return res.status(status.OK).send(notification);
};

exports.createNotification = async (req, res) => {
  const event = await Event.getById(req.body.eventId);
  if (!event)
    return res
      .status(status.NOT_FOUND)
      .send("The event with the given ID was not found.");

  const existingNotification = await Notification.getByNotificationName(
    req.body.name,
  );
  if (existingNotification)
    return res
      .status(status.CONFLICT)
      .send("The notification with the given name already exists.");

  let templateTags = req.body.templateBody.match(/{(.*?)}/g) || [];
  templateTags = templateTags.map((tag) => tag.slice(1, -1));
  const newNotification = {
    ...req.body,
    notificationTags: templateTags,
  };

  const createdNotification = await Notification.create(newNotification);
  return res.status(status.CREATED).send(createdNotification[0]);
};

exports.updateNotification = async (req, res) => {
  const existingNotification = await Notification.getByNotificationName(
    req.body.name,
  );
  if (existingNotification)
    return res
      .status(status.CONFLICT)
      .send("The notification with the given name already exists.");

  req.body.modifiedDate = new Date();
  let templateTags = req.body.templateBody.match(/{(.*?)}/g) || [];
  templateTags = templateTags.map((tag) => tag.slice(1, -1));
  req.body.notificationTags = templateTags;

  const updatedNotification = await Notification.update(
    req.params.id,
    req.body,
  );

  if (!updatedNotification)
    return res
      .status(status.NOT_FOUND)
      .send("The notification with the given ID was not found.");

  return res.status(status.OK).send({
    message: "Notification updated successfully.",
    updatedNotification,
  });
};

exports.deactivateNotification = async (req, res) => {
  const deactivatedNotification = await Notification.deactivate(req.params.id);
  if (!deactivatedNotification.length)
    return res
      .status(status.NOT_FOUND)
      .send("The notification with the given ID was not found.");

  return res.status(status.OK).send({
    message: "Notification deactivated successfully.",
    deactivatedNotification,
  });
};

exports.deleteNotification = async (req, res) => {
  const deletedNotification = await Notification.delete(req.params.id);
  if (!deletedNotification.length)
    return res
      .status(status.NOT_FOUND)
      .send("The notification with the given ID was not found.");

  return res.status(status.OK).send({
    message: "Notification deleted successfully.",
    deletedNotification,
  });
};
