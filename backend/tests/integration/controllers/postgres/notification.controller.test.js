/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */

const request = require("supertest");
const httpStatus = require("http-status");
const config = require("config");
const knex = require("../../../../startup/knexInstance");
const Application = require("../../../../models/postgres/application.model");
const Event = require("../../../../models/postgres/event.model");
const Notification = require("../../../../models/postgres/notification.model");

let server;
let mockApplication;
let mockEvent;
let mockNotification;

describe("Integration Tests - Notification Controller", () => {
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

    mockEvent = await Event.create({
      name: "Event 1",
      description: "This is a mock event",
      applicationId: mockApplication[0].id,
    });

    mockNotification = await Notification.create({
      name: "Notification 1",
      description: "This is a mock notification",
      templateSubject: "Mock Notification",
      templateBody: "This is a mock notification",
      eventId: mockEvent[0].id,
    });

    await Notification.create({
      name: "Notification 2",
      description: "This is another mock notification",
      templateSubject: "Mock Notification",
      templateBody: "This is a mock notification",
      eventId: mockEvent[0].id,
    });
  });

  describe("GET /api/notifications", () => {
    it("should return all notifications with default parameters", async () => {
      const res = await request(server).get(
        `/api/notifications?eventId=${mockEvent[0].id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.currentPage).toBe(config.get("defaultPage"));
      expect(res.body.pageSize).toBe(config.get("defaultPageSize"));
      expect(res.body.totalCount).toBe(2);
      expect(res.body.notifications).toHaveLength(2);
    });

    it.each([
      ["with pagination", "page=1&pageSize=1", 1],
      ["with sorting", "page=1&pageSize=1&sort=name", 1],
      ["with filtering", "page=1&pageSize=1&sort=name&name=Notification", 1],
    ])(
      "should return all notifications %s",
      async (_, query, expectedCount) => {
        const res = await request(server).get(
          `/api/notifications?eventId=${mockEvent[0].id}&${query}`,
        );

        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.currentPage).toBe(1);
        expect(res.body.pageSize).toBe(1);
        expect(res.body.totalCount).toBe(2);
        expect(res.body.notifications).toHaveLength(expectedCount);
        expect(res.body.notifications[0].name).toBe("Notification 1");
      },
    );

    it("should handle error if notifications are not found", async () => {
      await knex("notifications").del();
      const res = await request(server).get(
        `/api/notifications?eventId=${mockEvent[0].id}`,
      );

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("No notifications found.");
    });
  });

  describe("GET /api/notifications/:id", () => {
    it("should return a notification if valid ID is passed", async () => {
      const res = await request(server).get(
        `/api/notifications/${mockNotification[0].id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.name).toBe("Notification 1");
    });

    it("should return 404 if invalid ID is passed", async () => {
      const res = await request(server).get("/api/notifications/1");

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe(
        "The notification with the given ID was not found.",
      );
    });
  });

  describe("POST /api/notifications", () => {
    it("should return 400 if eventId is not provided", async () => {
      const res = await request(server).post("/api/notifications").send({
        name: "New Notification",
        description: "This is a new notification",
        templateSubject: "New Notification Subject",
        templateBody: "New Notification Body",
      });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"eventId" is required');
    });

    it("should return 400 if eventId is not found", async () => {
      const nonExistingEventId = "00991";
      const res = await request(server).post("/api/notifications").send({
        name: "New Notification",
        description: "This is a new notification",
        templateSubject: "New Notification Subject",
        templateBody: "New Notification Body",
        eventId: nonExistingEventId,
      });

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("The event with the given ID was not found.");
    });

    it("should create a new notification if request is valid", async () => {
      const expectedNotification = {
        name: "New Notification",
        description: "This is a new notification",
        templateSubject: "New Notification Subject",
        templateBody: "New Notification Body",
        eventId: mockEvent[0].id,
      };

      const res = await request(server)
        .post("/api/notifications")
        .send(expectedNotification);

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body.name).toBe("New Notification");
      expect(res.body.eventId).toBe(expectedNotification.eventId);
    });

    it("should handle conflict if notification name already exists", async () => {
      const res = await request(server).post("/api/notifications").send({
        name: "Notification 1",
        description: "This is a new notification",
        templateSubject: "New Notification Subject",
        templateBody: "New Notification Body",
        eventId: mockEvent[0].id,
      });

      expect(res.status).toBe(httpStatus.CONFLICT);
      expect(res.text).toBe(
        "The notification with the given name already exists.",
      );
    });
  });

  describe("PATCH /api/notifications/:id", () => {
    it("should update a notification if request is valid", async () => {
      const updatedNotification = {
        name: "Updated Notification",
        description: "This is an updated notification",
        templateSubject: "Updated Notification Subject",
        templateBody: "Updated Notification Body",
      };
      const res = await request(server)
        .patch(`/api/notifications/${mockNotification[0].id}`)
        .send(updatedNotification);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.message).toBe("Notification updated successfully.");
      expect(res.body.updatedNotification[0]).toMatchObject(
        updatedNotification,
      );
    });

    it("should handle conflict if notification name already exists", async () => {
      const notification = await Notification.getByNotificationName(
        "Notification 1",
      );

      const res = await request(server)
        .patch(`/api/notifications/${notification.id}`)
        .send({
          name: "Notification 2",
          description: "This is an updated notification",
          templateSubject: "Updated Notification Subject",
          templateBody: "Updated Notification Body",
        });

      expect(res.status).toBe(httpStatus.CONFLICT);
      expect(res.text).toBe(
        "The notification with the given name already exists.",
      );
    });

    it("should handle internal server error if notification is not found", async () => {
      jest
        .spyOn(Notification, "update")
        .mockImplementation(() => Promise.resolve([]));

      const res = await request(server).patch("/api/notifications/1").send({
        name: "Notification",
        description: "This is an updated notification",
        templateSubject: "Updated Notification Subject",
        templateBody: "Updated Notification Body",
      });

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe(
        "The notification with the given ID was not found.",
      );
    });
  });

  describe("PATCH /api/notifications/:id/deactivate", () => {
    it("should deactivate a notification if request is valid", async () => {
      const notification = await Notification.getByNotificationName(
        "Notification 1",
      );
      const res = await request(server).patch(
        `/api/notifications/${notification.id}/deactivate`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.message).toBe("Notification deactivated successfully.");
    });

    it("should handle internal server error if notification is not found", async () => {
      jest
        .spyOn(Notification, "deactivate")
        .mockImplementation(() => Promise.resolve([]));

      const res = await request(server).patch(
        "/api/notifications/1/deactivate",
      );

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe(
        "The notification with the given ID was not found.",
      );
    });
  });

  describe("DELETE /api/notifications/:id", () => {
    it("should delete a notification if request is valid", async () => {
      const notification = await Notification.getByNotificationName(
        "Notification 1",
      );
      const res = await request(server).delete(
        `/api/notifications/${notification.id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body.message).toBe("Notification deleted successfully.");
    });

    it("should handle internal server error if notification is not found", async () => {
      jest
        .spyOn(Notification, "delete")
        .mockImplementation(() => Promise.resolve([]));

      const res = await request(server).delete("/api/notifications/1");

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe(
        "The notification with the given ID was not found.",
      );
    });
  });
});
