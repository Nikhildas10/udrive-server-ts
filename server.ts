require("dotenv").config();
const { Server } = require("socket.io");
import { app } from "./app";
import { connectDb } from "./utils/db";
import { v2 as cloudinary } from "cloudinary";
const http = require("http");

//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  timeout: 60000,
});
const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: [
      "https://u-drive-three.vercel.app", // Your deployed frontend URL
      "http://localhost:3031",
      "http://localhost:3030",
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("Socket connected");

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
  connectDb();
});
export const emitSocketEvent=(event,payload)=>{
  io.emit(event,payload)
}