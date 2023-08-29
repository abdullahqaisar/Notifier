const httpStatus = require("http-status");
const config = require("config");
// const debug = require("../startup/debug");
const { Application } = require("../../models/mongo/application.model");

// Controller to get all the applications
exports.getAllApplications = async (req, res) => {
  const {
    page = config.get("defaultPage"),
    pageSize = config.get("defaultPageSize"),
    sort = config.get("defaultSort"),
  } = req.query;

  const query = {
    isDeleted: false,
  };

  if (req.query.isActive) query.isActive = req.query.isActive.toLowerCase();
  if (req.query.name) query.name = { $regex: req.query.name, $options: "i" };

  // try this in one query
  const totalCount = await Application.countDocuments(query);
  const applications = await Application.find(query)
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize);
  if (!applications.length)
    return res.status(httpStatus.NOT_FOUND).send("No applications found.");

  const response = {
    currentPage: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    totalCount,
    applications,
  };

  return res.status(httpStatus.OK).send(response);
};

// Controller to get single application by Id
exports.getApplicationById = async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    isDeleted: false,
  });
  if (!application)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The application with the given ID was not found.");

  return res.status(httpStatus.OK).send(application);
};

// Controller to create a new application
exports.createApplication = async (req, res) => {
  const { name } = req.body;

  const existingApplication = await Application.findOne({ name });

  if (existingApplication)
    return res
      .status(httpStatus.CONFLICT)
      .send("Application with this name already exists.");

  let application = new Application(req.body);
  application = await application.save();

  if (!application || application.length === 0)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("The application could not be created.");

  return res
    .status(httpStatus.CREATED)
    .send({ message: "Application created successfully.", application });
};

// Controller to update an existing application
exports.updateApplication = async (req, res) => {
  const { name } = req.body;
  const existingApplication = await Application.findOne({
    name,
    isDeleted: false,
  });

  if (existingApplication)
    return res
      .status(httpStatus.CONFLICT)
      .send("Application with this name already exists.");

  req.body.modifiedDate = Date.now();
  const application = await Application.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true },
  );

  if (!application)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("The application could not be updated.");

  return res
    .status(httpStatus.OK)
    .send({ message: "Application updated successfully.", application });
};

// Controller to deactivate an existing application
exports.deactivateApplication = async (req, res) => {
  const application = await Application.findByIdAndUpdate(
    req.params.id,
    {
      isActive: false,
    },
    { new: true },
  );
  if (!application)
    return res
      .status(httpStatus.NOT_FOUND)
      .send("The application with the given ID was not found.");

  return res
    .status(httpStatus.OK)
    .send({ message: "Application deactivated successfully.", application });
};

// Controller to delete an existing application
exports.deleteApplication = async (req, res) => {
  let application = await Application.findById(req.params.id);
  application = await Application.findByIdAndUpdate(
    req.params.id,
    {
      isActive: false,
      isDeleted: true,
    },
    { new: true },
  );
  if (!application)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("The application could not be deleted.");

  return res
    .status(httpStatus.OK)
    .send({ message: "Application deleted successfully.", application });
};
