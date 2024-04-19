import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  bookingStatus,
  createBooking,
  deleteBooking,
  deleteMultipleBookings,
  editBooking,
  getAllBooking,
  getSingleBooking,
} from "../controllers/booking.controller";

const bookingRouter = express.Router();

bookingRouter.post("/create", isAuthenticated, createBooking);
bookingRouter.delete("/delete/:id", isAuthenticated, deleteBooking);
bookingRouter.get("/get-all-booking", isAuthenticated, getAllBooking);
bookingRouter.get("/get-single-booking/:id", isAuthenticated, getSingleBooking);
bookingRouter.put("/edit/:id", isAuthenticated, editBooking);
bookingRouter.put("/status/:id", isAuthenticated, bookingStatus);
bookingRouter.delete("/multiple-delete", isAuthenticated, deleteMultipleBookings);

export default bookingRouter;
