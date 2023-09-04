// /* eslint-disable import/no-extraneous-dependencies */
// /* eslint-disable no-underscore-dangle */
// /* eslint-disable no-undef */
// const httpMocks = require("node-mocks-http");
// const httpStatus = require("http-status");
// const mongoose = require("mongoose");
// const eventController = require("../../../../controllers/mongo/event.controller");
// const { Event } = require("../../../../models/mongo/event.model");
// const { Application } = require("../../../../models/mongo/application.model");

// describe("Event Controller Unit Tests", () => {
//   let res;

//   beforeEach(() => {
//     res = httpMocks.createResponse();
//   });

//   describe("getAllEvents", () => {
//     const req = httpMocks.createRequest({
//       query: {
//         applicationId: new mongoose.Types.ObjectId(),
//       },
//     });
//     it("should return a list of all events for a given application", async () => {
//       Event.countDocuments = jest.fn().mockResolvedValue(2);

//       Event.find = jest.fn().mockReturnValue({
//         sort: jest.fn().mockReturnThis(),
//         skip: jest.fn().mockReturnThis(),
//         limit: jest
//           .fn()
//           .mockResolvedValue([{ name: "Event 1" }, { name: "Event 2" }]),
//       });

//       await eventController.getAllEvents(req, res);
//       const responseData = res._getData();
//       expect(responseData.currentPage).toBe(1);
//       expect(responseData.pageSize).toBe(10);
//       expect(responseData.totalCount).toBe(2);
//       expect(responseData.events).toHaveLength(2);
//       expect(responseData.events[0].name).toBe("Event 1");
//       expect(responseData.events[1].name).toBe("Event 2");
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no event is found", async () => {
//       Event.countDocuments = jest.fn().mockResolvedValue(0);
//       Event.find = jest.fn().mockReturnValue({
//         sort: jest.fn().mockReturnThis(),
//         skip: jest.fn().mockReturnThis(),
//         limit: jest.fn().mockResolvedValue([]),
//       });

//       await eventController.getAllEvents(req, res);
//       const responseData = res._getData();
//       expect(responseData).toBe("No events found.");
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });
//   });

//   describe("getEventById", () => {
//     const req = httpMocks.createRequest({
//       params: {
//         id: new mongoose.Types.ObjectId(),
//       },
//     });

//     it("should return a single event if valid id is passed", async () => {
//       Event.findById = jest.fn().mockResolvedValue({ name: "Event 1" });

//       await eventController.getEventById(req, res);
//       const responseData = res._getData();
//       expect(responseData.name).toBe("Event 1");
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no event is found", async () => {
//       Event.findById = jest.fn().mockResolvedValue(null);

//       await eventController.getEventById(req, res);
//       const responseData = res._getData();
//       expect(responseData).toBe("The event with the given ID was not found.");
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });
//   });

//   describe("createEvent", () => {
//     const req = httpMocks.createRequest({
//       body: {
//         name: "Event 1",
//         description: "Event 1 description",
//         applicationId: new mongoose.Types.ObjectId(),
//       },
//     });

//     it("should create a new event if valid request body is passed", async () => {
//       Application.findById = jest.fn().mockResolvedValue({
//         name: "Application 1",
//       });

//       Event.findOne = jest.fn().mockResolvedValue(null);

//       Event.prototype.save = jest.fn().mockReturnValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Event 1",
//         description: "Event 1 description",
//       });

//       await eventController.createEvent(req, res);

//       const responseData = res._getData();
//       expect(res.statusCode).toBe(httpStatus.CREATED);
//       expect(responseData.event._id).toBeDefined();
//       expect(responseData.event.name).toBe("Event 1");
//       expect(responseData.event.description).toBe("Event 1 description");
//       expect(res.statusCode).toBe(httpStatus.CREATED);
//     });

//     it("should handle error when application is not found", async () => {
//       Application.findById = jest.fn().mockResolvedValue(null);

//       await eventController.createEvent(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe(
//         "The application with the given ID was not found.",
//       );
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });

//     it("should handle error when event with same name already exists", async () => {
//       Application.findById = jest.fn().mockResolvedValue({
//         name: "Application 1",
//       });

//       Event.findOne = jest.fn().mockResolvedValue({
//         name: "Event 1",
//       });

//       await eventController.createEvent(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe(
//         "An event with this name already exists in this application.",
//       );
//       expect(res.statusCode).toBe(httpStatus.CONFLICT);
//     });
//   });

//   describe("updateEvent", () => {
//     const req = httpMocks.createRequest({
//       params: {
//         id: new mongoose.Types.ObjectId(),
//       },
//       body: {
//         name: "Event 1",
//         description: "Event 1 description",
//       },
//     });

//     it("should update an existing event if valid request body is passed", async () => {
//       const existingEvent = {
//         _id: new mongoose.Types.ObjectId(),
//         applicationId: "valid-application-id",
//         save: jest.fn().mockResolvedValue({
//           _id: new mongoose.Types.ObjectId(),
//           name: "Event 1",
//           description: "Event 1 description",
//           modifiedDate: Date.now(),
//         }),
//       };

//       Event.findById = jest.fn().mockResolvedValue(existingEvent);
//       Event.findOne = jest.fn().mockResolvedValue(null);

//       await eventController.updateEvent(req, res);

//       const responseData = res._getData();

//       expect(responseData.event._id).toBeDefined();
//       expect(responseData.event.name).toBe("Event 1");
//       expect(responseData.event.description).toBe("Event 1 description");
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no event is found", async () => {
//       Event.findById = jest.fn().mockResolvedValue(null);

//       await eventController.updateEvent(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe("The event with the given ID was not found");
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });

//     it("should handle error when event with same name already exists", async () => {
//       Event.findById = jest.fn().mockResolvedValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Event 1",
//         description: "Event 1 description",
//       });

//       Event.findOne = jest.fn().mockResolvedValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Event 1",
//         description: "Event 1 description",
//       });

//       await eventController.updateEvent(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe(
//         "An event with this name already exists in this application.",
//       );
//       expect(res.statusCode).toBe(httpStatus.CONFLICT);
//     });

//     // it("should handle internal server error during event update", async () => {
//     //   const mockEvent = {
//     //     _id: "event-id",
//     //     applicationId: "app-id",
//     //     name: "Old Event Name",
//     //     isDeleted: false,
//     //     save: jest
//     //       .spyOn(Event.prototype, "save")
//     //       .mockRejectedValue(new Error("Database error")),
//     //   };

//     //   Event.findById = jest.fn().mockResolvedValue(mockEvent);
//     //   Event.findOne = jest.fn().mockResolvedValue(null);

//     //   const res = {
//     //     status: jest.fn().mockReturnThis(),
//     //     send: jest.fn(),
//     //   };

//     //   await eventController.updateEvent(req, res);

//     //   expect(Event.findById).toHaveBeenCalledWith("event-id");
//     //   expect(Event.findOne).toHaveBeenCalledWith({
//     //     name: "Updated Event Name",
//     //     applicationId: "app-id",
//     //     isDeleted: false,
//     //     _id: { $ne: "event-id" },
//     //   });
//     //   expect(mockEvent.save).toHaveBeenCalled();
//     //   expect(res.status).toHaveBeenCalledWith(httpStatus.INTERNAL_SERVER_ERROR);
//     //   expect(res.send).toHaveBeenCalledWith({
//     //     error: "An error occurred while updating the event",
//     //   });

//     //   // Restore the original save function
//     //   mockEvent.save.mockRestore();
//     // });
//   });

//   describe("deactivateEvent", () => {
//     const req = httpMocks.createRequest({
//       params: {
//         id: new mongoose.Types.ObjectId(),
//       },
//     });

//     it("should deactivate an existing event if valid id is passed", async () => {
//       Event.findByIdAndUpdate = jest.fn().mockResolvedValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Event 1",
//         description: "Event 1 description",
//         isActive: false,
//       });

//       await eventController.deactivateEvent(req, res);

//       const responseData = res._getData();

//       expect(responseData.event._id).toBeDefined();
//       expect(responseData.event.name).toBe("Event 1");
//       expect(responseData.event.description).toBe("Event 1 description");
//       expect(responseData.event.isActive).toBe(false);
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no event is found", async () => {
//       Event.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

//       await eventController.deactivateEvent(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe("The event with the given ID was not found.");
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });
//   });

//   describe("deleteEvent", () => {
//     const req = httpMocks.createRequest({
//       params: {
//         id: new mongoose.Types.ObjectId(),
//       },
//     });

//     it("should delete an existing event if valid id is passed", async () => {
//       Event.findByIdAndUpdate = jest.fn().mockResolvedValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Event 1",
//         description: "Event 1 description",
//         isActive: false,
//         isDeleted: true,
//       });

//       await eventController.deleteEvent(req, res);

//       const responseData = res._getData();

//       expect(responseData.event._id).toBeDefined();
//       expect(responseData.event.name).toBe("Event 1");
//       expect(responseData.event.description).toBe("Event 1 description");
//       expect(responseData.event.isActive).toBe(false);
//       expect(responseData.event.isDeleted).toBe(true);
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no event is found", async () => {
//       Event.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

//       await eventController.deleteEvent(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe("The event with the given ID was not found.");
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });
//   });

//   describe("deleteMultipleEvents", () => {
//     const req = httpMocks.createRequest({
//       body: {
//         eventIds: [
//           new mongoose.Types.ObjectId(),
//           new mongoose.Types.ObjectId(),
//         ],
//       },
//     });

//     it("should delete multiple events if valid request body is passed", async () => {
//       Event.updateMany = jest.fn().mockResolvedValue({
//         nModified: 2,
//       });

//       await eventController.deleteMultipleEvents(req, res);

//       const responseData = res._getData();

//       expect(responseData.message).toBe("Events deleted successfully.");
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no events are found", async () => {
//       Event.updateMany = jest.fn().mockResolvedValue({
//         nModified: 0,
//       });

//       await eventController.deleteMultipleEvents(req, res);

//       const responseData = res._getData();
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//       expect(responseData).toBe("No events with the provided IDs were found.");
//     });
//   });
// });
