require("dotenv").config();
const { Server } = require("socket.io");
import { app } from "./app";
import { connectDb } from "./utils/db";
import { v2 as cloudinary } from "cloudinary";
//cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_SECRET_KEY,
  timeout: 60000,
});
app.listen(process.env.PORT, () => {
  console.log(`connected to port ${process.env.PORT}`);
  connectDb();
});

const io = require("socket.io")(5000, {
  cors: {
    origin: [
      "https://u-drive-three.vercel.app",
      "http://localhost:3031",
      "http://localhost:3030",
    ],
    credentials: true,
  },
});

io.on("connection", (socket) => {
  console.log("socket connnected");
  
  socket.on("disconnect", () => {
    console.log("socket disconnected");
    
  });
});
export const emitSocketEvent=(event,payload)=>{
  io.emit(event,payload)
}