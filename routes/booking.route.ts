import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  createBooking,
  deleteBooking,
  getAllBooking,
} from "../controllers/booking.controller";

const bookingRouter = express.Router();

bookingRouter.post("/create", isAuthenticated, createBooking);
bookingRouter.delete("/delete/:id", isAuthenticated, deleteBooking);
bookingRouter.get("/get-all-bookings", isAuthenticated, getAllBooking);

export default bookingRouter;
