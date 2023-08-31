const Joi = require("joi");

function validateEvent(data) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    description: Joi.string().min(5).max(1024).required(),
    applicationId: Joi.any().required(), // For postgre
    // applicationId: Joi.objectId().required(), // For mongo
  });
  return schema.validate(data);
}

function validateGetAllEvents(data) {
  const schema = Joi.object({
    // applicationId: Joi.any().required(), // fix for mongo
    applicationId: Joi.objectId().required(), // fix for postgres
    page: Joi.number().integer().min(1),
    pageSize: Joi.number().integer().min(1),
    name: Joi.string().min(1).max(50),
    sort: Joi.string().min(1).max(50),
  });

  return schema.validate(data);
}

function validateUpdateEvent(data) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50),
    description: Joi.string().min(5).max(1024),
  });
  return schema.validate(data);
}

function validateDeleteMultipleEvents(data) {
  const schema = Joi.object({
    // eventIds: Joi.array().items(Joi.objectId().required()).required(),
    eventIds: Joi.array().items(Joi.any().required()).required(),
  });

  return schema.validate(data);
}

module.exports = {
  validateEvent,
  validateGetAllEvents,
  validateUpdateEvent,
  validateDeleteMultipleEvents,
};
