/* eslint-disable import/no-dynamic-require */
const express = require("express");
const config = require("config");

const messageController = require(`../controllers/${config.get(
  "dbType",
)}/message.controller`);
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");
const { validateMessage } = require("../models/validators/message.validator");

const router = express.Router();

router.get("/:id", validateObjectId, messageController.getMessages);
router.post("/", validate(validateMessage), messageController.sendMessage);

module.exports = router;
