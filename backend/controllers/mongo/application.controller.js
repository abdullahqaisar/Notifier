const config = require("config");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");

const { Application } = require("../../models/mongo/application.model");

// Controller to get all the applications
exports.getAllApplications = async (req, res) => {
  const {
    page = config.get("defaultPage"),
    pageSize = config.get("defaultPageSize"),
    sort = config.get("defaultSort"),
    isActive,
    name,
  } = req.query;

  const query = { isDeleted: false };

  if (isActive) query.isActive = isActive.toLowerCase();
  if (name) query.name = { $regex: new RegExp(name, "i") };

  const totalCountPromise = Application.countDocuments(query);
  const applicationsPromise = Application.find(query)
    .sort(sort)
    .skip((page - 1) * pageSize)
    .limit(pageSize);

  const [totalCount, applications] = await Promise.all([
    totalCountPromise,
    applicationsPromise,
  ]);

  if (!applications.length)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: getReasonPhrase(StatusCodes.NOT_FOUND) });

  const response = {
    currentPage: parseInt(page, 10),
    pageSize: parseInt(pageSize, 10),
    totalCount,
    applications,
  };

  return res
    .status(StatusCodes.OK)
    .json({ message: getReasonPhrase(StatusCodes.OK), data: response });
};

// Controller to get a single application by Id
exports.getApplicationById = async (req, res) => {
  const application = await Application.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!application) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: getReasonPhrase(StatusCodes.NOT_FOUND) });
  }

  return res
    .status(StatusCodes.OK)
    .json({ message: getReasonPhrase(StatusCodes.OK), data: application });
};

// Controller to create a new application
exports.createApplication = async (req, res) => {
  const { name } = req.body;
  const existingApplication = await Application.findOne({ name });

  if (existingApplication) {
    return res
      .status(StatusCodes.CONFLICT)
      .json({ message: "Application with this name already exists" });
  }

  const application = new Application(req.body);
  const savedApplication = await application.save();

  if (!savedApplication)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) });

  return res.status(StatusCodes.CREATED).json({
    message: getReasonPhrase(StatusCodes.CREATED),
    data: savedApplication,
  });
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
      .status(StatusCodes.CONFLICT)
      .json({ message: getReasonPhrase(StatusCodes.CONFLICT) });

  req.body.modifiedDate = Date.now();
  let application = await Application.findById(req.params.id);
  if (!application)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: getReasonPhrase(StatusCodes.NOT_FOUND) });

  application = await Application.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  if (!application)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) });

  return res.status(StatusCodes.OK).json({
    message: getReasonPhrase(StatusCodes.OK),
    data: application,
  });
};

// Controller to deactivate an existing application
exports.deactivateApplication = async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: getReasonPhrase(StatusCodes.NOT_FOUND) });

  application.isActive = false;
  application.modifiedDate = Date.now();

  const updatedApplication = await application.save();

  if (!updatedApplication)
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR) });

  return res.status(StatusCodes.OK).json({
    message: getReasonPhrase(StatusCodes.OK),
    data: updatedApplication,
  });
};

// Controller to delete an existing application
exports.deleteApplication = async (req, res) => {
  const application = await Application.findById(req.params.id);
  if (!application)
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: getReasonPhrase(StatusCodes.NOT_FOUND) });

  application.isActive = false;
  application.isDeleted = true;
  application.modifiedDate = Date.now();
  await application.save();

  return res
    .status(StatusCodes.OK)
    .json({ message: getReasonPhrase(StatusCodes.OK), data: application });
};
