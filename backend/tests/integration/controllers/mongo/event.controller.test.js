/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const request = require("supertest");
const config = require("config");
const mongoose = require("mongoose");
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { Application } = require("../../../../models/mongo/application.model");
const { Event } = require("../../../../models/mongo/event.model");

let server;
let mockApplication;
const createMockApplication = async (name, description) => {
  const application = new Application({
    name,
    description,
  });
  await application.save();
  return application;
};

const createMockEvent = async (name, description) => {
  const event = new Event({
    name,
    description,
    applicationId: mockApplication._id,
  });
  await event.save();
  return event;
};

describe("Integration Tests - /api/events", () => {
  beforeEach(() => {
    // eslint-disable-next-line global-require
    server = require("../../../../index");
  });

  afterEach(async () => {
    await server.close();
    await Event.deleteMany({});
    await Application.deleteMany({});
  });

  describe("GET /api/events", () => {
    let event1;
    let event2;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      event1 = await createMockEvent(
        "Event 1",
        "This is a mock event",
        mockApplication._id,
      );
      event2 = await createMockEvent(
        "Event 2",
        "This is another mock event",
        mockApplication._id,
      );
    });

    it("should return all events with default parameters", async () => {
      const res = await request(server).get(
        `/api/events?applicationId=${mockApplication.id}`,
      );

      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.OK));
      expect(res.body.data.currentPage).toBe(config.get("defaultPage"));
      expect(res.body.data.pageSize).toBe(config.get("defaultPageSize"));
      expect(res.body.data.totalCount).toBe(2);
      expect(res.body.data.events).toHaveLength(2);
    });

    it.each([
      ["with pagination", "page=1&pageSize=1", 1],
      ["with sorting", "page=1&pageSize=1&sort=name", 1],
      ["with filtering", "page=1&pageSize=1&sort=name&name=Event", 1],
    ])("should return all events %s", async (_, query, expectedCount) => {
      const res = await request(server).get(
        `/api/events?applicationId=${mockApplication.id}&${query}`,
      );
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.OK));
      expect(res.body.data.currentPage).toBe(1);
      expect(res.body.data.pageSize).toBe(1);
      expect(res.body.data.totalCount).toBe(2);
      expect(res.body.data.events).toHaveLength(expectedCount);
      expect(res.body.data.events[0].name).toBe(event1.name);
    });

    it("should handle error if events are not found", async () => {
      await Event.deleteMany({});
      const res = await request(server).get(
        `/api/events?applicationId=${mockApplication.id}`,
      );

      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe(getReasonPhrase(StatusCodes.NOT_FOUND));
    });
  });

  describe("GET /api/events/:id", () => {
    let event;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      event = await createMockEvent(
        "Event 1",
        "This is a mock event",
        mockApplication._id,
      );
    });

    it("should return an event if valid id is passed", async () => {
      const res = await request(server).get(`/api/events/${event._id}`);
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.data).toHaveProperty("name", event.name);
      expect(res.body.data).toHaveProperty("description", event.description);
    });

    it("should return 404 if no event is found with the given id", async () => {
      const res = await request(server).get(`/api/events/${new Event().id}`);
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe("Event not found");
    });
  });

  describe("POST /api/events", () => {
    let event;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      event = {
        name: "Event 1",
        description: "This is a mock event",
        applicationId: mockApplication._id,
      };
    });

    const exec = async () => request(server).post("/api/events").send(event);

    it("should return 201 and successfully create a new event if data is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(StatusCodes.CREATED);
      expect(res.body.message).toBe("Event created successfully.");
      expect(res.body.event).toHaveProperty("name", event.name);
      expect(res.body.event).toHaveProperty("description", event.description);
      expect(res.body.event).toHaveProperty("applicationId");
    });

    it("should return 409 if event name already exists in the same application", async () => {
      await createMockEvent(
        "Event 1",
        "This is a mock event",
        mockApplication._id,
      );
      const res = await exec();
      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.body.message).toBe(
        "An event with this name already exists in this application.",
      );
    });

    it("should return 400 if applicationId is missing", async () => {
      delete event.applicationId;
      const res = await exec();
      expect(res.status).toBe(StatusCodes.BAD_REQUEST);
      expect(res.text).toBe('"applicationId" is required');
    });

    it("should return 404 if application with the given applicationId is not found", async () => {
      event.applicationId = new mongoose.Types.ObjectId();
      const res = await exec();
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe("Application not found");
    });

    // it("should return 500 if event could not be created", async () => {
    //   jest.spyOn(Event.prototype, "save").mockRejectedValueOnce(new Error());
    //   const res = await exec();
    //   expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    //   expect(res.body.message).toBe("The event could not be created.");
    //   Event.prototype.save.mockRestore();
    // });
  });

  describe("PATCH /api/events/:id", () => {
    let event;
    let updatedEvent;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      event = await createMockEvent(
        "Event 1",
        "This is a mock event",
        mockApplication._id,
      );

      updatedEvent = {
        name: "Updated Event",
        description: "This is an updated mock event",
      };
    });

    const exec = async () => {
      const res = await request(server)
        .patch(`/api/events/${event._id}`)
        .send(updatedEvent);
      return res;
    };

    it("should return 200 and successfully update an event if data is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe("Event updated successfully.");
      expect(res.body.event).toHaveProperty("name", updatedEvent.name);
      expect(res.body.event).toHaveProperty(
        "description",
        updatedEvent.description,
      );
    });

    it("should return 409 if event name already exists in the same application", async () => {
      await createMockEvent(
        "Event 2",
        "This is a mock event",
        mockApplication._id,
      );
      updatedEvent.name = "Event 2";

      const res = await exec();
      expect(res.status).toBe(StatusCodes.CONFLICT);
      expect(res.text).toBe(
        "An event with this name already exists in this application.",
      );
    });

    it("should return 404 if no event is found with the given id", async () => {
      const res = await request(server).patch(`/api/events/${new Event().id}`);
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.text).toBe("The event with the given ID was not found");
    });

    // it("should return 500 if an error occurs while updating the event", async () => {
    //   jest.spyOn(Event.prototype, "save").mockRejectedValueOnce(new Error());
    //   const res = await exec();
    //   expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    //   expect(res.body.error).toBe("An error occurred while updating the event");
    //   Event.prototype.save.mockRestore();
    // });
  });

  describe("PATCH /api/events/:id/deactivate", () => {
    let event;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      event = await createMockEvent(
        "Event 1",
        "This is a mock event",
        mockApplication._id,
      );
    });

    const exec = async () =>
      request(server).patch(`/api/events/${event._id}/deactivate`);

    it("should return 200 and successfully deactivate an event if data is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe("Event deactivated successfully.");
      expect(res.body.event.isActive).toBe(false);
    });

    it("should return 404 if no event is found with the given id", async () => {
      const res = await request(server).patch(
        `/api/events/${new Event().id}/deactivate`,
      );
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe("Event not found");
    });

    // it("should return 500 if an error occurs while deactivating the event", async () => {
    //   jest.spyOn(Event.prototype, "save").mockRejectedValueOnce(new Error());
    //   const res = await exec();
    //   expect(res.status).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    //   expect(res.body.error).toBe(
    //     "An error occurred while deactivating the event",
    //   );
    //   Event.prototype.save.mockRestore();
    // });
  });

  describe("DELETE /api/events/:id", () => {
    let event;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      event = await createMockEvent(
        "Event 1",
        "This is a mock event",
        mockApplication._id,
      );
    });

    const exec = async () => request(server).delete(`/api/events/${event._id}`);

    it("should return 200 and successfully delete an event if data is valid", async () => {
      const res = await exec();
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe("Event deleted successfully.");
      expect(res.body.event.isActive).toBe(false);
      expect(res.body.event.isDeleted).toBe(true);
    });

    it("should return 404 if no event is found with the given id", async () => {
      const res = await request(server).delete(`/api/events/${new Event().id}`);
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe(
        "The event with the given ID was not found.",
      );
    });
  });

  describe("DELETE /api/events", () => {
    let event1;
    let event2;
    let event3;

    beforeEach(async () => {
      mockApplication = await createMockApplication(
        "Mock Application",
        "This is a mock application",
      );

      event1 = await createMockEvent(
        "Event 1",
        "This is a mock event",
        mockApplication._id,
      );
      event2 = await createMockEvent(
        "Event 2",
        "This is another mock event",
        mockApplication._id,
      );
      event3 = await createMockEvent(
        "Event 3",
        "This is a third mock event",
        mockApplication._id,
      );
    });

    const exec = async (eventIds) =>
      request(server).delete("/api/events").send({ eventIds });

    it("should return 200 and successfully delete multiple events if data is valid", async () => {
      const res = await exec([event1._id, event2._id]);
      expect(res.status).toBe(StatusCodes.OK);
      expect(res.body.message).toBe("Events deleted successfully.");
      expect(res.body.deletedCount).toBe(2);
    });

    it("should return 404 if no event is found with the given id", async () => {
      const res = await exec([new Event().id]);
      expect(res.status).toBe(StatusCodes.NOT_FOUND);
      expect(res.body.message).toBe(
        "No events with the provided IDs were found.",
      );
    });
  });
});
