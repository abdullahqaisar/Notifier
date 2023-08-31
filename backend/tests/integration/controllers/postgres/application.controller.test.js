/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const httpStatus = require("http-status");
const config = require("config");
const knex = require("../../../../startup/knexInstance");
const app = require("../../../../index");
const Application = require("../../../../models/postgres/application.model");

let mockApplication;

describe("Integration Tests - Application Controller", () => {
  beforeAll(async () => {
    await knex.migrate.latest();
  });

  afterAll(async () => {
    await knex.migrate.rollback(true);
    await knex.destroy();
    app.close();
  });

  beforeEach(async () => {
    await knex("applications").del();
    mockApplication = await Application.create({
      name: "Mock Application",
      description: "This is a mock application",
    });

    mockApplication[0].createdDate =
      mockApplication[0].createdDate.toISOString();
    mockApplication[0].modifiedDate =
      mockApplication[0].modifiedDate.toISOString();
  });

  describe("GET /api/applications", () => {
    afterEach(async () => {
      await knex("applications").del();
    });

    it("should return all applications with default parameters", async () => {
      const res = await request(app).get("/api/applications");

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(config.get("defaultPage"));
      expect(res.body.pageSize).toBe(config.get("defaultPageSize"));
      expect(res.body.totalCount).toBe(1);
      expect(res.body.applications).toHaveLength(res.body.totalCount);
      expect(res.body.applications[0]).toMatchObject(mockApplication[0]);
    });

    it("should return applications with pagination", async () => {
      const res = await request(app).get("/api/applications?page=1&pageSize=2");

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(2);
      expect(res.body.totalCount).toBeGreaterThan(0);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0]).toMatchObject(mockApplication[0]);
    });

    it("should return applications with sorting", async () => {
      const res = await request(app).get("/api/applications?sort=name:asc");

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0]).toMatchObject(mockApplication[0]);
    });

    it("should return applications with filtering", async () => {
      const res = await request(app).get("/api/applications?name=App");

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.applications).toHaveLength(1);
      expect(res.body.applications[0]).toMatchObject(mockApplication[0]);
    });

    it("should handle error if no applications are found", async () => {
      await knex("applications").del();

      const res = await request(app).get("/api/applications");

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("No applications found.");
    });
  });

  describe("GET /api/applications/:id", () => {
    it("should return an application with the given id", async () => {
      const res = await request(app).get(
        `/api/applications/${mockApplication[0].id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toMatchObject(mockApplication[0]);
    });

    it("should handle error if application is not found", async () => {
      const nonExistentId = "990099";

      const res = await request(app).get(`/api/applications/${nonExistentId}`);

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("Application not found.");
    });
  });

  describe("POST /api/applications", () => {
    it("should create a new application", async () => {
      const newApplicationData = {
        name: "New Application",
        description: "This is a new application",
      };

      const res = await request(app)
        .post("/api/applications")
        .send(newApplicationData);

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.name).toBe(newApplicationData.name);
      expect(res.body.description).toBe(newApplicationData.description);

      // Assert that the application was actually created in the database
      const createdApplication = await Application.getById(res.body.id);
      expect(createdApplication).toMatchObject(newApplicationData);
    });

    it("should handle conflict if application name already exists", async () => {
      const existingApplicationData = {
        name: "Existing Application",
        description: "This is an existing application",
      };

      await Application.create(existingApplicationData);

      const res = await request(app)
        .post("/api/applications")
        .send(existingApplicationData);

      expect(res.status).toBe(httpStatus.CONFLICT);
      expect(res.text).toBe("Application with this name already exists.");
    });

    it("should handle internal server error if application could not be created", async () => {
      jest
        .spyOn(Application, "create")
        .mockImplementation(() => Promise.resolve(null));

      const newApplicationData = {
        name: "New Application",
        description: "This is a new application",
      };

      const res = await request(app)
        .post("/api/applications")
        .send(newApplicationData);

      expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(res.text).toBe("The application could not be created.");

      jest.spyOn(Application, "create").mockRestore();
    });
  });

  describe("PATCH /api/applications/:id", () => {
    it("should update an existing application", async () => {
      const mockApplicationData = {
        name: "Mock Application",
        description: "This is a mock application",
      };
      const createdApplication = await Application.create(mockApplicationData);

      const updatedApplicationData = {
        name: "Updated Application",
        description: "This is an updated application",
      };

      const res = await request(app)
        .patch(`/api/applications/${createdApplication[0].id}`)
        .send(updatedApplicationData);
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body[0].name).toBe(updatedApplicationData.name);
      expect(res.body[0].description).toBe(updatedApplicationData.description);
    });

    it("should handle conflict if updated application name already exists", async () => {
      const existingApplicationData = {
        name: "Existing Application",
        description: "This is an existing application",
      };
      const conflictingApplicationData = {
        name: "Conflicting Application",
        description: "This is a conflicting application",
      };

      await Application.create(existingApplicationData);
      const conflictingApplication = await Application.create(
        conflictingApplicationData,
      );

      // Attempt to update conflicting application with existing application's name
      const res = await request(app)
        .patch(`/api/applications/${conflictingApplication[0].id}`)
        .send(existingApplicationData);

      expect(res.status).toBe(httpStatus.CONFLICT);
      expect(res.text).toBe("Application with this name already exists.");
    });

    it("should handle internal server error if application update fails", async () => {
      jest
        .spyOn(Application, "update")
        .mockImplementation(() => Promise.resolve([]));

      const mockApplicationData = {
        name: "Mock Application",
        description: "This is a mock application",
      };
      const createdApplication = await Application.create(mockApplicationData);

      const updatedApplicationData = {
        name: "Updated Application",
        description: "This is an updated application",
      };

      const res = await request(app)
        .patch(`/api/applications/${createdApplication[0].id}`)
        .send(updatedApplicationData);

      expect(res.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
      expect(res.text).toBe("The application could not be updated.");

      jest.spyOn(Application, "update").mockRestore();
    });
  });

  describe("PATCH /api/applications/:id/deactivate", () => {
    it("should deactivate an existing application", async () => {
      const mockApplicationData = {
        name: "Mock Application",
        description: "This is a mock application",
      };
      const createdApplication = await Application.create(mockApplicationData);

      const res = await request(app).patch(
        `/api/applications/${createdApplication[0].id}/deactivate`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body[0].isActive).toBe(false);
    });

    it("should handle error if application is not found", async () => {
      const nonExistentId = "990099";

      const res = await request(app).patch(
        `/api/applications/${nonExistentId}/deactivate`,
      );

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("Application not found.");
    });
  });

  describe("DELETE /api/applications/:id", () => {
    it("should delete an existing application", async () => {
      const mockApplicationData = {
        name: "Mock Application",
        description: "This is a mock application",
      };
      const createdApplication = await Application.create(mockApplicationData);

      const res = await request(app).delete(
        `/api/applications/${createdApplication[0].id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body[0].isDeleted).toBe(true);
    });

    it("should handle error if application is not found", async () => {
      const nonExistentId = "990099";

      const res = await request(app).delete(
        `/api/applications/${nonExistentId}`,
      );

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("Application not found.");
    });
  });
});
