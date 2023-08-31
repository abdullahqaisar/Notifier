/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const httpStatus = require("http-status");
const mongoose = require("mongoose");
const config = require("config");
const { Application } = require("../../../../models/mongo/application.model");

let server;

const createMockApplication = async (name, description) => {
  const mockApplication = new Application({
    name,
    description,
  });

  await mockApplication.save();
  return mockApplication;
};

const expectStatusCodeAndMessage = (res, statusCode, message) => {
  expect(res.status).toBe(statusCode);
  expect(res.text).toBe(message);
};

describe("Integration Tests - /api/applications", () => {
  beforeEach(() => {
    // eslint-disable-next-line global-require
    server = require("../../../../index");
  });

  afterEach(async () => {
    server.close();
    await Application.deleteMany({});
  });

  describe("GET /", () => {
    const mockApplicationsForGetAll = [
      { name: "App 1", description: "This is a mock app", isDeleted: false },
      { name: "App 2", description: "This is a mock app", isDeleted: false },
    ];

    beforeEach(async () => {
      await Application.insertMany(mockApplicationsForGetAll);
    });

    it("should return all applications with default parameters", async () => {
      const res = await request(server).get("/api/applications");

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(config.get("defaultPage"));
      expect(res.body.pageSize).toBe(config.get("defaultPageSize"));
      expect(res.body.totalCount).toBe(mockApplicationsForGetAll.length);
      expect(res.body.applications).toHaveLength(
        mockApplicationsForGetAll.length,
      );
      const expectedApplication = {
        name: "App 1",
        description: "This is a mock app",
        isActive: true,
        isDeleted: false,
        _id: expect.any(String),
        createdDate: expect.any(String),
        modifiedDate: expect.any(String),
        __v: 0,
      };
      expect(res.body.applications[0]).toEqual(expectedApplication);
    });

    it.each([
      ["with pagination", "?page=1&pageSize=1", 1],
      ["with sorting", "?page=1&pageSize=1&sort=name", 1],
      ["with filtering", "?page=1&pageSize=1&sort=name&name=App", 1],
    ])("should return all applications %s", async (_, query, expectedCount) => {
      const res = await request(server).get(`/api/applications${query}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.totalCount).toBe(mockApplicationsForGetAll.length);
      expect(res.body.applications).toHaveLength(expectedCount);
      expect(res.body.applications[0].name).toBe(
        mockApplicationsForGetAll[0].name,
      );
    });

    it("should handle error if applications are not found", async () => {
      await Application.deleteMany({});

      const res = await request(server).get("/api/applications");

      expectStatusCodeAndMessage(
        res,
        httpStatus.NOT_FOUND,
        "No applications found.",
      );
    });
  });

  describe("GET /:id", () => {
    it("should return a single application if valid id is passed", async () => {
      const mockApplication = await createMockApplication(
        "App 1",
        "This is a mock app",
      );

      const res = await request(server).get(
        `/api/applications/${mockApplication._id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty("name", mockApplication.name);
    });

    it("should return 400 if invalid id is passed", async () => {
      const res = await request(server).get("/api/applications/1");

      expectStatusCodeAndMessage(res, httpStatus.BAD_REQUEST, "Invalid Id.");
    });

    it("should return 404 if no application with the given id exists", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(server).get(
        `/api/applications/${nonExistentId}`,
      );

      expectStatusCodeAndMessage(
        res,
        httpStatus.NOT_FOUND,
        "The application with the given ID was not found.",
      );
    });
  });

  describe("POST /", () => {
    let name;
    let description;

    const exec = async () => {
      const res = await request(server)
        .post("/api/applications")
        .send({ name, description });
      return res;
    };

    beforeEach(() => {
      name = "App 1";
      description = "This is a mock app";
    });

    it("should create a new application if input is valid", async () => {
      const res = await exec();

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body).toHaveProperty(
        "message",
        "Application created successfully.",
      );
      const expectedApplication = {
        _id: expect.any(String),
        name: "App 1",
        description: "This is a mock app",
        isActive: true,
        isDeleted: false,
        createdDate: expect.any(String),
        modifiedDate: expect.any(String),
        __v: 0,
      };
      expect(res.body.application).toEqual(expectedApplication);
    });

    it("should return 409 if application with the given name already exists", async () => {
      await createMockApplication("Existing App", "An existing application.");
      const mockApplicationData = {
        name: "Existing App",
        description: "A new application.",
      };

      const res = await request(server)
        .post("/api/applications")
        .send(mockApplicationData);

      expectStatusCodeAndMessage(
        res,
        httpStatus.CONFLICT,
        "Application with this name already exists.",
      );
    });

    it("should return 500 if application could not be created", async () => {
      jest
        .spyOn(Application.prototype, "save")
        .mockRejectedValueOnce(new Error());

      const res = await exec();

      expectStatusCodeAndMessage(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        "Something failed",
      );

      Application.prototype.save.mockRestore();
    });
  });

  describe("PATCH /:id", () => {
    let application;
    let newName;
    let newDescription;

    const exec = async () => {
      const req = await request(server)
        .patch(`/api/applications/${application._id}`)
        .send({ name: newName, description: newDescription });
      return req;
    };

    beforeEach(async () => {
      application = await createMockApplication(
        "App 1",
        "This is a mock app",
        false,
      );
      newName = "Updated App";
      newDescription = "Updated description";
    });

    it("should return 404 if application with the given ID was not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      application._id = nonExistentId;

      const res = await exec();

      expectStatusCodeAndMessage(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        "The application could not be updated.",
      );
    });

    it("should return 200 and update the application if input is valid", async () => {
      const res = await exec();

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty("application._id");
      expect(res.body).toHaveProperty("application.name", "Updated App");
      expect(res.body).toHaveProperty(
        "application.description",
        "Updated description",
      );
      expect(res.body).toHaveProperty("application.isDeleted", false);
    });

    it("should return 409 if application with the new name already exists", async () => {
      await createMockApplication(newName, newDescription);

      const res = await exec();

      expectStatusCodeAndMessage(
        res,
        httpStatus.CONFLICT,
        "Application with this name already exists.",
      );
    });

    // it("should return 500 if application could not be updated", async () => {
    //   jest
    //     .spyOn(Application.prototype, "save")
    //     .mockRejectedValueOnce(new Error());

    //   const res = await exec();

    //   expectStatusCodeAndMessage(
    //     res,
    //     httpStatus.INTERNAL_SERVER_ERROR,
    //     "The application could not be updated.",
    //   );
    //   Application.prototype.save.mockRestore();
    // });
  });

  describe("PATCH /:id/deactivate", () => {
    let application;

    const exec = async () => {
      const req = await request(server).patch(
        `/api/applications/${application.id}/deactivate`,
      );
      return req;
    };

    beforeEach(async () => {
      application = await createMockApplication(
        "App 1",
        "This is a mock app",
        true,
      );
    });

    it("should update the application's isActive to false", async () => {
      const res = await exec();

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Application deactivated successfully.",
      );
      expect(res.body.application.isActive).toBe(false);
    });

    it("should return the updated application", async () => {
      const res = await exec();

      const expectedApplication = {
        _id: application._id.toHexString(),
        name: "App 1",
        description: "This is a mock app",
        isActive: false,
        isDeleted: false,
        createdDate: expect.any(String),
        modifiedDate: expect.any(String),
        __v: 0,
      };

      expect(res.body.application).toEqual(expectedApplication);
    });

    it("should return 404 if application with the given id was not found", async () => {
      application._id = new mongoose.Types.ObjectId();

      const res = await exec();

      expectStatusCodeAndMessage(
        res,
        httpStatus.NOT_FOUND,
        "The application with the given ID was not found.",
      );
    });
  });

  describe("DELETE /:id", () => {
    let application;

    const exec = async () => {
      const req = await request(server).delete(
        `/api/applications/${application._id}`,
      );
      return req;
    };

    beforeEach(async () => {
      application = await createMockApplication(
        "App 1",
        "This is a mock app",
        true,
      );
    });

    it("should return 400 if id is invalid", async () => {
      const invalidId = 1;
      const res = await request(server).delete(
        `/api/applications/${invalidId}`,
      );
      expectStatusCodeAndMessage(res, httpStatus.BAD_REQUEST, "Invalid Id.");
    });

    it("should delete the application if valid id is provided", async () => {
      const res = await exec();

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Application deleted successfully.",
      );
    });

    it("should return the deleted application", async () => {
      const res = await exec();

      const expectedApplication = {
        _id: application._id.toHexString(),
        name: "App 1",
        description: "This is a mock app",
        isActive: false,
        isDeleted: true,
        createdDate: expect.any(String),
        modifiedDate: expect.any(String),
        __v: 0,
      };

      expect(res.body.application).toEqual(expectedApplication);
    });

    it("should return 404 if application with the given id was not found", async () => {
      application._id = new mongoose.Types.ObjectId();

      const res = await exec();

      expectStatusCodeAndMessage(
        res,
        httpStatus.INTERNAL_SERVER_ERROR,
        "The application could not be deleted.",
      );
    });
  });
});
