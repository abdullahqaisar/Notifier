/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const httpStatus = require("http-status");
const config = require("config");
const { Application } = require("../../../../models/mongo/application.model");
const { Notification } = require("../../../../models/mongo/notification.model");
const { Event } = require("../../../../models/mongo/event.model");

let server;
let mockApplication;
let mockEvent;

const createMockApplication = async (name, description) => {
  const application = new Application({
    name,
    description,
  });
  await application.save();
  return application;
};

const createMockEvent = async (name, description, applicationId) => {
  const event = new Event({
    name,
    description,
    applicationId,
  });
  await event.save();
  return event;
};

const createMockNotification = async (
  name,
  description,
  templateBody,
  templateSubject,
  eventId,
) => {
  const notification = new Notification({
    name,
    description,
    templateBody,
    templateSubject,
    eventId,
  });
  await notification.save();
  return notification;
};

describe("Integration Tests - /api/notification", () => {
  beforeEach(() => {
    // eslint-disable-next-line global-require
    server = require("../../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Application.deleteMany({});
    await Event.deleteMany({});
    await Notification.deleteMany({});
  });

  describe("GET /", () => {
    let mockNotification1;
    let mockNotification2;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      mockEvent = await createMockEvent(
        "Mock Event",
        "This is a mock event",
        mockApplication._id,
      );

      mockNotification1 = await createMockNotification(
        "Notification 1",
        "This is a mock notification",
        "Template body 1",
        "Template subject 1",
        mockEvent._id,
      );

      mockNotification2 = await createMockNotification(
        "Notification 2",
        "This is another mock notification",
        "Template body 2",
        "Template subject 2",
        mockEvent._id,
      );
    });

    it("should return all notifications with default parameters", async () => {
      const res = await request(server).get(
        `/api/notifications?eventId=${mockEvent._id}`,
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
          `/api/notifications?eventId=${mockEvent._id}&${query}`,
        );
        expect(res.status).toBe(httpStatus.OK);
        expect(res.body.currentPage).toBe(1);
        expect(res.body.pageSize).toBe(1);
        expect(res.body.totalCount).toBe(2);
        expect(res.body.notifications).toHaveLength(expectedCount);
        expect(res.body.notifications[0].name).toBe(mockNotification1.name);
      },
    );

    it("should handle error if notifications are not found", async () => {
      await Notification.deleteMany({});
      const res = await request(server).get(
        `/api/notifications?eventId=${mockEvent._id}`,
      );

      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe("No notifications found.");
    });
  });

  describe("GET /:id", () => {
    let mockNotification;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      mockEvent = await createMockEvent(
        "Mock Event",
        "This is a mock event",
        mockApplication._id,
      );

      mockNotification = await createMockNotification(
        "Notification 1",
        "This is a mock notification",
        "Template body 1",
        "Template subject 1",
        mockEvent._id,
      );
    });

    it("should return a notification if valid ID is passed", async () => {
      const res = await request(server).get(
        `/api/notifications/${mockNotification._id}`,
      );
      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty("name", mockNotification.name);
      expect(res.body).toHaveProperty(
        "description",
        mockNotification.description,
      );
    });

    it("should return 404 if no notification is found with the given ID", async () => {
      const res = await request(server).get(
        `/api/notifications/${new Notification().id}`,
      );
      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe(
        "The notification with the given ID was not found.",
      );
    });
  });

  describe("POST /", () => {
    let mockEvent;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      mockEvent = await createMockEvent(
        "Mock Event",
        "This is a mock event",
        mockApplication._id,
      );
    });

    const exec = async (notificationData) =>
      request(server).post("/api/notifications").send(notificationData);

    it("should return 201 and successfully create a new notification if data is valid", async () => {
      const notificationData = {
        name: "Notification 1",
        description: "This is a mock notification",
        templateBody: "Template body 1",
        templateSubject: "Template subject 1",
        eventId: mockEvent._id,
      };

      const res = await exec(notificationData);

      expect(res.status).toBe(httpStatus.CREATED);
      expect(res.body).toHaveProperty(
        "message",
        "Notification created successfully.",
      );
      expect(res.body).toHaveProperty(
        "notification.name",
        notificationData.name,
      );
      expect(res.body).toHaveProperty(
        "notification.description",
        notificationData.description,
      );
      // Add more assertions as needed
    });

    it("should return 409 if notification name already exists for the same event", async () => {
      await createMockNotification(
        "Notification 1",
        "This is a mock notification",
        "Template body 1",
        "Template subject 1",
        mockEvent._id,
      );

      const notificationData = {
        name: "Notification 1",
        description: "This is another mock notification",
        templateBody: "Template body 2",
        templateSubject: "Template subject 2",
        eventId: mockEvent._id,
      };

      const res = await exec(notificationData);

      expect(res.status).toBe(httpStatus.CONFLICT);
      // Add more assertions as needed
    });

    it("should return 400 if eventId is missing", async () => {
      const notificationData = {
        name: "Notification 1",
        description: "This is a mock notification",
        templateBody: "Template body 1",
        templateSubject: "Template subject 1",
      };

      const res = await exec(notificationData);

      expect(res.status).toBe(httpStatus.BAD_REQUEST);
      expect(res.text).toBe('"eventId" is required');
    });
  });

  describe("PATCH /:id", () => {
    let mockEvent;
    let mockNotification;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      mockEvent = await createMockEvent(
        "Mock Event",
        "This is a mock event",
        mockApplication._id,
      );

      mockNotification = await createMockNotification(
        "Mock Notification",
        "This is a mock notification",
        "Template body",
        "Template subject",
        mockEvent._id,
      );
    });

    const exec = async (notificationData) =>
      request(server)
        .patch(`/api/notifications/${mockNotification._id}`)
        .send(notificationData);

    it("should return 200 and successfully update a notification if data is valid", async () => {
      const updatedData = {
        name: "Updated Notification",
        description: "This is an updated mock notification",
        templateBody: "Updated template body",
        templateSubject: "Updated template subject",
      };

      const res = await exec(updatedData);

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Notification updated successfully.",
      );
      expect(res.body).toHaveProperty("notification.name", updatedData.name);
      expect(res.body).toHaveProperty(
        "notification.description",
        updatedData.description,
      );
    });

    it("should return 409 if updated notification name already exists for the same event", async () => {
      await createMockNotification(
        "Notification 1",
        "This is a mock notification",
        "Template body 1",
        "Template subject 1",
        mockEvent._id,
      );

      const updatedData = {
        name: "Notification 1",
        description: "This is an updated mock notification",
        templateBody: "Updated template body",
        templateSubject: "Updated template subject",
      };

      const res = await exec(updatedData);

      expect(res.status).toBe(httpStatus.CONFLICT);
      expect(res.text).toBe(
        '{"error":"Notification with the given name already exists."}',
      );
    });

    it("should return 404 if notification is not found with the given id", async () => {
      const res = await request(server).patch(
        `/api/notifications/${new Notification().id}`,
      );
      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe(
        '{"error":"The notification with the given ID was not found"}',
      );
    });
  });

  describe("PATCH /:id/deactivate", () => {
    let mockEvent;
    let mockNotification;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      mockEvent = await createMockEvent(
        "Mock Event",
        "This is a mock event",
        mockApplication._id,
      );

      mockNotification = await createMockNotification(
        "Mock Notification",
        "This is a mock notification",
        "Template body",
        "Template subject",
        mockEvent._id,
      );
    });

    const exec = async () =>
      request(server).patch(
        `/api/notifications/${mockNotification._id}/deactivate`,
      );

    it("should return 200 and successfully deactivate a notification if data is valid", async () => {
      const res = await exec();

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Notification deactivated successfully.",
      );
    });

    it("should return 404 if notification is not found with the given id", async () => {
      const res = await request(server).patch(
        `/api/notifications/${new Notification().id}/deactivate`,
      );
      expect(res.status).toBe(httpStatus.NOT_FOUND);
      expect(res.text).toBe(
        "The notification with the given ID was not found.",
      );
    });
  });

  describe("DELETE /:id", () => {
    let mockEvent;
    let mockNotification;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      mockEvent = await createMockEvent(
        "Mock Event",
        "This is a mock event",
        mockApplication._id,
      );

      mockNotification = await createMockNotification(
        "Mock Notification",
        "This is a mock notification",
        "Template body",
        "Template subject",
        mockEvent._id,
      );
    });

    const exec = async () =>
      request(server).delete(`/api/notifications/${mockNotification._id}`);

    it("should return 200 and successfully delete a notification if data is valid", async () => {
      const res = await exec();

      expect(res.status).toBe(httpStatus.OK);
      expect(res.body).toHaveProperty(
        "message",
        "Notification deleted successfully.",
      );
    });

    it("should return 404 if notification is not found with the given id", async () => {
      const res = await request(server).delete(
        `/api/notifications/${new Notification().id}`,
      );
      expect(res.status).toBe(httpStatus.NOT_FOUND);
    });
  });
});
