const status = require("http-status");

// eslint-disable-next-line consistent-return
module.exports = (validator) => (req, res, next) => {
  let data;

  if (req.method === "GET") {
    data = req.query;
  } else if (
    req.method === "POST" ||
    req.method === "PATCH" ||
    req.method === "PUT"
  ) {
    data = req.body;
  }
  const { error } = validator(data);
  if (error) {
    return res.status(status.BAD_REQUEST).send(error.details[0].message);
  }
  next();
};
