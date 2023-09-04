/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const httpStatus = require("http-status");
const mongoose = require("mongoose");
const { Message } = require("../../../../models/mongo/message.model");
const { Notification } = require("../../../../models/mongo/notification.model");

let server;
let mockNotification;

const createMockNotification = async () => {
  const notification = new Notification({
    name: "Mock Notification",
    description: "This is a mock notification",
    templateBody: "Mock template body: {tagName}",
    templateSubject: "Mock template subject",
    eventId: new mongoose.Types.ObjectId(),
  });
  await notification.save();
  return notification;
};

describe("Integration Tests - Message Controller", () => {
  beforeEach(() => {
    // eslint-disable-next-line global-require
    server = require("../../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Notification.deleteMany({});
    await Message.deleteMany({});
  });

  afterAll(async () => {
    await server.close();
    await Notification.deleteMany({});
    await Message.deleteMany({});
  });

  describe("GET /api/messages/:id", () => {
    beforeEach(async () => {
      mockNotification = await createMockNotification();
    });

    it("should return messages with the given notification id", async () => {
      const mockMessages = [
        {
          email: "email1@example.com",
          subject: "Subject 1",
          body: "Body 1",
          notificationId: mockNotification._id,
        },
        {
          email: "email2@example.com",
          subject: "Subject 2",
          body: "Body 2",
          notificationId: mockNotification._id,
        },
      ];
      await Message.insertMany(mockMessages);

      const res = await request(server).get(
        `/api/messages/${mockNotification._id}`,
      );

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveLength(mockMessages.length);
    });

    it("should return 404 if no messages are found with the given notification id", async () => {
      const res = await request(server).get(
        `/api/messages/${mockNotification._id}`,
      );

      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("POST /api/messages", () => {
    beforeEach(async () => {
      mockNotification = await createMockNotification();
    });

    const mockTags = [
      { email: "email1@example.com", tagName: "tagName1" },
      { email: "email2@example.com", tagName: "tagName2" },
    ];

    const exec = async () =>
      request(server).post("/api/messages").send({
        notificationId: mockNotification._id,
        tags: mockTags,
      });

    it("should send messages with populated tags", async () => {
      const res = await exec();

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveLength(mockTags.length);
      expect(res.body[0].email).toBe(mockTags[0].email);
      expect(res.body[0].subject).toBe(mockNotification.templateSubject);
      expect(res.body[0].body).toBe(
        mockNotification.templateBody.replace("{tagName}", mockTags[0].tagName),
      );
    });

    it("should return 404 if notification is not found", async () => {
      const res = await request(server).post("/api/messages").send({
        notificationId: new mongoose.Types.ObjectId(),
        tags: mockTags,
      });

      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });

    it("should return 400 if tags format is invalid", async () => {
      // Change the tags format to a non-array value
      const invalidTags = "invalid_tags_format";
      const res = await request(server).post("/api/messages").send({
        notificationId: mockNotification._id,
        tags: invalidTags,
      });

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
    });
  });
});
