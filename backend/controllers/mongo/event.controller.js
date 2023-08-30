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
  } = req.query;

  const query = {
    isDeleted: false,
    applicationId: req.query.applicationId,
  };

  if (req.query.name) query.name = { $regex: req.query.name, $options: "i" };

  // try this in one query
  const totalCount = await Event.countDocuments(query);
  const events = await Event.find(query)
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  if (!events.length)
    return res.status(httpStatus.NOT_FOUND).send("No events found.");

  const response = {
    currentPage: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    totalCount,
    events,
  };
  return res.send(response);
};

// Controller to get single event by Id
exports.getEventById = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The event with the given ID was not found.");

  return res.status(httpStatus.OK).send(event);
};

// Controller to create a new event
exports.createEvent = async (req, res) => {
  const application = await Application.findById(req.body.applicationId);
  if (!application)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The application with the given ID was not found.");

  const existingEvent = await Event.findOne({
    name: req.body.name,
    applicationId: req.body.applicationId,
    isDeleted: false,
  });
  if (existingEvent)
    return res
      .status(httpStatus.CONFLICT)
      .send("An event with this name already exists in this application.");

  let event = new Event(req.body);
  event = await event.save();

  if (!event)
    res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      message: "The event could not be created.",
    });

  return res
    .status(httpStatus.CREATED)
    .send({ message: "Event created successfully.", event });
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
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    {
      isActive: false,
    },
    { new: true },
  );
  if (!event)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The event with the given ID was not found.");

  return res
    .status(httpStatus.OK)
    .send({ message: "Event deactivated successfully.", event });
};

// Controller to delete an existing event
exports.deleteEvent = async (req, res) => {
  const event = await Event.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
    },
    { new: true },
  );
  if (!event)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The event with the given ID was not found.");

  return res
    .status(httpStatus.OK)
    .send({ message: "Event deleted successfully.", event });
};

// Controller to delete multiple events
exports.deleteMultipleEvents = async (req, res) => {
  const result = await Event.updateMany(
    { _id: { $in: req.body.eventIds } },
    { $set: { isDeleted: true } },
    { new: true },
  );

  if (result.nModified === 0)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("No events with the provided IDs were found.");

  return res.status(httpStatus.OK).send({
    message: "Events deleted successfully.",
    deletedCount: result.nModified,
  });
};
