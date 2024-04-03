import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import * as bookingService from "../services/booking.service";
import * as carService from "../services/car.service";
import * as customerService from "../services/customer.service";
import customerModel from "../models/customer.model";
import BookingModel from "../models/booking.model";
import employeeModel from "../models/employee.model ";

export const createBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerSelected, ...bookingData } = req.body;

      const customerId = customerSelected._id 

      const customer = await customerModel.findById(customerId);
      if (!customer) {
        return next(new ErrorHandler("Customer not found", 404));
      }
      const employeeId = employeeSelected._id 

      const employee = await employeeModel.findById(customerId);
      if (!customer) {
        return next(new ErrorHandler("Customer not found", 404));
      }

      const booking = await BookingModel.create(bookingData);

      customer.bookings.push(booking);
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

export const getAllBooking=catchAsyncErrors(
  async(req:Request,res:Response,next:NextFunction)=>{
    try {
      const bookings=await BookingModel.find({})
      res.status(200).json({success:true,bookings})
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
)