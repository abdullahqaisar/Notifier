/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const httpStatus = require("http-status");
const knex = require("../../../../startup/knexInstance");
const Application = require("../../../../models/postgres/application.model");
const Event = require("../../../../models/postgres/event.model");
const Notification = require("../../../../models/postgres/notification.model");
const Message = require("../../../../models/postgres/message.model");
const server = require("../../../../index"); // Make sure to export your server properly

describe("Integration Tests - Message Controller", () => {
  let mockApplication;
  let mockEvent;
  let mockNotification;

  beforeAll(async () => {
    await knex.migrate.latest();
  });

  afterAll(async () => {
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
      applicationId: mockApplication.id,
    });

    mockNotification = await Notification.create({
      name: "Notification 1",
      description: "This is a mock notification",
      templateSubject: "Mock Notification Subject",
      templateBody: "Mock Notification Body",
      eventId: mockEvent.id,
    });

    const messages = await Message.insertManyByNotificationId(
      mockNotification[0].id,
      [
        {
          email: "abc@gmail.com",
          subject: "Mock Notification Subject",
          body: "Mock Notification Body",
        },
        {
          email: "abd@gmail.com",
          subject: "Mock Notification Subject 2",
          body: "Mock Notification Body 2",
        },
      ],
    );
  });

  describe("GET /api/messages/:id", () => {
    it("should return messages with the given notification id", async () => {
      const res = await request(server).get(
        `/api/messages/${mockNotification[0].id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(Number),
            email: expect.any(String),
            subject: expect.any(String),
            body: expect.any(String),
            notificationId: expect.any(Number),
          }),
        ]),
      );
    });

    it("should return 404 if no messages are found with the given notification id", async () => {
      const res = await request(server).get("/api/messages/999");

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("No messages with this notification id found");
    });
  });

  describe("POST /api/messages", () => {
    it("should send messages with populated tags", async () => {
      const res = await request(server)
        .post("/api/messages")
        .send({
          notificationId: mockNotification[0].id,
          tags: [
            {
              email: "abdullah@gmail.com",
              name: "Abdullah",
              event: "Event 1",
            },
            {
              email: "abc@gmail.com",
              name: "ABC",
              event: "Event 1",
            },
          ],
        });

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body[0]).toEqual(
        expect.objectContaining({
          email: "abdullah@gmail.com",
          subject: expect.any(String),
          body: expect.any(String),
        }),
      );
    });

    it("should return 404 if notification is not found", async () => {
      const res = await request(server)
        .post("/api/messages")
        .send({
          notificationId: 999,
          tags: [
            {
              email: "abc@gmail.com",
              name: "ABC",
              event: "Event 1",
            },
          ],
        });

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("Notification not found.");
    });

    it("should return 400 if tags format is invalid", async () => {
      const res = await request(server)
        .post("/api/messages")
        .send({
          notificationId: mockNotification[0].id,
          tags: {
            email: "abc@gmail.com",
            name: "ABC",
            event: "Event 1",
          },
        });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"tags" must be an array');
    });
  });
});
