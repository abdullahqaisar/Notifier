const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const httpStatus = require("http-status");
const config = require("config");
const { Event } = require("../../models/mongo/event.model");
const { Application } = require("../../models/mongo/application.model");

// controller to get all events
exports.getAllEvents = async (req, res) => {
  const {
    page = config.get("defaultPage"),
    pageSize = config.get("defaultPageSize"),
    sort = config.get("defaultSort"),
    name,
    applicationId,
  } = req.query;

  const query = {
    isDeleted: false,
  };

  if (applicationId) query.applicationId = applicationId;
  if (name) query.name = { $regex: new RegExp(name, "i") };

  const totalCount = await Event.countDocuments(query);
  const events = await Event.find(query)
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  if (events.length === 0)
    return res.status(StatusCodes.NOT_FOUND).json({
      message: getReasonPhrase(StatusCodes.NOT_FOUND),
    });

  const response = {
    currentPage: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    totalCount,
    events,
  };

  return res.json({
    message: getReasonPhrase(StatusCodes.OK),
    data: response,
  });
};

// Controller to get single event by Id
exports.getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Event not found" });
  }

  return res.status(StatusCodes.OK).json({ data: event });
};

// Controller to create a new event
exports.createEvent = async (req, res) => {
  const { applicationId, name } = req.body;
  const application = await Application.findById(applicationId);

  if (!application) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Application not found" });
  }

  const existingEvent = await Event.findOne({
    name,
    applicationId,
    isDeleted: false,
  });

  if (existingEvent) {
    return res.status(StatusCodes.CONFLICT).json({
      message: "An event with this name already exists in this application.",
    });
  }

  let event = new Event(req.body);
  event = await event.save();

  if (!event) {
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "The event could not be created." });
  }

  return res
    .status(StatusCodes.CREATED)
    .json({ message: "Event created successfully.", event });
};

// Controller to update an existing event
exports.updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The event with the given ID was not found");

  const { applicationId } = event;

  const existingEvent = await Event.findOne({
    name: req.body.name,
    applicationId,
    isDeleted: false,
    _id: { $ne: req.params.id },
  });
  if (existingEvent)
    return res
      .status(httpStatus.CONFLICT)
      .send("An event with this name already exists in this application.");

  Object.assign(event, req.body);

  event.modifiedDate = Date.now();
  const updatedEvent = await event.save();

  if (!updatedEvent)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send({ error: "An error occurred while updating the event" });

  return res
    .status(httpStatus.OK)
    .send({ message: "Event updated successfully.", event: updatedEvent });
};

// Controller to deactivate an existing event
exports.deactivateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Event not found" });

  event.isActive = false;
  event.modifiedDate = Date.now();
  await event.save();

  return res
    .status(StatusCodes.OK)
    .json({ message: "Event deactivated successfully.", event });
};

// Controller to delete an existing event
exports.deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event)
    return res
      .status(httpStatus.NOT_FOUND)
      .json({ message: "The event with the given ID was not found." });

  event.isActive = false;
  event.isDeleted = true;
  event.modifiedDate = Date.now();
  await event.save();

  return res
    .status(httpStatus.OK)
    .json({ message: "Event deleted successfully.", event });
};

// Controller to delete multiple events
exports.deleteMultipleEvents = async (req, res) => {
  const result = await Event.updateMany(
    { _id: { $in: req.body.eventIds } },
    { $set: { isDeleted: true } },
  );

  if (result.modifiedCount === 0)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "No events with the provided IDs were found." });

  return res.status(StatusCodes.OK).json({
    message: "Events deleted successfully.",
    deletedCount: result.modifiedCount,
  });
};
