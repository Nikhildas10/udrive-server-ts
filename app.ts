import cookieParser from "cookie-parser";
import express from "express";
import cors from "cors";
import { ErorMiddleware } from "./middleware/error";
import userRouter from "./routes/user.route";
import employeeRouter from "./routes/employee.route";
import carRouter from "./routes/car.route";
import bookingRouter from "./routes/booking.route";
import customerRouter from "./routes/customer.route";

export const app = express();

//body-parser
app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: ["*"],
    credentials: true,
  })
);


app.use("/api", userRouter);
app.use("/api/employee", employeeRouter);
app.use("/api", carRouter);
app.use("/api/booking", bookingRouter);
app.use("/api/customer", customerRouter);



app.get("/test", (req, res) => {
  res.status(200).json({ success: true, message: "Api is working fine" });
});

app.all("*", (req, res, next) => {
  const err = new Error(`Route ${req.originalUrl} not found`) as any;
  err.statusCode = 404;
  next(err);
});

app.use(ErorMiddleware);
