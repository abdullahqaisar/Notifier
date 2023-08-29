/* eslint-disable import/no-dynamic-require */
const express = require("express");
const config = require("config");
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");

const eventController = require(`../controllers/${config.get(
  "dbType",
)}/event.controller`);
const {
  validateEvent,
  validateGetAllEvents,
  validateUpdateEvent,
  validateDeleteMultipleEvents,
} = require("../models/validators/event.validator");

const router = express.Router();

router.get("/", validate(validateGetAllEvents), eventController.getAllEvents);
router.get("/:id", validateObjectId, eventController.getEventById);
router.post("/", validate(validateEvent), eventController.createEvent);
router.patch(
  "/:id",
  [validateObjectId, validate(validateUpdateEvent)],
  eventController.updateEvent,
);
router.patch(
  "/:id/deactivate",
  validateObjectId,
  eventController.deactivateEvent,
);
router.delete("/:id", validateObjectId, eventController.deleteEvent);
router.delete(
  "/",
  validate(validateDeleteMultipleEvents),
  eventController.deleteMultipleEvents,
);

module.exports = router;
