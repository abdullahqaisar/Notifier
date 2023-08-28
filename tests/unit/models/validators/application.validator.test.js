/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */

const {
  validateApplication,
  validateGetAllApplications,
  validateUpdateApplication,
} = require("../../../../models/validators/application.validator");

describe("application.validators", () => {
  describe("validateApplication", () => {
    it("should validate a valid application data", () => {
      const data = {
        name: "Learning Management",
        description: "This is a learning management application",
      };
      const { error } = validateApplication(data);
      expect(error).toBeUndefined();
    });

    it("should invalidate an application data with missing required fields", () => {
      const data = {
        name: "Learning Management",
      };
      const { error } = validateApplication(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"description" is required');
    });

    it("should invalidate an application data with short name", () => {
      const data = {
        name: "Shor",
        description: "This is a short name",
      };
      const { error } = validateApplication(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"name" length must be at least 5 characters long',
      );
    });

    it("should ivalidate an application data with long description", () => {
      const data = {
        name: "LearningMS",
        description: "A".repeat(1025),
      };
      const { error } = validateApplication(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"description" length must be less than or equal to 1024 characters long',
      );
    });
  });

  describe("validateGetAllApplications", () => {
    it("should validate a valid data with all fields", () => {
      const validData = {
        page: 1,
        pageSize: 10,
        isActive: true,
        name: "Valid Name",
        sort: "name",
      };

      const { error } = validateGetAllApplications(validData);

      expect(error).toBeUndefined();
    });

    it("should validate a valid data with minimal fields", () => {
      const validData = {
        page: 1,
        pageSize: 10,
      };

      const { error } = validateGetAllApplications(validData);

      expect(error).toBeUndefined();
    });

    it("should invalidate data with negative page", () => {
      const invalidData = {
        page: -1,
        pageSize: 10,
      };

      const { error } = validateGetAllApplications(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"page" must be greater than or equal to 1',
      );
    });

    it("should invalidate data with non-integer pageSize", () => {
      const invalidData = {
        page: 1,
        pageSize: 10.5,
      };

      const { error } = validateGetAllApplications(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"pageSize" must be an integer',
      );
    });

    it("should invalidate data with invalid sort field", () => {
      const invalidData = {
        page: 1,
        pageSize: 10,
        sort: "",
      };

      const { error } = validateGetAllApplications(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"sort" is not allowed to be empty',
      );
    });
  });

  describe("validateUpdateApplication", () => {
    it("should validate a valid update data", () => {
      const validData = {
        name: "Updated Name",
        description: "Updated description.",
      };

      const { error } = validateUpdateApplication(validData);

      expect(error).toBeUndefined();
    });

    it("should validate an update data with missing fields", () => {
      const validData = {}; // Empty object is allowed for partial updates

      const { error } = validateUpdateApplication(validData);

      expect(error).toBeUndefined();
    });

    it("should invalidate an update data with short name", () => {
      const invalidData = {
        name: "Shrt",
      };

      const { error } = validateUpdateApplication(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"name" length must be at least 5 characters long',
      );
    });

    it("should invalidate an update data with long description", () => {
      const invalidData = {
        description: "A".repeat(1025),
      };

      const { error } = validateUpdateApplication(invalidData);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"description" length must be less than or equal to 1024 characters long',
      );
    });
  });
});
