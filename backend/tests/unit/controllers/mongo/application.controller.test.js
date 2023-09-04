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
    let req;

    beforeEach(() => {
      req = httpMocks.createRequest({
        query: {},
      });
      res = httpMocks.createResponse();
    });

    it("should return a list of applications", async () => {
      // Mock the Application.countDocuments and Application.find functions
      jest.spyOn(Application, "countDocuments").mockResolvedValue(2);
      jest.spyOn(Application, "find").mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockResolvedValue([{ name: "App 1" }, { name: "App 2" }]),
      });

      await applicationController.getAllApplications(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.data.currentPage).toBe(1);
      expect(responseData.data.pageSize).toBe(10);
      expect(responseData.data.totalCount).toBe(2);
      expect(responseData.data.applications).toHaveLength(2);
      expect(responseData.data.applications[0].name).toBe("App 1");
      expect(responseData.data.applications[1].name).toBe("App 2");
      expect(res.statusCode).toBe(200);

      // Restore the original functions after the test
      Application.countDocuments.mockRestore();
      Application.find.mockRestore();
    });

    it("should handle error when no applications are found", async () => {
      // Mock the Application.countDocuments and Application.find functions
      jest.spyOn(Application, "countDocuments").mockResolvedValue(0);
      jest.spyOn(Application, "find").mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([]),
      });

      await applicationController.getAllApplications(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe("Not Found");
      expect(res.statusCode).toBe(404);

      // Restore the original functions after the test
      Application.countDocuments.mockRestore();
      Application.find.mockRestore();
    });
  });

  describe("getApplicationById", () => {
    let req;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
      });
      res = httpMocks.createResponse();
    });

    it("should return a single application if a valid id is passed", async () => {
      // Mock the Application.findOne function
      jest.spyOn(Application, "findOne").mockResolvedValue({
        _id: req.params.id, // Use the same ID as in the request
        name: "App 1",
      });

      await applicationController.getApplicationById(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.data.name).toBe("App 1");
      expect(res.statusCode).toBe(httpStatus.OK);

      // Restore the original function after the test
      Application.findOne.mockRestore();
    });

    it("should handle error when no application is found", async () => {
      // Mock the Application.findOne function
      jest.spyOn(Application, "findOne").mockResolvedValue(null);

      await applicationController.getApplicationById(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe("Not Found");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);

      // Restore the original function after the test
      Application.findOne.mockRestore();
    });
  });

  describe("createApplication", () => {
    let req;

    beforeEach(() => {
      req = httpMocks.createRequest({
        body: {
          name: "App 1",
          description: "App 1 description",
        },
      });
      res = httpMocks.createResponse();
    });

    it("should create a new application", async () => {
      // Mock the Application.findOne and Application.prototype.save functions
      jest.spyOn(Application, "findOne").mockResolvedValue(null);
      jest.spyOn(Application.prototype, "save").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 1",
        description: "App 1 description",
      });

      await applicationController.createApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe("Created");
      expect(responseData.data.name).toBe("App 1");
      expect(responseData.data.description).toBe("App 1 description");
      expect(res.statusCode).toBe(httpStatus.CREATED);

      // Restore the original functions after the test
      Application.findOne.mockRestore();
      Application.prototype.save.mockRestore();
    });

    it("should handle error when application with the same name already exists", async () => {
      // Mock the Application.findOne function
      jest.spyOn(Application, "findOne").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 1",
        description: "App 1 description",
      });

      await applicationController.createApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe(
        "Application with this name already exists",
      );
      expect(res.statusCode).toBe(httpStatus.CONFLICT);

      // Restore the original function after the test
      Application.findOne.mockRestore();
    });

    it("should handle error when application could not be created", async () => {
      // Mock the Application.findOne and Application.prototype.save functions
      jest.spyOn(Application, "findOne").mockResolvedValue(null);
      jest.spyOn(Application.prototype, "save").mockResolvedValueOnce(null);

      await applicationController.createApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe("Internal Server Error");
      expect(res.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);

      // Restore the original functions after the test
      Application.findOne.mockRestore();
      Application.prototype.save.mockRestore();
    });
  });

  describe("updateApplication", () => {
    let req;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
        body: {
          name: "App 2",
        },
      });
      res = httpMocks.createResponse();
    });

    it("should update an application successfully", async () => {
      // Mock the Application.findOne, Application.findByIdAndUpdate, and Application.save functions
      jest.spyOn(Application, "findOne").mockResolvedValue(null);
      jest.spyOn(Application, "findById").mockResolvedValue({
        _id: req.params.id,
        name: "App 1",
      });
      jest.spyOn(Application, "findByIdAndUpdate").mockResolvedValue({
        _id: req.params.id,
        name: "App 2",
      });
      jest.spyOn(Application.prototype, "save").mockResolvedValue({
        _id: req.params.id, // Use the same ID as in the request
        name: "App 2",
      });

      await applicationController.updateApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(res.statusCode).toBe(httpStatus.OK);
      expect(responseData.message).toBe("OK");
      expect(responseData.data.name).toBe("App 2");

      // Restore the original functions after the test
      Application.findOne.mockRestore();
      Application.findByIdAndUpdate.mockRestore();
      Application.prototype.save.mockRestore();
    });

    it("should handle error when application with the same name already exists", async () => {
      // Mock the Application.findOne function
      jest.spyOn(Application, "findOne").mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        name: "App 2",
        description: "App 2 description",
      });

      await applicationController.updateApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe("Conflict");
      expect(res.statusCode).toBe(httpStatus.CONFLICT);

      // Restore the original function after the test
      Application.findOne.mockRestore();
    });

    it("should handle error when application could not be updated", async () => {
      // Mock the Application.findOne, Application.findByIdAndUpdate, and Application.save functions
      jest.spyOn(Application, "findOne").mockResolvedValue(null);
      jest.spyOn(Application, "findByIdAndUpdate").mockResolvedValueOnce(null);

      await applicationController.updateApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe("Internal Server Error");
      expect(res.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);

      // Restore the original functions after the test
      Application.findOne.mockRestore();
      Application.findByIdAndUpdate.mockRestore();
    });
  });

  describe("deactivateApplication", () => {
    let req;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
      });
      res = httpMocks.createResponse();
    });

    it("should deactivate application successfully", async () => {
      // Mock the Application.findById and Application.save functions

      const application = {
        _id: req.params.id, // Use the same ID as in the request
        name: "App 1",
        description: "App 1 description",
        isActive: false,
        save: jest.fn().mockResolvedValue({
          _id: req.params.id, // Use the same ID as in the request
          name: "App 1",
          description: "App 1 description",
          isActive: false,
        }),
      };

      jest.spyOn(Application, "findById").mockResolvedValue(application);

      await applicationController.deactivateApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(res.statusCode).toBe(httpStatus.OK);
      expect(responseData.message).toBe("OK");
      expect(responseData.data.isActive).toBe(false);

      Application.findById.mockRestore();
    });

    it("should return an error when application could not be deactivated", async () => {
      // Mock the Application.findById and Application.save functions
      jest.spyOn(Application, "findById").mockResolvedValue({
        _id: req.params.id, // Use the same ID as in the request
        name: "App 1",
        description: "App 1 description",
        isActive: false,
        save: jest.fn().mockResolvedValueOnce(null),
      });

      await applicationController.deactivateApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe("Internal Server Error");
      expect(res.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);

      // Restore the original functions after the test
      Application.findById.mockRestore();
    });

    it("should return an error when the application with the given ID was not found", async () => {
      // Mock the Application.findById function
      jest.spyOn(Application, "findById").mockResolvedValue(null);

      await applicationController.deactivateApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe("Not Found");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);

      // Restore the original function after the test
      Application.findById.mockRestore();
    });
  });

  describe("deleteApplication", () => {
    let req;

    beforeEach(() => {
      req = httpMocks.createRequest({
        params: {
          id: new mongoose.Types.ObjectId(),
        },
      });
      res = httpMocks.createResponse();
    });

    it("should delete application successfully", async () => {
      const application = {
        _id: req.params.id, // Use the same ID as in the request
        name: "App 1",
        description: "App 1 description",
        isDeleted: true,
        save: jest.fn().mockResolvedValue({
          _id: req.params.id, // Use the same ID as in the request
          name: "App 1",
          description: "App 1 description",
          isDeleted: true,
        }),
      };

      jest.spyOn(Application, "findById").mockResolvedValue(application);

      await applicationController.deleteApplication(req, res);

      const responseData = JSON.parse(res._getData());

      expect(res.statusCode).toBe(httpStatus.OK);
      expect(responseData.message).toBe("OK");
      expect(responseData.data.isDeleted).toBe(true);
    });

    it("should return an error when the application with the given ID was not found", async () => {
      // Mock the Application.findById function
      jest.spyOn(Application, "findById").mockResolvedValue(null);

      await applicationController.deleteApplication(req, res);

      const responseData = JSON.parse(res._getData());
      expect(responseData.message).toBe("Not Found");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);

      // Restore the original function after the test
      Application.findById.mockRestore();
    });
  });
});
