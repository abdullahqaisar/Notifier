/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const mongoose = require("mongoose");
const config = require("config");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { Application } = require("../../../../models/mongo/application.model");
const { get } = require("../../../../routes/application.routes");

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
    await Application.deleteMany({});
  });

  afterAll(async () => {
    await server.close();
  });

  describe("GET /api/applications", () => {
    const mockApplicationsForGetAll = [
      { name: "App 1", description: "This is a mock app", isDeleted: false },
      { name: "App 2", description: "This is a mock app", isDeleted: false },
    ];

    beforeEach(async () => {
      await Application.insertMany(mockApplicationsForGetAll);
    });

    // Test case: should return all applications with default parameters
    it("should return all applications with default parameters", async () => {
      const res = await request(server).get("/api/applications");

      expect(res.status).toBe(StatusCodes.OK);
      const responseData = res.body.data; // Extract the 'data' property from the response

      expect(responseData.currentPage).toBe(config.get("defaultPage"));
      expect(responseData.pageSize).toBe(config.get("defaultPageSize"));
      expect(responseData.totalCount).toBe(mockApplicationsForGetAll.length);
      expect(responseData.applications).toHaveLength(
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
      expect(responseData.applications[0]).toEqual(expectedApplication);
    });

    // Test case: should return all applications with pagination, sorting, and filtering
    it.each([
      ["with pagination", "?page=1&pageSize=1", 1],
      ["with sorting", "?page=1&pageSize=1&sort=name", 1],
      ["with filtering", "?page=1&pageSize=1&sort=name&name=App", 1],
    ])("should return all applications %s", async (_, query, expectedCount) => {
      const res = await request(server).get(`/api/applications${query}`);

      expect(res.status).toBe(StatusCodes.OK);
      const responseData = res.body.data; // Extract the 'data' property from the response

      expect(responseData.currentPage).toBe(1);
      expect(responseData.pageSize).toBe(1);
      expect(responseData.totalCount).toBe(mockApplicationsForGetAll.length);
      expect(responseData.applications).toHaveLength(expectedCount);
      expect(responseData.applications[0].name).toBe(
        mockApplicationsForGetAll[0].name,
      );
    });

    // Test case: should handle error if applications are not found
    it("should handle error if applications are not found", async () => {
      await Application.deleteMany({});

      const res = await request(server).get("/api/applications");

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.NOT_FOUND));
    });
  });

  describe("GET /:id", () => {
    it("should return a single application if a valid ID is passed", async () => {
      const mockApplication = await createMockApplication(
        "App 1",
        "This is a mock app",
      );

      const res = await request(server).get(
        `/api/applications/${mockApplication._id}`,
      );

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.data).toHaveProperty("name", mockApplication.name);
    });

    it("should return 400 if an invalid ID is passed", async () => {
      const res = await request(server).get("/api/applications/1");

      expectStatusCodeAndMessage(res, StatusCodes.BAD_REQUEST, "Invalid Id.");
    });

    it("should return 404 if no application with the given ID exists", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(server).get(
        `/api/applications/${nonExistentId}`,
      );

      expectStatusCodeAndMessage(
        res,
        StatusCodes.NOT_FOUND,
        '{"message":"Not Found"}',
      );
    });

    it("should return 404 if an application with the given ID is marked as deleted", async () => {
      const deletedApplication = await createMockApplication(
        "App 1",
        "This is a mock app",
      );
      deletedApplication.isDeleted = true;
      await deletedApplication.save();

      const res = await request(server).get(
        `/api/applications/${deletedApplication._id}`,
      );

      expectStatusCodeAndMessage(
        res,
        StatusCodes.NOT_FOUND,
        '{"message":"Not Found"}',
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

      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.message).toBe("Created");
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
      expect(res.body.data).toEqual(expectedApplication);
    });

    it("should return 409 if an application with the given name already exists", async () => {
      await createMockApplication("Existing App", "An existing application.");
      const mockApplicationData = {
        name: "Existing App",
        description: "A new application.",
      };

      const res = await request(server)
        .post("/api/applications")
        .send(mockApplicationData);
      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.message).toBe(
        "Application with this name already exists",
      );
    });

    // it("should return 500 if the application could not be created", async () => {
    //   jest
    //     .spyOn(Application.prototype, "save")
    //     .mockRejectedValueOnce(new Error());

    //   const res = await exec();

    //   expectStatusCodeAndMessage(
    //     res,
    //     StatusCodes.INTERNAL_SERVER_ERROR,
    //     "Something failed",
    //   );

    //   await Application.prototype.save.mockRestore();
    // });
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

    it("should return 404 if the application with the given ID was not found", async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      application._id = nonExistentId;

      const res = await exec();

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.NOT_FOUND));
    });

    it("should return 200 and update the application if input is valid", async () => {
      const res = await exec();

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.OK));
      expect(res.body.data).toHaveProperty("_id");
      expect(res.body.data.name).toBe("Updated App");
      expect(res.body.data.description).toBe("Updated description");
      expect(res.body.data.isDeleted).toBe(false);
    });

    it("should return 409 if an application with the new name already exists", async () => {
      await createMockApplication(newName, newDescription);

      const res = await exec();

      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.CONFLICT));
    });

    // it("should return 500 if the application could not be updated", async () => {
    //   // Mocking a scenario where the application could not be updated
    //   jest
    //     .spyOn(Application, "findByIdAndUpdate")
    //     .mockRejectedValueOnce(new Error());

    //   const res = await exec();

    //   expectStatusCodeAndMessage(
    //     res,
    //     StatusCodes.INTERNAL_SERVER_ERROR,
    //     "The application could not be updated.",
    //   );

    //   await Application.findByIdAndUpdate.mockRestore();
    // });
  });

  describe("PATCH /:id/deactivate", () => {
    let application;

    const exec = async () => {
      const req = await request(server).patch(
        `/api/applications/${application._id}/deactivate`,
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

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.OK));
      expect(res.body.data.isActive).toBe(false);
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

      expect(res.body.data).toEqual(expectedApplication);
    });

    it("should return 404 if the application with the given ID was not found", async () => {
      application._id = new mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.NOT_FOUND));
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

    it("should return 400 if the ID is invalid", async () => {
      const invalidId = 1;
      const res = await request(server).delete(
        `/api/applications/${invalidId}`,
      );
      expectStatusCodeAndMessage(res, StatusCodes.BAD_REQUEST, "Invalid Id.");
    });

    it("should delete the application if a valid ID is provided", async () => {
      const res = await exec();

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.OK));
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

      expect(res.body.data).toEqual(expectedApplication);
    });

    it("should return 404 if the application with the given ID was not found", async () => {
      application._id = new mongoose.Types.ObjectId();

      const res = await exec();

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.NOT_FOUND));
    });
  });
});
