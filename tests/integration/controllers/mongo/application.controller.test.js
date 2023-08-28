/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const httpStatus = require("http-status");
const { Application } = require("../../../../models/mongo/application.model");

let server;

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
    const mockApplications = [
      { name: "App 1", description: "This is a mock app", isDeleted: false },
      { name: "App 2", description: "This is a mock app", isDeleted: false },
    ];

    it("should return all applications", async () => {
      await Application.insertMany(mockApplications);
      const res = await request(server).get("/api/applications");

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(10);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.applications).toHaveLength(2);
      expect(res.body.applications[0].name).toBe("App 1");
      expect(res.body.applications[1].name).toBe("App 2");
    });

    it("should return all applications with pagination", async () => {
      await Application.insertMany(mockApplications);

      const res = await request(server).get(
        "/api/applications?page=1&pageSize=1",
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0].name).toBe("App 1");
    });

    it("should return all applications with sorting", async () => {
      await Application.insertMany(mockApplications);

      const res = await request(server).get(
        "/api/applications?page=1&pageSize=1&sort=name",
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0].name).toBe("App 1");
    });

    it("should return all applications with filtering", async () => {
      await Application.insertMany(mockApplications);

      const res = await request(server).get(
        "/api/applications?page=1&pageSize=1&sort=name&name=App 1",
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.totalCount).toBe(1);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0].name).toBe("App 1");
    });

    it("should handle error if applications are not found", async () => {
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
    it("should return 400 if application name is less than 5 characters", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "App" });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"name" length must be at least 5 characters long');
    });

    it("should return 400 if application name is more than 50 characters", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "a".repeat(51) });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe(
        '"name" length must be less than or equal to 50 characters long',
      );
    });

    it("should return 400 if application description is less than 5 characters", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "App 1", description: "App" });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe(
        '"description" length must be at least 5 characters long',
      );
    });

    it("should return 400 if application description is more than 1024 characters", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "App 1", description: "a".repeat(1025) });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe(
        '"description" length must be less than or equal to 1024 characters long',
      );
    });

    it("should return 409 if application with the given name already exists", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      const mockApplication2 = new Application({
        name: "App 2",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication2.save();

      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "App 2", description: "App 2" });

      expect(res.status).toBe(httpStatus.CONFLICT);
      expect(res.text).toBe("Application with this name already exists.");
    });

    it("should return 404 if application with the given id was not found", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });
      const res = await request(server).patch(
        `/api/applications/${mockApplication._id}`,
      );

      expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(res.text).toBe("The application could not be updated.");
    });

    it("should return 200 if application is updated successfully", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "App 2", description: "App 2 description" });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Application updated successfully.",
      );
      expect(res.body).toHaveProperty("application.name", "App 2");
      expect(res.body).toHaveProperty(
        "application.description",
        "App 2 description",
      );
    });

    it("should return 500 if application could not be updated", async () => {
      const mockApplication = new Application({
        name: "App 1",
        description: "This is a mock app",
        isDeleted: false,
      });

      await mockApplication.save();

      Application.findByIdAndUpdate = jest
        .fn()
        .mockRejectedValueOnce(new Error());

      const res = await request(server)
        .patch(`/api/applications/${mockApplication._id}`)
        .send({ name: "App 2", description: "App 2" });

      expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(res.text).toBe("Something failed");
    });
  });

  describe("DELETE /:id", () => {
    it("should return 404 if application with the given id was not found", async () => {
      const res = await request(server).delete(
        "/api/applications/5f9c2e1a0a8d5a1c5c2e1a0a",
      );

      expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(res.text).toBe("The application could not be deleted.");
    });

    it("should return 200 if application is deleted successfully", async () => {
      const mockApplication = new Application({
        name: "Application 1",
        description: "This is a mock app",
      });

      await mockApplication.save();

      const res = await request(server).delete(
        `/api/applications/${mockApplication._id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Application deleted successfully.",
      );
      expect(res.body).toHaveProperty("application.name", "App 1");
      expect(res.body).toHaveProperty(
        "application.description",
        "This is a mock app",
      );
      expect(res.body).toHaveProperty("application.isDeleted", true);
    });

    // it("should return 500 if application could not be deactivated", async () => {
    //   const mockApplication = new Application({
    //     name: "App 1",
    //     description: "This is a mock app",
    //     isDeleted: false,
    //   });

    //   await mockApplication.save();

    //   jest
    //     .spyOn(Application.prototype, "save")
    //     .mockRejectedValueOnce(new Error());

    //   const res = await request(server).delete(
    //     `/api/applications/${mockApplication._id}`,
    //   );

    //   expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    //   expect(res.text).toBe("Something failed");
    // });
  });
});
