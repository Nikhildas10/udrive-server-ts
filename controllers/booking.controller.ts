import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import * as bookingService from "../services/booking.service";
import * as carService from "../services/car.service";
import * as customerService from "../services/customer.service";
import customerModel from "../models/customer.model";
import BookingModel, { IBooking } from "../models/booking.model";
import employeeModel from "../models/employee.model ";
import CarModel from "../models/car.model";

export const createBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerSelected, carSelected } = req.body;

      //pass  reference data to cutsomer
      const customerId = customerSelected?._id;
      const customer = await customerModel.findById(customerId);
      if (!customer) {
        return next(new ErrorHandler("Customer not found", 404));
      }

      //pass reference data to employee
      const employeeId = req.user?._id || "";
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
      const booking = await BookingModel.create(req.body);
      await booking.save();

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
      const booking = await BookingModel.findById(id);
      const deletedBooking = await BookingModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );
      if (!deletedBooking) {
        return next(new ErrorHandler("Booking not found", 404));
      }

      const customer = await customerModel.findById(
        booking?.customerSelected?._id
      );

      if (customer) {
        customer.bookings = customer?.bookings?.filter(
          (bookingId) => bookingId._id.toString() !== id
        );
        await customer.save();
      }

      const employee = await employeeModel.findById(req?.user?._id);
      if (employee) {
        employee.bookings = employee.bookings.filter(
          (bookingId) => bookingId._id.toString() !== id
        );
        await employee.save();
      }

      const car = await CarModel.findById(booking?.carSelected?._id);
      if (car) {
        car.bookings = car.bookings.filter(
          (bookingId) => bookingId._id.toString() !== id
        );
        await car.save();
      }

      res
        .status(200)
        .json({ success: true, message: "Booking deleted successfully" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const deleteMultipleBookings = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { bookingIds } = req.body;

      const deletedBookings = await BookingModel.updateMany(
        { _id: { $in: bookingIds } },
        { isDeleted: true }
      );
      if (!deletedBookings) {
        return next(new ErrorHandler("Invalid booking ID", 400));
      }

      for (const bookingId of bookingIds) {
        const booking = await BookingModel.findById(bookingId);
        if (!booking) {
          return next(new ErrorHandler("Invalid booking ID", 400));
        }

        const customer = await customerModel.findById(
          booking.customerSelected?._id
        );
        if (customer) {
          customer.bookings = customer.bookings.filter(
            (i) => i._id.toString() !== bookingId
          );
          await customer.save();
        }

        const employee = await employeeModel.findById(req.user?._id);
        if (employee) {
          employee.bookings = employee.bookings.filter(
            (i) => i._id.toString() !== bookingId
          );
          await employee.save();
        }

        const car = await CarModel.findById(booking.carSelected?._id);
        if (car) {
          car.bookings = car.bookings.filter(
            (i) => i._id.toString() !== bookingId
          );
          await car.save();
        }
      }

      res
        .status(200)
        .json({ success: true, message: "Bookings deleted successfully" });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 500));
    }
  }
);

export const editBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ErrorHandler("Invalid booking ID", 400));
      }

      const existingBooking = await BookingModel.findById(id);
      if (!existingBooking) {
        return next(new ErrorHandler("Booking not found", 404));
      }

      const { customerSelected: newCustomer, carSelected: newCar } = req.body;
      const updatedBooking = await BookingModel.findByIdAndUpdate(
        id,
        req.body,
        {
          new: true,
        }
      );
      const prevCustomerId = existingBooking.customerSelected?._id;
      const prevCarId = existingBooking.carSelected?._id;

      // Remove booking from previos customer

      const prevCustomer = await customerModel.findById(prevCustomerId);
      if (prevCustomer) {
        prevCustomer.bookings = prevCustomer.bookings.filter(
          (bookingId) => bookingId._id.toString() !== id
        );
        await prevCustomer.save();
      }

      // Remove booking from previous car
      const prevCar = await CarModel.findById(prevCarId);
      if (prevCar) {
        prevCar.bookings = prevCar.bookings.filter(
          (bookingId) => bookingId._id.toString() !== id
        );
        await prevCar.save();
      }
      // Remove booking from previous employee
      const prevEmployee = await employeeModel.findById(req.user._id);
      if (prevEmployee) {
        prevEmployee.bookings = prevEmployee.bookings.filter(
          (bookingId) => bookingId._id.toString() !== id
        );
        await prevEmployee.save();
      }

      //new customer
      if (newCustomer?._id) {
        const newCustomerId = newCustomer._id;
        const customer = await customerModel.findById(newCustomerId);
        if (!customer) {
          return next(new ErrorHandler("New Customer not found", 404));
        }
        customer.bookings.push(updatedBooking);
        await customer.save();
      }

      //new car
      if (req.user._id) {
        const employeeId = req.user._id;
        const employee = await employeeModel.findById(employeeId);
        if (!employee) {
          return next(new ErrorHandler("employee not found", 404));
        }
        employee.bookings.push(updatedBooking);
        await employee.save();
      }
      //new employee
      if (newCar?._id) {
        const newCarId = newCar._id;
        const car = await CarModel.findById(newCarId);
        if (!car) {
          return next(new ErrorHandler("New Car not found", 404));
        }
        car.bookings.push(updatedBooking);
        await car.save();
      }

      res.status(200).json({ success: true, updatedBooking });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getAllBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await BookingModel.find({ isDeleted: false });
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
      const booking = await BookingModel.findOne({
        _id: id,
        isDeleted: false,
      });
      if (!booking) {
        return next(new ErrorHandler("Booking not found", 404));
      }
      res.status(200).json({ success: true, booking });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const bookingStatus = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body;
      const { id } = req.params;
      const booking = await BookingModel.findById(id);
      if (!booking) {
        return next(new ErrorHandler("booking not found", 404));
      }
      booking.status = status;
      await booking.save();
      res.status(201).json({
        success: true,
        booking,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getRevenueChartData = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentYear = new Date().getFullYear();
      const labels = [];
      const monthlyRevenue = [];

      for (let i = 1; i <= 12; i++) {
        const startDate = new Date(currentYear, i - 1, 1);
        const endDate = new Date(currentYear, i, 0, 23, 59, 59);
        const formattedStartDate = formatDate(startDate);
        const formattedEndDate = formatDate(endDate);

        const bookings = await BookingModel.aggregate([
          {
            $match: {
              fromDate: { $gte: formattedStartDate, $lte: formattedEndDate },
              toDate: { $gte: formattedStartDate, $lte: formattedEndDate },
              isDeleted: false,
            },
          },
          {
            $group: {
              total: { $sum: "$total" },
            },
          },
        ]);
        console.log(bookings);

        const total = bookings.length > 0 ? bookings[0].total : 0;
        monthlyRevenue.push(total);

        const monthYear = `${String(i).padStart(2, "0")}-01-${currentYear
          .toString()
          .slice(-2)}`;
        labels.push(monthYear);
      }

      const chartData = {
        labels: labels,
        series: [
          {
            name: "Revenue",
            type: "column",
            fill: "solid",
            data: monthlyRevenue,
          },
        ],
      };

      res.status(200).json({ success: true, chartData });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
    function formatDate(date) {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const year = date.getFullYear();
      const hours: any = String(date.getHours()).padStart(2, "0");
      const minutes = String(date.getMinutes()).padStart(2, "0");
      const period = hours < 12 ? "AM" : "PM";
      return `${day}-${month}-${year} ${hours}:${minutes} ${period}`;
    }
  }
);
