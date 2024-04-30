import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  bookingStatus,
  createBooking,
  deleteBooking,
  deleteMultipleBookings,
  editBooking,
  getAllBooking,
  getCancelledBookings,
  getCurrentlyActiveBookings,
  getRevenueChartData,
  getSingleBooking,
  getTotalRevenue,
  getUpcomingBookings,
} from "../controllers/booking.controller";

const bookingRouter = express.Router();

bookingRouter.post("/create", isAuthenticated, createBooking);
bookingRouter.delete("/delete/:id", isAuthenticated, deleteBooking);
bookingRouter.get("/get-all-booking", isAuthenticated, getAllBooking);
bookingRouter.get("/get-single-booking/:id", isAuthenticated, getSingleBooking);
bookingRouter.get("/get-monthly-revenue", isAuthenticated, getRevenueChartData);
bookingRouter.get("/get-total-revenue", isAuthenticated, getTotalRevenue);
bookingRouter.put("/edit/:id", isAuthenticated, editBooking);
bookingRouter.put("/status/:id", isAuthenticated, bookingStatus);
bookingRouter.delete("/multiple-delete", isAuthenticated, deleteMultipleBookings);
bookingRouter.get("/get-upcoming-bookings", isAuthenticated, getUpcomingBookings);
bookingRouter.get("/get-cancelled-bookings", isAuthenticated, getCancelledBookings);
// bookingRouter.get("/get-active-bookings", isAuthenticated, getCurrentlyActiveBookings);

export default bookingRouter;
