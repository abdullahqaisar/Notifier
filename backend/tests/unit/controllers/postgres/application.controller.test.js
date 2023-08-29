/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const httpMocks = require("node-mocks-http");
const httpStatus = require("http-status");
const applicationController = require("../../../../controllers/postgres/application.controller");
const Application = require("../../../../models/postgres/application.model");

describe("Application Controller - Unit Tests", () => {
  let res;

  beforeEach(() => {
    res = httpMocks.createResponse();
  });

  describe("getAllApplications", () => {
    it("should return a list of applications", async () => {
      // Mocking req.query and Application methods
      const req = httpMocks.createRequest({
        query: {},
      });
      Application.count = jest.fn().mockResolvedValue({ totalCount: 2 });
      Application.getAll = jest
        .fn()
        .mockResolvedValue([{ name: "App 1" }, { name: "App 2" }]);

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
      // Mocking req.query and Application methods
      const req = httpMocks.createRequest({
        query: {},
      });
      Application.count = jest.fn().mockResolvedValue({ totalCount: 0 });
      Application.getAll = jest.fn().mockResolvedValue([]);

      await applicationController.getAllApplications(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("No applications found.");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("getApplicationById", () => {
    it("should return an application", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: "1",
        },
      });
      Application.getById = jest.fn().mockResolvedValue({ name: "App 1" });

      await applicationController.getApplicationById(req, res);

      const responseData = res._getData();
      expect(responseData.name).toBe("App 1");
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should handle error when application is not found", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: "1",
        },
      });
      Application.getById = jest.fn().mockResolvedValue(null);

      await applicationController.getApplicationById(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("Application not found.");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("createApplication", () => {
    it("should create an application", async () => {
      const req = httpMocks.createRequest({
        body: {
          name: "App 1",
        },
      });
      Application.getByAppName = jest.fn().mockResolvedValue(null);
      Application.create = jest.fn().mockResolvedValue({ name: "App 1" });

      await applicationController.createApplication(req, res);

      const responseData = res._getData();
      expect(responseData.name).toBe("App 1");
      expect(res.statusCode).toBe(httpStatus.CREATED);
    });

    it("should handle error when application already exists", async () => {
      const req = httpMocks.createRequest({
        body: {
          name: "App 1",
        },
      });
      Application.getByAppName = jest.fn().mockResolvedValue({ name: "App 1" });

      await applicationController.createApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("Application with this name already exists.");
      expect(res.statusCode).toBe(httpStatus.CONFLICT);
    });

    it("should handle error when application could not be created", async () => {
      const req = httpMocks.createRequest({
        body: {
          name: "App 1",
        },
      });
      Application.getByAppName = jest.fn().mockResolvedValue(null);
      Application.create = jest.fn().mockResolvedValue(null);

      await applicationController.createApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("The application could not be created.");
      expect(res.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });
  });

  describe("updateApplication", () => {
    it("should update an application", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: "1",
        },
        body: {
          name: "App 1",
        },
      });
      Application.getByAppName = jest.fn().mockResolvedValue(null);
      Application.update = jest.fn().mockResolvedValue([{ name: "App 1" }]);

      await applicationController.updateApplication(req, res);

      const responseData = res._getData();
      expect(responseData[0].name).toBe("App 1");
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should handle error when application could not be updated", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: "1",
        },
        body: {
          name: "App 1",
        },
      });
      Application.getByAppName = jest.fn().mockResolvedValue(null);
      Application.update = jest.fn().mockResolvedValue([]);

      await applicationController.updateApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("The application could not be updated.");
      expect(res.statusCode).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    });

    it("should handle error when application already exists", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: "1",
        },
        body: {
          name: "App 1",
        },
      });
      Application.getByAppName = jest.fn().mockResolvedValue({ name: "App 1" });

      await applicationController.updateApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("Application with this name already exists.");
      expect(res.statusCode).toBe(httpStatus.CONFLICT);
    });
  });

  describe("deactivateApplication", () => {
    it("should deactivate an application", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: "1",
        },
      });
      Application.deactivate = jest.fn().mockResolvedValue({ name: "App 1" });

      await applicationController.deactivateApplication(req, res);

      const responseData = res._getData();
      expect(responseData.name).toBe("App 1");
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should handle error when application is not found", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: "1",
        },
      });
      Application.deactivate = jest.fn().mockResolvedValue(null);

      await applicationController.deactivateApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("Application not found.");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("deleteApplication", () => {
    it("should delete an application", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: "1",
        },
      });
      Application.delete = jest.fn().mockResolvedValue({ name: "App 1" });

      await applicationController.deleteApplication(req, res);

      const responseData = res._getData();
      expect(responseData.name).toBe("App 1");
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should handle error when application is not found", async () => {
      const req = httpMocks.createRequest({
        params: {
          id: "1",
        },
      });
      Application.delete = jest.fn().mockResolvedValue(null);

      await applicationController.deleteApplication(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("Application not found.");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
    });
  });
});
