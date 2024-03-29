import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import * as bookingService from "../services/booking.service";
import * as carService from "../services/car.service";
import * as customerService from "../services/customer.service";

export const createBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { carId, customerId, ...bookingData } = req.body;

      // const car = await carService.get_car_by_id(carId);
      // if (!car) {
      //   return next(new ErrorHandler("Car not found", 404));
      // }

      const customer = await customerService.getSingleCustomer(customerId);
      if (!customer) {
        return next(new ErrorHandler("Customer not found", 404));
      }
      const booking = await bookingService.createBooking(bookingData);

      // car.bookings.push(booking._id);
      // await car.save();

      customer.bookings.push(booking._id);
      await customer.save();

      res.status(201).json({ success: true, booking });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const deleteBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const deletedBooking = await bookingService.deleteBookingById(id);
      if (!deletedBooking) {
        return next(new ErrorHandler("Booking not found", 404));
      }

      res
        .status(200)
        .json({ success: true, message: "Booking deleted successfully" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);
