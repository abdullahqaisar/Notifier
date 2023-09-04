const { StatusCodes } = require("http-status-codes");
const { Message } = require("../../models/mongo/message.model");
const { Notification } = require("../../models/mongo/notification.model");

exports.getMessages = async (req, res) => {
  const notificationId = req.params.id;

  const messages = await Message.find({ notificationId });

  if (messages.length === 0)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: "No messages with this notification ID found" });

  return res.status(StatusCodes.OK).json(messages);
};

exports.sendMessage = async (req, res) => {
  const { notificationId, tags } = req.body;

  const notification = await Notification.findById(notificationId);

  if (!notification) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ error: "Notification not found" });
  }

  if (!Array.isArray(tags) || tags.length === 0)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Invalid tags format. It should be a non-empty array" });

  const { templateBody, templateSubject } = notification;

  const messages = tags.map((tag) => {
    const populatedBody = Object.keys(tag).reduce((body, tagName) => {
      const tagPlaceholder = `{${tagName}}`;
      return body.replace(new RegExp(tagPlaceholder, "g"), tag[tagName]);
    }, templateBody);

    return {
      email: tag.email,
      subject: templateSubject,
      body: populatedBody,
    };
  });

  const messageDocs = messages.map((message) => ({
    notificationId,
    email: message.email,
    subject: message.subject,
    body: message.body,
  }));

  const savedMessages = await Message.insertMany(messageDocs);

  if (!savedMessages || savedMessages.length === 0)
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Could not store messages" });

  return res.status(StatusCodes.OK).json(savedMessages);
};
