// /* eslint-disable import/no-extraneous-dependencies */
// /* eslint-disable no-underscore-dangle */
// /* eslint-disable no-undef */
// const httpMocks = require("node-mocks-http");
// const httpStatus = require("http-status");
// const mongoose = require("mongoose");
// const notificationController = require("../../../../controllers/mongo/notification.controller");
// const { Notification } = require("../../../../models/mongo/notification.model");
// const { Event } = require("../../../../models/mongo/event.model");

// describe("Notification Controller Unit Tests", () => {
//   let res;

//   beforeEach(() => {
//     res = httpMocks.createResponse();
//   });

//   describe("getAllNotifications", () => {
//     const req = httpMocks.createRequest({
//       query: {
//         eventId: new mongoose.Types.ObjectId(),
//       },
//     });

//     it("should return a list of all notifications for a given event", async () => {
//       Notification.countDocuments = jest.fn().mockResolvedValue(2);

//       Notification.find = jest.fn().mockReturnValue({
//         sort: jest.fn().mockReturnThis(),
//         skip: jest.fn().mockReturnThis(),
//         limit: jest
//           .fn()
//           .mockResolvedValue([
//             { name: "Notification 1" },
//             { name: "Notification 2" },
//           ]),
//       });

//       await notificationController.getAllNotifications(req, res);
//       const responseData = res._getData();
//       expect(responseData.currentPage).toBe(1);
//       expect(responseData.pageSize).toBe(10);
//       expect(responseData.totalCount).toBe(2);
//       expect(responseData.notifications).toHaveLength(2);
//       expect(responseData.notifications[0].name).toBe("Notification 1");
//       expect(responseData.notifications[1].name).toBe("Notification 2");
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no notification is found", async () => {
//       Notification.countDocuments = jest.fn().mockResolvedValue(0);
//       Notification.find = jest.fn().mockReturnValue({
//         sort: jest.fn().mockReturnThis(),
//         skip: jest.fn().mockReturnThis(),
//         limit: jest.fn().mockResolvedValue([]),
//       });

//       await notificationController.getAllNotifications(req, res);
//       const responseData = res._getData();
//       expect(responseData).toBe("No notifications found.");
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });
//   });

//   describe("getNotificationById", () => {
//     const req = httpMocks.createRequest({
//       params: {
//         id: new mongoose.Types.ObjectId(),
//       },
//     });

//     it("should return a single notification if valid id is passed", async () => {
//       Notification.findById = jest
//         .fn()
//         .mockResolvedValue({ name: "Notification 1" });

//       await notificationController.getNotificationById(req, res);
//       const responseData = res._getData();
//       expect(responseData.name).toBe("Notification 1");
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no notification is found", async () => {
//       Notification.findById = jest.fn().mockResolvedValue(null);

//       await notificationController.getNotificationById(req, res);
//       const responseData = res._getData();
//       expect(responseData).toBe(
//         "The notification with the given ID was not found.",
//       );
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });
//   });

//   describe("createNotification", () => {
//     const req = httpMocks.createRequest({
//       body: {
//         name: "Notification 1",
//         templateBody: "Hello {name}!",
//         eventId: new mongoose.Types.ObjectId(),
//       },
//     });

//     it("should create a new notification if valid request body is passed", async () => {
//       Event.findById = jest.fn().mockResolvedValue({
//         name: "Event 1",
//       });

//       Notification.findOne = jest.fn().mockResolvedValue(null);

//       Notification.prototype.save = jest.fn().mockReturnValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Notification 1",
//         templateBody: "Hello {name}!",
//       });

//       await notificationController.createNotification(req, res);

//       const responseData = res._getData();
//       expect(res.statusCode).toBe(httpStatus.CREATED);
//       expect(responseData.notification._id).toBeDefined();
//       expect(responseData.notification.name).toBe("Notification 1");
//       expect(responseData.notification.templateBody).toBe("Hello {name}!");
//       expect(res.statusCode).toBe(httpStatus.CREATED);
//     });

//     it("should handle error when event is not found", async () => {
//       Event.findById = jest.fn().mockResolvedValue(null);

//       await notificationController.createNotification(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe("The event with the given ID was not found.");
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });

//     it("should handle error when notification with same name already exists", async () => {
//       Event.findById = jest.fn().mockResolvedValue({
//         name: "Event 1",
//       });

//       Notification.findOne = jest.fn().mockResolvedValue({
//         name: "Notification 1",
//       });

//       await notificationController.createNotification(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe(
//         "Notification with the given name already exists.",
//       );
//       expect(res.statusCode).toBe(httpStatus.CONFLICT);
//     });
//   });

//   describe("updateNotification", () => {
//     const req = httpMocks.createRequest({
//       params: {
//         id: new mongoose.Types.ObjectId(),
//       },
//       body: {
//         name: "Notification 1",
//         templateBody: "Hello {name}!",
//       },
//     });

//     it("should update an existing notification if valid request body is passed", async () => {
//       const existingNotification = {
//         _id: new mongoose.Types.ObjectId(),
//         eventId: "valid-event-id",
//         save: jest.fn().mockResolvedValue({
//           _id: new mongoose.Types.ObjectId(),
//           name: "Notification 1",
//           templateBody: "Hello {name}!",
//           modifiedDate: Date.now(),
//         }),
//       };

//       Notification.findById = jest.fn().mockResolvedValue(existingNotification);

//       Notification.findOne = jest.fn().mockResolvedValue(null);

//       await notificationController.updateNotification(req, res);

//       const responseData = res._getData();

//       expect(responseData.notification._id).toBeDefined();
//       expect(responseData.notification.name).toBe("Notification 1");
//       expect(responseData.notification.templateBody).toBe("Hello {name}!");
//       expect(responseData.notification.modifiedDate).toBeDefined();
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no notification is found", async () => {
//       Notification.findById = jest.fn().mockResolvedValue(null);

//       await notificationController.updateNotification(req, res);

//       const responseData = res._getData();
//       expect(responseData).toEqual({
//         error: "The notification with the given ID was not found",
//       });
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });

//     it("should handle error when notification with same name already exists", async () => {
//       Notification.findById = jest.fn().mockResolvedValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Notification 1",
//         templateBody: "Hello {name}!",
//       });

//       Notification.findOne = jest.fn().mockResolvedValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Notification 1",
//         templateBody: "Hello {name}!",
//       });

//       await notificationController.updateNotification(req, res);

//       const responseData = res._getData();
//       expect(responseData).toEqual({
//         error: "Notification with the given name already exists.",
//       });
//       expect(res.statusCode).toBe(httpStatus.CONFLICT);
//     });
//   });

//   describe("deactivateNotification", () => {
//     const req = httpMocks.createRequest({
//       params: {
//         id: new mongoose.Types.ObjectId(),
//       },
//     });

//     it("should deactivate an existing notification if valid id is passed", async () => {
//       Notification.findByIdAndUpdate = jest.fn().mockResolvedValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Notification 1",
//         isActive: false,
//       });

//       await notificationController.deactivateNotification(req, res);

//       const responseData = res._getData();

//       expect(responseData.notification._id).toBeDefined();
//       expect(responseData.notification.name).toBe("Notification 1");
//       expect(responseData.notification.isActive).toBe(false);
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no notification is found", async () => {
//       Notification.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

//       await notificationController.deactivateNotification(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe(
//         "The notification with the given ID was not found.",
//       );
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });
//   });

//   describe("deleteNotification", () => {
//     const req = httpMocks.createRequest({
//       params: {
//         id: new mongoose.Types.ObjectId(),
//       },
//     });

//     it("should delete an existing notification if valid id is passed", async () => {
//       Notification.findByIdAndUpdate = jest.fn().mockResolvedValue({
//         _id: new mongoose.Types.ObjectId(),
//         name: "Notification 1",
//         isActive: false,
//         isDeleted: true,
//       });

//       await notificationController.deleteNotification(req, res);

//       const responseData = res._getData();

//       expect(responseData.notification._id).toBeDefined();
//       expect(responseData.notification.name).toBe("Notification 1");
//       expect(responseData.notification.isActive).toBe(false);
//       expect(responseData.notification.isDeleted).toBe(true);
//       expect(res.statusCode).toBe(httpStatus.OK);
//     });

//     it("should handle error when no notification is found", async () => {
//       Notification.findByIdAndUpdate = jest.fn().mockResolvedValue(null);

//       await notificationController.deleteNotification(req, res);

//       const responseData = res._getData();
//       expect(responseData).toBe(
//         "The notification with the given ID was not found.",
//       );
//       expect(res.statusCode).toBe(httpStatus.NOT_FOUND);
//     });
//   });
// });
