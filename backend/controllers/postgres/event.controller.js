const httpStatus = require("http-status");
const config = require("config");
const Event = require("../../models/postgres/event.model");
const Application = require("../../models/postgres/application.model");

exports.getAllEvents = async (req, res) => {
  const {
    page = config.get("defaultPage"),
    pageSize = config.get("defaultPageSize"),
    sort = config.get("defaultSort"),
    applicationId,
  } = req.query;

  const query = {
    isDeleted: false,
    applicationId,
  };

  if (req.query.name) query.name = req.query.name;

  const countResult = await Event.count(query);
  const totalCount = parseInt(countResult.totalCount, 10);

  const events = await Event.getAll({
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    sort,
    ...query,
  });

  if (!events.length)
    return res.status(httpStatus.NOT_FOUND).send("No events found.");

  const response = {
    currentPage: Number(page),
    pageSize: Number(pageSize),
    totalCount,
    events,
  };
  return res.status(httpStatus.OK).send(response);
};

exports.getEventById = async (req, res) => {
  const event = await Event.getById(req.params.id);
  if (!event)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The event with the given ID was not found.");

  return res.status(httpStatus.OK).send(event);
};

exports.createEvent = async (req, res) => {
  const { applicationId } = req.body;

  const application = await Application.getById(applicationId);
  if (!application)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The application with the given ID was not found.");

  const existingEvent = await Event.getByEventName(req.body.name);
  if (existingEvent)
    return res
      .status(httpStatus.CONFLICT)
      .send("Application with this name already exists.");

  const newEvent = await Event.create(req.body);
  return res
    .status(httpStatus.CREATED)
    .send({ message: "Event created successfully.", event: newEvent[0] });
};

exports.updateEvent = async (req, res) => {
  const existingEvent = await Event.getByEventName(req.body.name);

  if (existingEvent)
    return res
      .status(httpStatus.CONFLICT)
      .send("Application with this name already exists.");

  req.body.modifiedDate = new Date();
  const updatedEvent = await Event.update(req.params.id, req.body);
  if (!updatedEvent.length)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The event with the given ID was not found.");

  return res
    .status(httpStatus.OK)
    .send({ message: "Event updated successfully.", event: updatedEvent });
};

exports.deactivateEvent = async (req, res) => {
  const deactivatedEvent = await Event.deactivate(req.params.id);
  if (!deactivatedEvent.length)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The event with the given ID was not found.");

  return res.status(httpStatus.OK).send({
    message: "Event deactivated successfully.",
    event: deactivatedEvent,
  });
};

exports.deleteEvent = async (req, res) => {
  const deletedEvent = await Event.delete(req.params.id);
  if (!deletedEvent.length)
    return res
      .status(httpStatus.length)
      .send("The event with the given ID was not found.");

  return res
    .status(httpStatus.OK)
    .send({ message: "Event deleted successfully.", event: deletedEvent });
};

exports.deleteMultipleEvents = async (req, res) => {
  const { eventIds } = req.body;

  const deletedEvents = await Promise.all(
    eventIds.map(async (eventId) => {
      const deletedEvent = await Event.delete(eventId);
      return deletedEvent;
    }),
  );

  return res.status(httpStatus.OK).send({
    message: "Events deleted successfully.",
    deletedEvents,
  });
};
