const dataUriParser = require("datauri/parser");
const path = require("path");

export const getDataUri = (file) => {
  const { buffer, mimetype } = file;
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

