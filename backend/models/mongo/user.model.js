const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Joi = require("joi");

function validateUser(user) {
  const schema = {
    firstName: Joi.string().min(5).max(50).required(),
    lastName: Joi.string().min(5).max(50).required(),
    email: Joi.string().min(5).max(255).required().email(),
    userName: Joi.string().min(5).max(255).required(),
    password: Joi.string().min(5).max(1024).required(),
  };
  return Joi.validate(user, schema);
}

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 50,
  },
  lastName: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 50,
  },
  email: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 255,
    unique: true,
  },
  userName: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 255,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 5,
    maxlength: 1024,
  },
});

userSchema.methods.generateAuthToken = function () {
  // eslint-disable-next-line no-underscore-dangle
  const token = jwt.sign({ _id: this._id });
  return token;
};

const User = mongoose.model("User", userSchema);

exports.User = User;
exports.validate = validateUser;
