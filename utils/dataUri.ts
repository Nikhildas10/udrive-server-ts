const dataUriParser = require("datauri/parser");
const path = require("path");

const getDataUri = (file:any) => {
  const { buffer, mimetype } = file;
  return `data:${mimetype};base64,${buffer.toString("base64")}`;
};

export default getDataUri;