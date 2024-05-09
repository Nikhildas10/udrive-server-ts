import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { ErorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import employeeRouter from "./routes/employee.route";
import carRouter from "./routes/car.route";
import bookingRouter from "./routes/booking.route";
import customerRouter from "./routes/customer.route";
import calendarRouter from "./routes/calendar.route";
import dashboardRouter from "./routes/dashboard.route";
import { Server } from "socket.io";
import { disconnect } from "process";
require("dotenv").config();
export const app = express();

//body-parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((req, res, next) => {
  res.setTimeout(600000, () => {
    console.log("Request has timed out.");
    res.status(408).send("Request Timeout");
  });
  next();
});
app.use(cookieParser());
app.use(
  cors({
    origin: [
      "https://u-drive-three.vercel.app",
      "http://localhost:3031",
      "http://localhost:3030",
    ],
    credentials: true,
  })
);

app.use("/api", userRouter);
app.use("/api", dashboardRouter);
app.use("/api/employee", employeeRouter);
app.use("/api/car", carRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/customer", customerRouter);
app.use("/api/calendar", calendarRouter);

app.get("/test", (req, res) => {
  res.status(200).json({ success: true, message: "Api is working fine" });
});

app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});



app.use(ErorMiddleware);
