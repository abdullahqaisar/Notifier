const Joi = require("joi");

function validateNotification(data) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    description: Joi.string().min(5).max(1024).required(),
    // eventId: Joi.objectId().required(),  // fix for mongo
    eventId: Joi.any().required(),
    templateSubject: Joi.string().min(5).max(255).required(),
    templateBody: Joi.string().min(5).max(1024).required(),
    notificationTags: Joi.array().items(Joi.string().min(5).max(50)),
  });
  return schema.validate(data);
}

function validateGetAllNotifications(data) {
  const schema = Joi.object({
    // eventId: Joi.objectId().required(),  // fix for mongo
    eventId: Joi.any().required(),
    page: Joi.number().integer().min(1),
    pageSize: Joi.number().integer().min(1),
    name: Joi.string().min(1).max(50),
    sort: Joi.string().valid(
      "name",
      "id",
      "isActive",
      "createdDate",
      "updatedDate",
    ),
  });

  return schema.validate(data);
}

function validateUpdateNotification(data) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50),
    description: Joi.string().min(5).max(1024),
    templateSubject: Joi.string().min(5).max(255),
    templateBody: Joi.string().min(5).max(1024),
    notificationTags: Joi.array().items(Joi.string().min(5).max(50)),
  });
  return schema.validate(data);
}

module.exports = {
  validateNotification,
  validateGetAllNotifications,
  validateUpdateNotification,
};
