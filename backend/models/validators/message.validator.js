const Joi = require("joi");

function validateMessage(data) {
  const tagSchema = Joi.object()
    .keys({
      email: Joi.string().email().required(),
    })
    .pattern(/./, Joi.any());

  const schema = Joi.object({
    // notificationId: Joi.objectId().required(),
    notificationId: Joi.any().required(), // fix for mongo
    tags: Joi.array().items(tagSchema).required(),
  });

  return schema.validate(data);
}

module.exports = {
  validateMessage,
};
