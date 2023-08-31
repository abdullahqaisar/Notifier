/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
const {
  validateApplication,
  validateGetAllApplications,
  validateUpdateApplication,
} = require("../../../../models/validators/application.validator");

describe("Application Validator Tests", () => {
  describe("validateApplication", () => {
    it("should validate a valid application object", () => {
      const data = {
        name: "Valid App",
        description: "A valid application description.",
      };

      const { error } = validateApplication(data);

      expect(error).toBeUndefined();
    });

    it("should return an error for application name less than 5 characters", () => {
      const data = {
        name: "1234",
        description: "A valid application description.",
      };

      const { error } = validateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"name" length must be at least 5 characters long',
      );
    });

    it("should return an error for application name more than 50 characters", () => {
      const data = {
        name: "a".repeat(51),
        description: "A valid application description.",
      };

      const { error } = validateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"name" length must be less than or equal to 50 characters long',
      );
    });

    it("should return an error for application description less than 5 characters", () => {
      const data = {
        name: "Valid App",
        description: "App",
      };

      const { error } = validateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"description" length must be at least 5 characters long',
      );
    });

    it("should return an error for application description more than 1024 characters", () => {
      const data = {
        name: "Valid App",
        description: "a".repeat(1025),
      };

      const { error } = validateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"description" length must be less than or equal to 1024 characters long',
      );
    });

    it("should return an error for missing application name", () => {
      const data = {
        description: "A valid application description.",
      };

      const { error } = validateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('"name" is required');
    });

    it("should return an error for missing application description", () => {
      const data = {
        name: "Valid App",
      };

      const { error } = validateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('"description" is required');
    });
  });

  describe("validateGetAllApplications", () => {
    it("should validate a valid query object for getting all applications", () => {
      const data = {
        page: 1,
        pageSize: 10,
        isActive: true,
        name: "Search Term",
        sort: "name",
      };

      const { error } = validateGetAllApplications(data);

      expect(error).toBeUndefined();
    });

    it("should validate a valid query object for getting all applications", () => {
      const data = {
        page: 1,
        pageSize: 10,
        isActive: true,
        name: "Search Term",
        sort: "name",
      };

      const { error } = validateGetAllApplications(data);

      expect(error).toBeUndefined();
    });

    it("should return an error for invalid page number", () => {
      const data = {
        page: "invalid",
        pageSize: 10,
        isActive: true,
        name: "Search Term",
        sort: "name",
      };

      const { error } = validateGetAllApplications(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('"page" must be a number');
    });

    it("should return an error for invalid pageSize", () => {
      const data = {
        page: 1,
        pageSize: "invalid",
        isActive: true,
        name: "Search Term",
        sort: "name",
      };

      const { error } = validateGetAllApplications(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('"pageSize" must be a number');
    });
  });

  describe("validateUpdateApplication", () => {
    it("should validate a valid application update object", () => {
      const data = {
        name: "Updated App",
        description: "An updated description.",
      };

      const { error } = validateUpdateApplication(data);

      expect(error).toBeUndefined();
    });

    it("should validate a valid application update object with minimum length name and description", () => {
      const data = {
        name: "App",
        description: "Desc.",
      };

      const { error } = validateUpdateApplication(data);

      // Validation error is expected due to the constraints being violated
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('"name" length must be');
    });

    it("should validate a valid application update object with maximum length name and description", () => {
      const data = {
        name: "A".repeat(51),
        description: "D".repeat(1025),
      };

      const { error } = validateUpdateApplication(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toContain('"name" length must be');
    });

    it("should return an error if name length is less than 5", () => {
      const data = {
        name: "App",
        description: "An updated description.",
      };

      const { error } = validateUpdateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"name" length must be at least 5 characters long',
      );
    });

    it("should return an error if name length is more than 50", () => {
      const data = {
        name: "A".repeat(51),
        description: "An updated description.",
      };

      const { error } = validateUpdateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"name" length must be less than or equal to 50 characters long',
      );
    });

    it("should return an error if description length is less than 5", () => {
      const data = {
        name: "Updated App",
        description: "Desc",
      };

      const { error } = validateUpdateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"description" length must be at least 5 characters long',
      );
    });

    it("should return an error if description length is more than 1024", () => {
      const data = {
        name: "Updated App",
        description: "D".repeat(1025),
      };

      const { error } = validateUpdateApplication(data);

      expect(error).toBeDefined();
      expect(error.details[0].message).toContain(
        '"description" length must be less than or equal to 1024 characters long',
      );
    });
  });
});
