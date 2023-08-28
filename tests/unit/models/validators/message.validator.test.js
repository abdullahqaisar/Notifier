/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */

const {
  validateMessage,
} = require("../../../../models/validators/message.validator");

describe("message.validators", () => {
  describe("validateMessage", () => {
    it("should validate a valid message data", () => {
      const data = {
        notificationId: "1234567890",
        tags: [
          {
            email: "abdullahqaisar@gmail.com",
            course: "LMS",
          },
        ],
      };
      const { error } = validateMessage(data);
      expect(error).toBeUndefined();
    });

    it("should invalidate a message data with missing required fields", () => {
      const data = {
        notificationId: "1234567890",
      };
      const { error } = validateMessage(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"tags" is required');
    });

    it("should invalidate a message data with missing notificationId", () => {
      const data = {
        tags: [
          {
            email: "",
            course: "LMS",
          },
        ],
      };
      const { error } = validateMessage(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe('"notificationId" is required');
    });

    it("should invalidate a message data with invalid tags", () => {
      const data = {
        notificationId: "1234567890",
        tags: [
          {
            email: "",
            course: "LMS",
          },
        ],
      };
      const { error } = validateMessage(data);
      expect(error).toBeDefined();
      expect(error.details[0].message).toBe(
        '"tags[0].email" is not allowed to be empty',
      );
    });
  });
});
