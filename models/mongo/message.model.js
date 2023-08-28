const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  notificationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Notification",
    required: true,
  },
  email: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 255,
  },
  subject: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 255,
  },
  body: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 1024,
  },
  sent: {
    type: Boolean,
    default: false,
  },
  sentDate: {
    type: Date,
  },
});

const Message = mongoose.model("Message", messageSchema);
exports.Message = Message;
