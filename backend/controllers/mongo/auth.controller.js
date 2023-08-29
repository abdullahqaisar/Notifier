// const debug = require('debug')('app');
const Joi = require("joi");
const bcrypt = require("bcrypt");
const User = require("../../models/mongo/user.model");

function validate(req) {
  const schema = Joi.object({
    email: Joi.string().min(5).max(255).required().email(),
    password: Joi.string().min(5).max(255).required(),
  });

  return schema.validate(req);
}

exports.login = async (req, res) => {
  const { error } = validate(req.body);
  if (error) return res.status(400).send(error);

  const user = await User.findOne({ email: req.body.email });
  if (!user) return res.status(400).send("Invalid email or password!");

  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send("Invalid email or password!");

  const token = user.generateAuthToken();
  return res.send(token);
};
