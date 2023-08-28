/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const httpMocks = require("node-mocks-http");
const httpStatus = require("http-status");
const mongoose = require("mongoose");
const applicationController = require("../../../../controllers/mongo/application.controller");
const { Application } = require("../../../../models/mongo/application.model");

describe("Application Controller - Unit Tests", () => {
  let res;
  beforeEach(() => {
    res = httpMocks.createResponse();
  });

  describe("getAllApplications", () => {
    const req = httpMocks.createRequest({ query: {} });
    it("should return a list of applications", async () => {
      Application.countDocuments = jest.fn().mockResolvedValue(2);
      Application.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([{ name: "App 1" }, { name: "App 2" }]),
      });
      await applicationController.getAllApplications(req, res);
      const responseData = res._getData();
      expect(responseData.currentPage).toBe(1);
      expect(responseData.pageSize).toBe(10);
      expect(responseData.totalCount).toBe(2);
      expect(responseData.applications).toHaveLength(2);
      expect(responseData.applications[0].name).toBe("App 1");
      expect(responseData.applications[1].name).toBe("App 2");
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should handle error when no applications are found", async () => {
      Application.countDocuments = jest.fn().mockResolvedValue(0);
      Application.find = jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await applicationController.getAllApplications(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("No applications found.");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("getApplicationById", () => {
    const req = httpMocks.createRequest({
      params: {
        id: new mongoose.Types.ObjectId(),
      },
    });
    it("should return a single application if a valid id is passed", async () => {
      Application.findOne = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 1",
      });

      await applicationController.getApplicationById(req, res);

      const responseData = res._getData();
      expect(responseData.name).toBe("App 1");
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should handle error when no application is found", async () => {
      Application.findOne = jest.fn().mockResolvedValue(null);

      await applicationController.getApplicationById(req, res);

      const responseData = res._getData();
      expect(responseData).toBe(
        "The application with the given ID was not found.",
      );
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("createApplication", () => {
    const req = httpMocks.createRequest({
      body: {
        name: "App 1",
        description: "App 1 description",
      },
    });
    it("should create a new application", async () => {
      Application.findOne = jest.fn().mockResolvedValue(null);
      Application.prototype.save = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 1",
        description: "App 1 description",
      });

      await applicationController.createApplication(req, res);

      const responseData = res._getData();
      expect(responseData.message).toBe("Application created successfully.");
      expect(responseData.application.name).toBe("App 1");
      expect(responseData.application.description).toBe("App 1 description");
      expect(res.statusCode).toBe(httpStatus.CREATED);
    });

    it("should handle error when application with the same name already exists", async () => {
      Application.findOne = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 1",
        description: "App 1 description",
      });

      await applicationController.createApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("Application with this name already exists.");
      expect(res.statusCode).toBe(httpStatus.CONFLICT);
    });

    it("should handle error when application could not be created", async () => {
      Application.findOne = jest.fn().mockResolvedValue(null);
      Application.prototype.save = jest.fn().mockResolvedValueOnce(null);

      await applicationController.createApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("The application could not be created.");
      expect(res.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe("updateApplication", () => {
    it("should update an application successfully", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
        body: {
          name: "App 2",
        },
      });
      Application.findOne = jest.fn().mockResolvedValue(null);
      Application.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 2",
      });

      await applicationController.updateApplication(req, res);

      const responseData = res._getData();
      expect(responseData.message).toBe("Application updated successfully.");
      expect(responseData.application.name).toBe("App 2");
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should handle error when application with the same name already exists", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
        body: {
          name: "App 2",
        },
      });
      Application.findOne = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 1",
        description: "App 1 description",
      });

      await applicationController.updateApplication(req, res);

      expect(res._getData()).toBe("Application with this name already exists.");
      expect(res.statusCode).toBe(httpStatus.CONFLICT);
    });

    it("should handle error when application could not be updated", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
        body: {
          name: "App 2",
        },
      });

      Application.findOne = jest.fn().mockResolvedValue(null);
      Application.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(null);

      await applicationController.updateApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("The application could not be updated.");
      expect(res.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe("deactivateApplication", () => {
    it("should deactivate application successfully", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
      });
      Application.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 1",
        description: "App 1 description",
        isActive: false,
      });

      await applicationController.deactivateApplication(req, res);

      const responseData = res._getData();
      expect(responseData.message).toBe(
        "Application deactivated successfully.",
      );
      expect(responseData.application.isActive).toBe(false);
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should return an error when application could not be deactivated", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
      });
      Application.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(null);

      await applicationController.deactivateApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe(
        "The application with the given ID was not found.",
      );
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("deleteApplication", () => {
    it("should delete application successfully", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
      });
      Application.findByIdAndUpdate = jest.fn().mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 1",
        description: "App 1 description",
        isActive: false,
        isDeleted: true,
      });

      await applicationController.deleteApplication(req, res);

      const responseData = res._getData();
      expect(responseData.message).toBe("Application deleted successfully.");
      expect(responseData.application.isActive).toBe(false);
      expect(responseData.application.isDeleted).toBe(true);
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should return an error when application could not be deleted", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
      });
      Application.findByIdAndUpdate = jest.fn().mockResolvedValueOnce(null);

      await applicationController.deleteApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("The application could not be deleted.");
      expect(res.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });
});
