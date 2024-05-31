import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  addInvoice,
  addKilometre,
  bookingStatus,
  createBooking,
  deleteBooking,
  deleteMultipleBookings,
  editBooking,
  getActiveBookings,
  getAllBooking,
  getCancelledBookings,
  getNonInvoiceGenrerated,
  getRevenueChartData,
  getSingleBooking,
  getTotalRevenue,
  getUpcomingBookings,
  getUpcomingBookingsCount,
  invoiceDueBefore1,
  notUpdatedKilometre,
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
bookingRouter.get("/get-upcoming-bookings-count", isAuthenticated, getUpcomingBookingsCount);
bookingRouter.get("/get-cancelled-bookings", isAuthenticated, getCancelledBookings);
bookingRouter.get("/get-active-bookings", isAuthenticated, getActiveBookings);
bookingRouter.put("/add-kilometre/:id", isAuthenticated, addKilometre);
bookingRouter.get("/not-updated-kilometre", isAuthenticated, notUpdatedKilometre);
bookingRouter.get("/not-generated-invoice", isAuthenticated, getNonInvoiceGenrerated);
bookingRouter.put("/add-invoice/:id", isAuthenticated, addInvoice);
bookingRouter.get("/get-invoice-due", isAuthenticated, invoiceDueBefore1);

export default bookingRouter;
 