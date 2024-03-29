import express from "express";
import { isAuthenticated } from "../middleware/auth";
import { createBooking, deleteBooking } from "../controllers/booking.controller";

const bookingRouter = express.Router();

bookingRouter.post("/create-booking", isAuthenticated, createBooking);
bookingRouter.delete("/delete-booking/:id", isAuthenticated, deleteBooking);

export default bookingRouter;
