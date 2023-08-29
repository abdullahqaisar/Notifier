/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const httpStatus = require("http-status");
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

const expectBadRequest = (res, message) => {
  expect(res.status).toBe(httpStatus.BAD_REQUEST);
  expect(res.text).toBe(message);
};

const expectConflict = (res, message) => {
  expect(res.status).toBe(httpStatus.CONFLICT);
  expect(res.text).toBe(message);
};

const expectInternalServerError = (res, message) => {
  expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
  expect(res.text).toBe(message);
};

const expectNotFound = (res, message) => {
  expect(res.status).toBe(httpStatus.NOT_FOUND);
  expect(res.text).toBe(message);
};

describe("/api/applications - Integration Tests", () => {
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

    it("should return all applications", async () => {
      const res = await request(server).get("/api/applications");

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(10);
      expect(res.body.totalCount).toBe(mockApplicationsForGetAll.length);
      expect(res.body.applications).toHaveLength(
        mockApplicationsForGetAll.length,
      );
      expect(res.body.applications[0].name).toBe(
        mockApplicationsForGetAll[0].name,
      );
      expect(res.body.applications[1].name).toBe(
        mockApplicationsForGetAll[1].name,
      );
    });

    it("should return all applications with pagination", async () => {
      const res = await request(server).get(
        "/api/applications?page=1&pageSize=1",
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.totalCount).toBe(mockApplicationsForGetAll.length);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0].name).toBe(
        mockApplicationsForGetAll[0].name,
      );
    });

    it("should return all applications with sorting", async () => {
      const res = await request(server).get(
        "/api/applications?page=1&pageSize=1&sort=name",
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.totalCount).toBe(mockApplicationsForGetAll.length);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0].name).toBe(
        mockApplicationsForGetAll[0].name,
      );
    });

    it("should return all applications with filtering", async () => {
      const res = await request(server).get(
        "/api/applications?page=1&pageSize=1&sort=name&name=App 1",
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.totalCount).toBe(1);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0].name).toBe(
        mockApplicationsForGetAll[0].name,
      );
    });

    it("should handle error if applications are not found", async () => {
      await Application.deleteMany({});

      const res = await request(server).get("/api/applications");

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("No applications found.");
    });

    it("should handle error if page is invalid", async () => {
      const res = await request(server).get("/api/applications?page=one");

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"page" must be a number');
    });

    it("should handle error if pageSize is invalid", async () => {
      const res = await request(server).get("/api/applications?pageSize=one");

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"pageSize" must be a number');
    });
  });

  describe("GET /:id", () => {
    const mockApplicationsForGetById = [
      { name: "App 1", description: "This is a mock app", isDeleted: false },
      { name: "App 2", description: "This is a mock app", isDeleted: false },
    ];

    beforeEach(async () => {
      await Application.insertMany(mockApplicationsForGetById);
    });

    it("should return a single application if valid id is passed", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      const res = await request(server).get(
        `/api/applications/${mockApplication._id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty("name", mockApplication.name);
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(server).get("/api/applications/1");

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe("Invalid Id.");
    });

    it("should return 404 if no application with the given id exists", async () => {
      const res = await request(server).get(
        "/api/applications/5f9c2e1a0a8d5a1c5c2e1a0a",
      );

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("The application with the given ID was not found.");
    });
  });

  describe("POST /", () => {
    it("should return 400 if application name is less than 5 characters", async () => {
      const res = await request(server)
        .post("/api/applications")
        .send({ name: "App" });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"name" length must be at least 5 characters long');
    });

    it("should return 400 if application name is more than 50 characters", async () => {
      const res = await request(server)
        .post("/api/applications")
        .send({ name: "a".repeat(51) });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe(
        '"name" length must be less than or equal to 50 characters long',
      );
    });

    it("should return 400 if application description is less than 5 characters", async () => {
      const res = await request(server)
        .post("/api/applications")
        .send({ name: "App 1", description: "App" });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe(
        '"description" length must be at least 5 characters long',
      );
    });

    it("should return 400 if application description is more than 1024 characters", async () => {
      const res = await request(server)
        .post("/api/applications")
        .send({ name: "App 1", description: "a".repeat(1025) });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe(
        '"description" length must be less than or equal to 1024 characters long',
      );
    });

    it("should return 400 if application name is not provided", async () => {
      const res = await request(server)
        .post("/api/applications")
        .send({ description: "App 1" });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"name" is required');
    });

    it("should return 400 if application description is not provided", async () => {
      const res = await request(server)
        .post("/api/applications")
        .send({ name: "App 1" });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"description" is required');
    });

    it("should return 409 if application with the given name already exists", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      const res = await request(server)
        .post("/api/applications")
        .send({ name: "App 1", description: "App 1" });

      expect(res.status).toBe(httpStatus.CONFLICT);
      expect(res.text).toBe("Application with this name already exists.");
    });

    it("should return 201 if application is created successfully", async () => {
      const res = await request(server)
        .post("/api/applications")
        .send({ name: "App 1", description: "App 1" });

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body).toHaveProperty("application._id");
      expect(res.body).toHaveProperty("application.name", "App 1");
      expect(res.body).toHaveProperty("application.description", "App 1");
      expect(res.body).toHaveProperty("application.isDeleted", false);
    });

    it("should return 500 if application could not be created", async () => {
      jest
        .spyOn(Application.prototype, "save")
        .mockRejectedValueOnce(new Error());

      const res = await request(server)
        .post("/api/applications")
        .send({ name: "App 1", description: "App 1" });

      expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(res.text).toBe("Something failed");
    });
  });

  describe("PATCH /:id", () => {
    afterEach(async () => {
      await Application.deleteMany({});
    });

    it("should return 400 if application name is less than 5 characters", async () => {
      const application = await createMockApplication(
        "App 1",
        "This is a mock app",
      );
      const res = await request(server)
        .patch(`/api/applications/${application.id}`)
        .send({ name: "App" });

      expectBadRequest(res, '"name" length must be at least 5 characters long');
    });

    it("should return 400 if application name is more than 50 characters", async () => {
      const mockApplication = await createMockApplication(
        "App 1",
        "This is a mock app",
      );
      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "a".repeat(51) });

      expectBadRequest(
        res,
        '"name" length must be less than or equal to 50 characters long',
      );
    });

    it("should return 400 if application description is less than 5 characters", async () => {
      const mockApplication = await createMockApplication(
        "App 1",
        "This is a mock app",
      );
      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "App 1", description: "App" });

      expectBadRequest(
        res,
        '"description" length must be at least 5 characters long',
      );
    });

    it("should return 400 if application description is more than 1024 characters", async () => {
      const mockApplication = await createMockApplication(
        "App 1",
        "This is a mock app",
      );
      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "App 1", description: "a".repeat(1025) });

      expectBadRequest(
        res,
        '"description" length must be less than or equal to 1024 characters long',
      );
    });

    it("should return 409 if application with the given name already exists", async () => {
      const mockApplication1 = await createMockApplication(
        "App 1",
        "This is a mock app",
      );
      await createMockApplication("App 2", "This is a mock app");

      const res = await request(server)
        .patch(`/api/applications/${mockApplication1._id}`)
        .send({ name: "App 2", description: "App 2" });

      expectConflict(res, "Application with this name already exists.");
    });

    it("should return 404 if application with the given id was not found", async () => {
      const app = new Application({
        name: "App 1",
        description: "This is a mock app",
      });
      const res = await request(server).patch(`/api/applications/${app.id}`);
      expectInternalServerError(res, "The application could not be updated.");
    });

    it("should return 200 if application is updated successfully", async () => {
      const application = await createMockApplication(
        "App 100",
        "This is a mock app",
      );
      const res = await request(server)
        .patch(`/api/applications/${application.id}`)
        .send({ name: "App 200", description: "App 2 description" });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Application updated successfully.",
      );
      expect(res.body).toHaveProperty("application.name", "App 200");
      expect(res.body).toHaveProperty(
        "application.description",
        "App 2 description",
      );
    });
  });

  describe("PATCH /:id/deactivate", () => {
    it("should return 200 if application is deactivated successfully", async () => {
      const mockApplication = await createMockApplication(
        "App 1",
        "This is a mock app",
      );

      const res = await request(server).patch(
        `/api/applications/${mockApplication._id}/deactivate`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Application deactivated successfully.",
      );
      expect(res.body).toHaveProperty("application.name", "App 1");
      expect(res.body).toHaveProperty(
        "application.description",
        "This is a mock app",
      );
      expect(res.body).toHaveProperty("application.isActive", false);
    });

    it("should return 404 if application with the given id was not found", async () => {
      const res = await request(server).patch(
        "/api/applications/5f9c2e1a0a8d5a1c5c2e1a0a/deactivate",
      );

      expectNotFound(res, "The application with the given ID was not found.");
    });

    // it("should return 500 if application could not be deactivated", async () => {
    //   const mockApplication = new Application({
    //     name: "App 1",
    //     description: "This is a mock app",
    //     isDeleted: false,
    //   });

    //   Application.findByIdAndUpdate = jest
    //     .fn()
    //     .mockRejectedValueOnce(new Error());

    //   const res = await request(server).patch(
    //     `/api/applications/${mockApplication._id}/deactivate`,
    //   );

    //   expectInternalServerError(res, "Something failed");
    //   Application.findByIdAndUpdate = "";
    // });
  });

  describe("DELETE /:id", () => {
    beforeEach(async () => {
      // Insert mock applications that are not marked as deleted
      await Application.insertMany([
        {
          name: "App 1",
          description: "This is a mock app",
          isDeleted: false,
        },
        {
          name: "App 2",
          description: "This is another mock app",
          isDeleted: false,
        },
      ]);
    });

    it("should return 200 if application is deleted successfully", async () => {
      const application = await createMockApplication(
        "App 3",
        "Yet another mock app",
      );

      const res = await request(server).delete(
        `/api/applications/${application.id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Application deleted successfully.",
      );
      expect(res.body).toHaveProperty("application.name", "App 3");
      expect(res.body).toHaveProperty(
        "application.description",
        "Yet another mock app",
      );
      expect(res.body).toHaveProperty("application.isDeleted", true);
    });

    it("should return 404 if application with the given id was not found", async () => {
      const res = await request(server).delete(
        "/api/applications/5f9c2e1a0a8d5a1c5c2e1a0a",
      );

      expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(res.text).toBe("The application could not be deleted.");
    });

    it("should return 500 if application could not be deactivated", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      Application.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValueOnce(new Error());

      const res = await request(server).delete(
        `/api/applications/${mockApplication._id}`,
      );

      expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(res.text).toBe("Something failed");
      Application.findByIdAndUpdate = "";
    });
  });
});
