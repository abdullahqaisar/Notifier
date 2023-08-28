const httpStatus = require("http-status");
const Notification = require("../../models/postgres/notification.model");
const Message = require("../../models/postgres/message.model");

exports.getMessages = async (req, res) => {
  const messages = await Message.getAllByNotificationId(req.params.id);
  if (!messages.length)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("No messages with this notification id found");

  return res.status(httpStatus.OK).json(messages);
};

exports.sendMessage = async (req, res) => {
  const notification = await Notification.getById(req.body.notificationId);

  if (!notification)
    return res.status(httpStatus.NOT_FOUND).send("Notification not found.");

  const { templateBody } = notification;
  const { templateSubject } = notification;
  const { tags } = req.body;
  if (!Array.isArray(tags)) {
    return res.status(httpStatus.BAD_REQUEST).send("Invalid tags format.");
  }

  const messages = await Promise.all(
    tags.map(async (tag) => {
      const populatedBody = Object.keys(tag).reduce((body, tagName) => {
        const tagPlaceholder = `{${tagName}}`;
        return body.replace(new RegExp(tagPlaceholder, "g"), tag[tagName]);
      }, templateBody);

      return {
        email: tag.email,
        subject: templateSubject,
        body: populatedBody,
      };
    }),
  );

  const savedMessages = await Message.insertManyByNotificationId(
    req.body.notificationId,
    messages,
  );

  if (!savedMessages)
    return res.status(httpStatus.BAD_REQUEST).send("Could not store messages");

  return res.status(httpStatus.OK).json(messages);
};
