/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const httpMocks = require("node-mocks-http");
const mongoose = require("mongoose");
const httpStatus = require("http-status");
const { Message } = require("../../../../models/mongo/message.model");
const { Notification } = require("../../../../models/mongo/notification.model");
const messageController = require("../../../../controllers/mongo/message.controller");

describe("Message Controller Unit Tests", () => {
  let res;

  beforeEach(() => {
    res = httpMocks.createResponse();
  });

  describe("getMessages", () => {
    const req = httpMocks.createRequest({
      params: {
        id: new mongoose.Types.ObjectId(),
      },
    });

    it("should return messages associated with a notification if valid notification ID is passed", async () => {
      Message.find = jest.fn().mockResolvedValue([
        { email: "user@example.com", body: "Message body 1" },
        { email: "user@example.com", body: "Message body 2" },
      ]);

      await messageController.getMessages(req, res);

      const responseData = res._getData();

      expect(responseData).toHaveLength(2);
      expect(responseData[0].email).toBe("user@example.com");
      expect(responseData[0].body).toBe("Message body 1");
      expect(responseData[1].email).toBe("user@example.com");
      expect(responseData[1].body).toBe("Message body 2");
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should handle error when no messages are found for the notification", async () => {
      Message.find = jest.fn().mockResolvedValue([]);

      await messageController.getMessages(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("No messages with this notification id found");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
    });
  });

  describe("sendMessage", () => {
    const req = httpMocks.createRequest({
      body: {
        notificationId: new mongoose.Types.ObjectId(),
        tags: [
          { email: "user1@example.com", name: "User 1" },
          { email: "user2@example.com", name: "User 2" },
        ],
      },
    });

    it("should send messages with populated placeholders if valid request body is passed", async () => {
      const notification = {
        _id: new mongoose.Types.ObjectId(),
        templateBody: "Hello {name}, welcome to our platform!",
        templateSubject: "Welcome to Our Platform",
      };

      Notification.findById = jest.fn().mockResolvedValue(notification);

      const savedMessages = [
        {
          email: "user1@example.com",
          body: "Hello User 1, welcome to our platform!",
        },
        {
          email: "user2@example.com",
          body: "Hello User 2, welcome to our platform!",
        },
      ];

      Message.insertMany = jest.fn().mockResolvedValue(savedMessages);
      await messageController.sendMessage(req, res);

      const responseData = res._getData();

      expect(responseData).toHaveLength(2);
      expect(responseData[0].email).toBe("user1@example.com");
      expect(responseData[0].body).toBe(
        "Hello User 1, welcome to our platform!",
      );
      expect(responseData[1].email).toBe("user2@example.com");
      expect(responseData[1].body).toBe(
        "Hello User 2, welcome to our platform!",
      );
      expect(res.statusCode).toBe(httpStatus.OK);
    });

    it("should handle error when notification is not found", async () => {
      Notification.findById = jest.fn().mockResolvedValue(null);

      await messageController.sendMessage(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("Notification not found.");
      expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
    });

    it("should handle error when messages cannot be stored", async () => {
      const notification = {
        _id: new mongoose.Types.ObjectId(),
        templateBody: "Hello {name}, welcome to our platform!",
        templateSubject: "Welcome to Our Platform",
      };
      Notification.findById = jest.fn().mockResolvedValue(notification);

      Message.insertMany = jest.fn().mockResolvedValue(null);

      await messageController.sendMessage(req, res);

      const responseData = res._getData();

      expect(responseData).toBe("Could not store messages");
      expect(res.statusCode).toBe(httpStatus.BAD_REQUEST);
    });

    it("should handle error when tags format is invalid", async () => {
      const notification = {
        _id: new mongoose.Types.ObjectId(),
        templateBody: "Hello {name}, welcome to our platform!",
        templateSubject: "Welcome to Our Platform",
      };

      Notification.findById = jest.fn().mockResolvedValue(notification);

      req.body.tags = { email: "user@example.com", name: "User" };

      await messageController.sendMessage(req, res);

      const responseData = res._getData();
      expect(responseData).toBe("Invalid tags format.");
      expect(res.statusCode).toBe(httpStatus.BAD_REQUEST);
    });
  });
});
