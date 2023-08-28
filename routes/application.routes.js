/* eslint-disable import/no-dynamic-require */
const express = require("express");
const config = require("config");

const applicationController = require(`../controllers/${config.get(
  "dbType",
)}/application.controller`);
const validateObjectId = require("../middleware/validateObjectId");
const validate = require("../middleware/validate");
const {
  validateApplication,
  validateGetAllApplications,
  validateUpdateApplication,
} = require("../models/validators/application.validator");

const router = express.Router();

router.get(
  "/",
  validate(validateGetAllApplications),
  applicationController.getAllApplications,
);
router.get("/:id", validateObjectId, applicationController.getApplicationById);
router.post(
  "/",
  validate(validateApplication),
  applicationController.createApplication,
);
router.patch(
  "/:id",
  [validateObjectId, validate(validateUpdateApplication)],
  applicationController.updateApplication,
);
router.patch(
  "/:id/deactivate",
  validateObjectId,
  applicationController.deactivateApplication,
);
router.delete(
  "/:id",
  validateObjectId,
  applicationController.deleteApplication,
);

module.exports = router;
