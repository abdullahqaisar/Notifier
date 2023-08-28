const mongoose = require("mongoose");
const status = require("http-status");
const config = require("config");

// eslint-disable-next-line consistent-return
module.exports = function (req, res, next) {
  const dbType = config.get("dbType");
  const { id } = req.params;
  let isValidId = false;

  if (dbType === "mongo") {
    isValidId = mongoose.Types.ObjectId.isValid(id);
  } else if (dbType === "postgres") {
    const idAsNumber = Number(id);
    isValidId = !Number.isNaN(idAsNumber) && Number.isInteger(idAsNumber);
  }

  if (!isValidId) {
    return res.status(status.BAD_REQUEST).send("Invalid Id.");
  }

  next();
};
