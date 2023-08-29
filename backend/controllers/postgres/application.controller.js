const httpStatus = require("http-status");
const config = require("config");
const Application = require("../../models/postgres/application.model");

exports.getAllApplications = async (req, res) => {
  const {
    page = config.get("defaultPage"),
    pageSize = config.get("defaultPageSize"),
    sort = config.get("defaultSort"),
    isActive,
    name,
  } = req.query;

  const query = {
    isDeleted: false,
  };

  if (isActive) query.isActive = isActive.toLowerCase() === "true";
  if (name) query.name = name;

  const countResult = await Application.count(query);
  const totalCount = parseInt(countResult.totalCount, 10);

  const applications = await Application.getAll({
    page: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    sort,
    ...query,
  });

  if (!applications.length)
    return res.status(httpStatus.NOT_FOUND).send("No applications found.");

  const response = {
    currentPage: Number(page),
    pageSize: Number(pageSize),
    totalCount,
    applications,
  };
  return res.status(httpStatus.OK).send(response);
};

exports.getApplicationById = async (req, res) => {
  const application = await Application.getById(req.params.id);
  if (!application)
    return res.status(httpStatus.NOT_FOUND).send("Application not found.");
  return res.status(httpStatus.OK).send(application);
};

exports.createApplication = async (req, res) => {
  const { name } = req.body;

  const existingApplication = await Application.getByAppName(name);

  if (existingApplication)
    return res
      .status(httpStatus.CONFLICT)
      .send("Application with this name already exists.");

  const newApplication = await Application.create(req.body);

  if (!newApplication)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("The application could not be created.");

  return res.status(httpStatus.CREATED).send(newApplication);
};

exports.updateApplication = async (req, res) => {
  const { name } = req.body;

  const existingApplication = await Application.getByAppName(name);
  if (existingApplication)
    return res
      .status(httpStatus.CONFLICT)
      .send("Application with this name already exists.");

  req.body.modifiedDate = new Date();
  const updatedApplication = await Application.update(req.params.id, req.body);
  if (!updatedApplication.length)
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .send("The application could not be updated.");

  return res.status(httpStatus.OK).send(updatedApplication);
};

exports.deactivateApplication = async (req, res) => {
  const deactivatedApplication = await Application.deactivate(req.params.id);
  if (!deactivatedApplication)
    return res.status(httpStatus.NOT_FOUND).send("Application not found.");

  return res.status(httpStatus.OK).send(deactivatedApplication);
};

exports.deleteApplication = async (req, res) => {
  const deletedApplication = await Application.delete(req.params.id);
  if (!deletedApplication)
    return res.status(httpStatus.NOT_FOUND).send("Application not found.");

  return res.status(httpStatus.OK).send(deletedApplication);
};
