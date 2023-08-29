/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */

const {
  validateEvent,
  validateGetAllEvents,
  validateUpdateEvent,
  validateDeleteMultipleEvents,
} = require("../../../../models/validators/event.validator");

describe("event.validators", () => {
  describe("validateEvent", () => {
    it("should validate a valid event data", () => {
      const data = {
        name: "Learning Management",
        description: "This is a learning management event",
        applicationId: "1234567890",
      };
      const { error } = validateEvent(data);
      expect(error).toBeUndefined();
    });

    it("should invalidate an event data with missing required fields", () => {
      const data = {
        name: "Learning Management",
      };
      const { error } = validateEvent(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"description" is required');
    });

    it("should invalidate an event data with short name", () => {
      const data = {
        name: "Shor",
        description: "This is a short name",
        applicationId: "1234567890",
      };
      const { error } = validateEvent(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"name" length must be at least 5 characters long',
      );
    });

    it("should ivalidate an event data with long description", () => {
      const data = {
        name: "LearningMS",
        description: "A".repeat(1025),
        applicationId: "1234567890",
      };
      const { error } = validateEvent(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"description" length must be less than or equal to 1024 characters long',
      );
    });
  });

  describe("validateGetAllEvents", () => {
    it("should validate a valid data with all fields", () => {
      const validData = {
        page: 1,
        pageSize: 10,
        name: "Learning Management",
        sort: "name",
        applicationId: "1234567890",
      };
      const { error } = validateGetAllEvents(validData);
      expect(error).toBeUndefined();
    });

    it("should validate a valid data with no fields", () => {
      const validData = { applicationId: "1234567890" };
      const { error } = validateGetAllEvents(validData);
      expect(error).toBeUndefined();
    });

    it("should invalidate a data with invalid page", () => {
      const invalidData = {
        page: "a",
        pageSize: 10,
        name: "Learning Management",
        sort: "name",
        applicationId: "1234567890",
      };
      const { error } = validateGetAllEvents(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"page" must be a number');
    });

    it("should invalidate a data with invalid pageSize", () => {
      const invalidData = {
        page: 1,
        pageSize: "bb",
        name: "Learning Management",
        sort: "name",
        applicationId: "1234567890",
      };
      const { error } = validateGetAllEvents(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"pageSize" must be a number');
    });

    it("should invalidate a data with invalid name", () => {
      const invalidData = {
        page: 1,
        pageSize: 10,
        name: 123,
        sort: "name",
        applicationId: "1234567890",
      };
      const { error } = validateGetAllEvents(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" must be a string');
    });

    it("should invalidate a data with invalid sort", () => {
      const invalidData = {
        page: 1,
        pageSize: 10,
        name: "Learning Management",
        sort: 123,
        applicationId: "1234567890",
      };
      const { error } = validateGetAllEvents(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"sort" must be a string');
    });

    it("should invalidate a data with no applicationId", () => {
      const invalidData = {
        page: 1,
        pageSize: 10,
        name: "Learning Management",
        sort: "name",
      };
      const { error } = validateGetAllEvents(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"applicationId" is required');
    });
  });

  describe("validateUpdateEvent", () => {
    it("should validate a valid data with all fields", () => {
      const validData = {
        name: "Learning Management",
        description: "This is a learning management event",
      };
      const { error } = validateUpdateEvent(validData);
      expect(error).toBeUndefined();
    });

    it("should validate a valid data with no fields", () => {
      const validData = {};
      const { error } = validateUpdateEvent(validData);
      expect(error).toBeUndefined();
    });

    it("should invalidate a data with invalid name", () => {
      const invalidData = {
        name: 123,
        description: "This is a learning management event",
      };
      const { error } = validateUpdateEvent(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"name" must be a string');
    });

    it("should invalidate a data with invalid description", () => {
      const invalidData = {
        name: "Learning Management",
        description: 123,
      };
      const { error } = validateUpdateEvent(invalidData);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"description" must be a string');
    });
  });

  describe("validateDeleteMultipleEvents", () => {
    it("should validate a valid data with all fields", () => {
      const validData = {
        eventIds: ["1234567890", "1234567890"],
      };
      const { error } = validateDeleteMultipleEvents(validData);
      expect(error).toBeUndefined();
    });
  });
});
