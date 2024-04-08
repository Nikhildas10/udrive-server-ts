import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import * as bookingService from "../services/booking.service";
import * as carService from "../services/car.service";
import * as customerService from "../services/customer.service";
import customerModel from "../models/customer.model";
import BookingModel from "../models/booking.model";
import employeeModel from "../models/employee.model ";
import CarModel from "../models/car.model";

export const createBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        customerSelected,
        carSelected,
        employeeSelected,
        ...bookingData
      } = req.body;

      //pass  reference data to cutsomer
      const customerId = customerSelected?._id;
      const customer = await customerModel.findById(customerId);
      if (!customer) {
        return next(new ErrorHandler("Customer not found", 404));
      }

      //pass reference data to employee
      const employeeId = employeeSelected?._id;
      const employee = await employeeModel.findById(employeeId);
      if (!employee) {
        return next(new ErrorHandler("employee not found", 404));
      }

      //pass reference data to cars
      const carId = carSelected?._id;
      const car = await CarModel.findById(carId);
      if (!car) {
        return next(new ErrorHandler("car not found", 404));
      }
      const booking = await BookingModel.create(bookingData);

      customer.bookings.push(booking);
      employee.bookings.push(booking);
      car.bookings.push(booking);
      await customer.save();
      await employee.save();
      await car.save();

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

      const deletedBooking = await BookingModel.findByIdAndDelete(id);
      if (!deletedBooking) {
        return next(new ErrorHandler("Booking not found", 404));
      }
      const booking = await BookingModel.findById(id);
      const customer = await customerModel.findById(booking.customerSelected);

      // const customerDeleting = await customerModel.bookings.findByIdAndDelete({
      //   id,
      // });

      res
        .status(200)
        .json({ success: true, message: "Booking deleted successfully" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const getAllBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await BookingModel.find({});
      res.status(200).json({ success: true, bookings });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getSingleBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ErrorHandler("Please provide a booking ID", 400));
      }
      const booking = await BookingModel.findById(id);
      if (!booking) {
        return next(new ErrorHandler("Booking not found", 404));
      }
      res.status(200).json({ success: true, booking });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const editBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ErrorHandler("invalid booking id", 400));
      }
      const updatedBookingData = req.body;
      const updatedBooking = await BookingModel.findByIdAndUpdate(
        id,
        updatedBookingData,
        { new: true }
      );
      if (!updatedBooking) {
        return next(new ErrorHandler("Booking not found", 404));
      }
      res.status(200).json({ success: true, updatedBooking });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
