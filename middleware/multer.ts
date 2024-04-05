const multer = require("multer");

const storage = multer.memoryStorage();
const multipleUpload = multer({ storage: storage });

export default multipleUpload