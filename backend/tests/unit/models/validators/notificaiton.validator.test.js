/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */

const {
  validateNotification,
  validateGetAllNotifications,
  validateUpdateNotification,
} = require("../../../../models/validators/notification.validator");

describe("notification.validators", () => {
  describe("validateNotification", () => {
    it("should validate a valid notification data", () => {
      const validData = {
        name: "Valid Notification",
        description: "Valid description.",
        eventId: "event-id",
        templateSubject: "Valid Subject",
        templateBody: "Valid Body",
        notificationTags: ["tagName", "tagName"],
      };

      const { error } = validateNotification(validData);

      expect(error).toBeUndefined();
    });

    it("should invalidate a notification data with missing required fields", () => {
      const invalidData = {
        description: "Valid description.",
      };

      const { error } = validateNotification(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('"name" is required');
    });

    it("should invalidate a notification data with short name", () => {
      const invalidData = {
        name: "Shrt",
        description: "Valid description.",
        eventId: "event-id",
        templateSubject: "Valid Subject",
        templateBody: "Valid Body",
      };

      const { error } = validateNotification(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"name" length must be at least 5 characters long',
      );
    });

    it("should invalidate a notification data with long template subject", () => {
      const invalidData = {
        name: "Valid Notification",
        description: "Valid description.",
        eventId: "event-id",
        templateSubject: "A".repeat(256),
        templateBody: "Valid Body",
      };

      const { error } = validateNotification(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"templateSubject" length must be less than or equal to 255 characters long',
      );
    });
  });

  describe("validateGetAllNotifications", () => {
    it("should validate a valid data with all fields", () => {
      const validData = {
        page: 1,
        pageSize: 10,
        eventId: "1234567890",
        name: "Learning Management",
        sort: "name",
      };
      const { error } = validateGetAllNotifications(validData);
      expect(error).toBeUndefined();
    });

    it("should validate a valid data with missing optional fields", () => {
      const validData = {
        page: 1,
        pageSize: 10,
        eventId: "1234567890",
      };
      const { error } = validateGetAllNotifications(validData);
      expect(error).toBeUndefined();
    });

    it("should invalidate a data with invalid page", () => {
      const invalidData = {
        page: "a",
        pageSize: 10,
        eventId: "1234567890",
      };
      const { error } = validateGetAllNotifications(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"page" must be a number');
    });

    it("should invalidate a data with invalid pageSize", () => {
      const invalidData = {
        page: 1,
        pageSize: "b",
        eventId: "1234567890",
      };
      const { error } = validateGetAllNotifications(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"pageSize" must be a number');
    });

    it("should invalidate a data with missing eventId", () => {
      const invalidData = {
        page: 1,
        pageSize: 10,
      };
      const { error } = validateGetAllNotifications(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"eventId" is required');
    });

    it("should invalidate a data with invalid name", () => {
      const invalidData = {
        page: 1,
        pageSize: 10,
        eventId: "1234567890",
        name: 123,
      };
      const { error } = validateGetAllNotifications(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" must be a string');
    });

    it("should invalidate a data with invalid sort", () => {
      const invalidData = {
        page: 1,
        pageSize: 10,
        eventId: "1234567890",
        sort: 123,
      };
      const { error } = validateGetAllNotifications(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"sort" must be a string');
    });
  });

  describe("validateUpdateNotification", () => {
    it("should validate a valid data with all fields", () => {
      const validData = {
        name: "Learning Management",
        description: "This is a learning management notification",
        templateSubject: "Subject",
        templateBody: "Template Body",
        notificationTags: ["tags1", "tags2"],
      };
      const { error } = validateUpdateNotification(validData);
      expect(error).toBeUndefined();
    });

    it("should validate a valid data with no fields", () => {
      const validData = {};
      const { error } = validateUpdateNotification(validData);
      expect(error).toBeUndefined();
    });

    it("should invalidate a data with invalid name", () => {
      const invalidData = {
        name: 123,
      };
      const { error } = validateUpdateNotification(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" must be a string');
    });

    it("should invalidate a data with invalid description", () => {
      const invalidData = {
        description: 123,
      };
      const { error } = validateUpdateNotification(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"description" must be a string');
    });

    it("should invalidate a data with invalid templateSubject", () => {
      const invalidData = {
        templateSubject: 123,
      };
      const { error } = validateUpdateNotification(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"templateSubject" must be a string',
      );
    });

    it("should invalidate a data with invalid templateBody", () => {
      const invalidData = {
        templateBody: 123,
      };
      const { error } = validateUpdateNotification(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"templateBody" must be a string');
    });

    it("should invalidate a data with invalid notificationTags", () => {
      const invalidData = {
        notificationTags: 123,
      };
      const { error } = validateUpdateNotification(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"notificationTags" must be an array',
      );
    });
  });
});
