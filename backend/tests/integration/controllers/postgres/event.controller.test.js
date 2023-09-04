/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const httpStatus = require("http-status");
const config = require("config");
const knex = require("../../../../startup/knexInstance");
const Application = require("../../../../models/postgres/application.model");
const Event = require("../../../../models/postgres/event.model");

let server;
let mockApplication;

describe("Integration Tests - Event Controller", () => {
  beforeAll(async () => {
    // eslint-disable-next-line global-require
    server = require("../../../../index");
    await knex.migrate.latest();
  });

  afterAll(async () => {
    await server.close();
    await knex.migrate.rollback(true);
    await knex.destroy();
  });

  beforeEach(async () => {
    mockApplication = await Application.create({
      name: "Mock Application",
      description: "This is a mock application",
    });
    await Event.create({
      name: "Event 1",
      description: "This is a mock event",
      applicationId: mockApplication[0].id,
    });

    await Event.create({
      name: "Event 2",
      description: "This is another mock event",
      applicationId: mockApplication[0].id,
    });
  });

  describe("GET /api/events", () => {
    it("should return all events with default parameters", async () => {
      const res = await request(server).get(
        `/api/events?applicationId=${mockApplication[0].id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(config.get("defaultPage"));
      expect(res.body.pageSize).toBe(config.get("defaultPageSize"));
      expect(res.body.totalCount).toBe(2);
      expect(res.body.events).toHaveLength(2);
    });

    it.each([
      ["with pagination", "page=1&pageSize=1", 1],
      ["with sorting", "page=1&pageSize=1&sort=name", 1],
      ["with filtering", "page=1&pageSize=1&sort=name&name=Event", 1],
    ])("should return all events %s", async (_, query, expectedCount) => {
      const res = await request(server).get(
        `/api/events?applicationId=${mockApplication[0].id}&${query}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(1);
      expect(res.body.pageSize).toBe(1);
      expect(res.body.totalCount).toBe(2);
      expect(res.body.events).toHaveLength(expectedCount);
      expect(res.body.events[0].name).toBe("Event 1");
    });

    it("should handle error if events are not found", async () => {
      await knex("events").del();

      const res = await request(server).get(
        `/api/events?applicationId=${mockApplication[0].id}`,
      );

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("No events found.");
    });
  });

  describe("GET /api/events/:id", () => {
    it("should return an event if valid id is passed", async () => {
      const event = await Event.getByEventName("Event 1");

      const res = await request(server).get(`/api/events/${event.id}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.name).toBe("Event 1");
    });

    it("should return 404 if invalid id is passed", async () => {
      const res = await request(server).get("/api/events/1");

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("The event with the given ID was not found.");
    });
  });

  describe("POST /api/events", () => {
    it("should return 400 if applicationId is not provided", async () => {
      const res = await request(server)
        .post("/api/events")
        .send({ name: "Event 3", description: "This is a mock event" });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"applicationId" is required');
    });

    it("should return 400 if applicationId is not found", async () => {
      const res = await request(server).post("/api/events").send({
        name: "Event 3",
        description: "This is a mock event",
        applicationId: "00991",
      });

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("The application with the given ID was not found.");
    });

    it("should create a new event if request is valid", async () => {
      const expectedEvent = {
        name: "Event 3",
        description: "This is a mock event",
        applicationId: mockApplication[0].id,
      };

      const res = await request(server).post("/api/events").send(expectedEvent);
      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.message).toBe("Event created successfully.");
      expect(res.body.event).toMatchObject(expectedEvent);
    });

    it("should handle conflict if event name already exists", async () => {
      const res = await request(server).post("/api/events").send({
        name: "Event 1",
        description: "This is a mock event",
        applicationId: mockApplication[0].id,
      });

      expect(res.status).toBe(httpStatus.CONFLICT);
      expect(res.text).toBe("Application with this name already exists.");
    });
  });

  describe("PATCH /api/events/:id", () => {
    it("should update an event if request is valid", async () => {
      const event = await Event.getByEventName("Event 1");
      const res = await request(server).patch(`/api/events/${event.id}`).send({
        name: "Update Event",
        description: "This is a mock event",
      });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.message).toBe("Event updated successfully.");
      expect(res.body.event[0].name).toBe("Update Event");
    });

    it("should handle conflict if event name already exists", async () => {
      const event = await Event.getByEventName("Event 1");

      const res = await request(server).patch(`/api/events/${event.id}`).send({
        name: "Event 2",
        description: "This is a mock event",
      });

      expect(res.status).toBe(httpStatus.CONFLICT);
      expect(res.text).toBe("Application with this name already exists.");
    });

    it("should handle internal server error if event is not found", async () => {
      jest.spyOn(Event, "update").mockImplementation(() => Promise.resolve([]));

      const res = await request(server).patch("/api/events/1").send({
        name: "Updated Event",
        description: "This is a mock event",
      });

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("The event with the given ID was not found.");
    });
  });

  describe("PATCH /api/events/:id/deactivate", () => {
    it("should deactivate an event if request is valid", async () => {
      const event = await Event.getByEventName("Event 1");
      const res = await request(server).patch(
        `/api/events/${event.id}/deactivate`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.message).toBe("Event deactivated successfully.");
    });

    it("should handle internal server error if event is not found", async () => {
      jest
        .spyOn(Event, "deactivate")
        .mockImplementation(() => Promise.resolve([]));

      const res = await request(server).patch("/api/events/1/deactivate");

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("The event with the given ID was not found.");
    });
  });

  describe("DELETE /api/events/:id", () => {
    it("should delete an event if request is valid", async () => {
      const event = await Event.getByEventName("Event 1");
      const res = await request(server).delete(`/api/events/${event.id}`);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.message).toBe("Event deleted successfully.");
    });

    it("should handle internal server error if event is not found", async () => {
      jest.spyOn(Event, "delete").mockImplementation(() => Promise.resolve([]));

      const res = await request(server).delete("/api/events/1");

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("The event with the given ID was not found.");
    });
  });
});
