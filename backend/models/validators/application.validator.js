const Joi = require("joi");

function validateApplication(data) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50).required(),
    description: Joi.string().min(5).max(1024).required(),
  });
  return schema.validate(data);
}

function validateGetAllApplications(data) {
  const schema = Joi.object({
    page: Joi.number().integer().min(1),
    pageSize: Joi.number().integer().min(1),
    isActive: Joi.boolean(),
    name: Joi.string().min(1).max(50),
    sort: Joi.string().min(1).max(50),
  });

  return schema.validate(data);
}

function validateUpdateApplication(data) {
  const schema = Joi.object({
    name: Joi.string().min(5).max(50),
    description: Joi.string().min(5).max(1024),
  });
  return schema.validate(data);
}

module.exports = {
  validateApplication,
  validateGetAllApplications,
  validateUpdateApplication,
};
