const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 50,
  },
  description: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 1024,
  },
  templateSubject: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 255,
  },
  templateBody: {
    type: String,
    required: true,
    minLength: 5,
    maxLength: 1024,
  },
  notificationTags: {
    type: Array,
  },
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Application",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  modifiedDate: {
    type: Date,
    default: Date.now,
  },
});

const Notification = mongoose.model("Notification", notificationSchema);
exports.Notification = Notification;
