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
      const { customerSelected, carSelected, ...bookingData } = req.body;

      // Pass reference data to customer
      const customerId = customerSelected?._id;
      const customer = await customerModel.findById(customerId);
      if (!customer) {
        return next(new ErrorHandler("Customer not found", 404));
      }

      // Pass reference data to employee
      const employeeId = req.user?._id || "";
      const employee = await employeeModel.findById(employeeId);
      if (!employee) {
        return next(new ErrorHandler("Employee not found", 404));
      }

      // Pass reference data to cars
      const carId = carSelected?._id;
      const car = await CarModel.findById(carId);
      if (!car) {
        return next(new ErrorHandler("Car not found", 404));
      }

      const bookingDataWithoutCircularRefs = {
        ...bookingData,
        carSelected,
        customerSelected,
        employee: employee.toObject(),
      };

      const booking = await BookingModel.create(bookingDataWithoutCircularRefs);
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
      const monthlyTotals = await calculateMonthlyTotals();
      res.json(monthlyTotals);
    } catch (error) {
      console.error("Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
async function calculateMonthlyTotals() {
  try {
    const monthlyTotals = {};

    const result = await BookingModel.aggregate([
      {
        $project: {
          month: { $month: { $toDate: "$fromDate" } },
          year: { $year: { $toDate: "$fromDate" } },
          total: 1,
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          totalAmount: { $sum: "$total" },
        },
      },
    ]);

    // Initialize monthlyTotals object with 0 for all months
    for (let month = 1; month <= 12; month++) {
      const key = `${month}`;
      monthlyTotals[key] = 0;
    }

    result.forEach((item) => {
      const key = `${item._id.month}`;
      monthlyTotals[key] = item.totalAmount;
    });

    // Get current year
    const currentYear = new Date().getFullYear();

    // Create labels array with dates for 11 months
    const labels = [];
    for (let month = 1; month <= 11; month++) {
      const date = new Date(currentYear, month - 1, 1); // Create a date object for the first day of each month
      const formattedDate = `${(date.getMonth() + 1)
        .toString()
        .padStart(2, "0")}/${date
        .getDate()
        .toString()
        .padStart(2, "0")}/${currentYear}`;
      labels.push(formattedDate);
    }

    // Create data array for 11 months
    const data = [];
    for (let month = 1; month <= 11; month++) {
      data.push(monthlyTotals[month.toString()]);
    }

    return {
      chart: {
        labels: labels,
        series: [
          {
            name: "Revenue",
            type: "column",
            fill: "solid",
            data: data,
          },
        ],
      },
    };
  } catch (error) {
    console.error("Error calculating monthly totals:", error);
    throw error;
  }
}

export const getTotalRevenue = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const totalRevenue = await BookingModel.aggregate([
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
          },
        },
      ]);

      const revenue =
        totalRevenue.length > 0 ? totalRevenue[0].totalRevenue : 0;

      res.status(200).json({ success: true, totalRevenue: revenue });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getUpcomingBookings = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentTime = new Date();
  
      const upcomingBookings = await BookingModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $gt: ["$fromDate", formatDate(currentTime)] }, // Booking starts after current time
              ],
            },
          },
        },
        {
          $addFields: {
            parsedFromDate: {
              $dateFromString: {
                dateString: "$fromDate",
              },
            },
          },
        },
        {
          $sort: {
            parsedFromDate: 1,
            fromDate: 1,
          },
        },
        {
          $project: {
            parsedFromDate: 0,
          },
        },
      ]);

      const bookings=await BookingModel.find({isDeleted:false})
      const filteredUpcomingBookings=upcomingBookings.filter((booking)=>{
        const fromDate=new Date(booking.fromDate)
        console.log(fromDate);
        
        if(fromDate>new Date()){
          return true
        }
      }) 

      upcomingBookings.forEach((booking) => {
        const bookingTime: any = parseDate(booking.fromDate);

        const timeDifference = Math.abs(bookingTime - currentTime.getTime());

        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor(
          (timeDifference % (1000 * 60 * 60)) / (1000 * 60)
        );

        let timeLeft = "";
        if (days > 0) {
          timeLeft += `${days} day${days > 1 ? "s" : ""} `;
        }
        if (hours > 0) {
          timeLeft += `${hours} hour${hours > 1 ? "s" : ""} `;
        }
        if (minutes > 0) {
          timeLeft += `${minutes} minute${minutes > 1 ? "s" : ""}`;
        }

        booking.timeLeft = timeLeft;
      });

      res.status(200).json({
        success: true,
       upcomingBookings: filteredUpcomingBookings,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

function parseDate(dateString: string) {
  const parts = dateString.split("-");
  return new Date(`${parts[1]}/${parts[0]}/${parts[2]}`);
}

export const getActiveBookings = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentTime = new Date();

      const activeBookings = await BookingModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $lte: [{ $toDate: "$fromDate" }, currentTime] }, // Booking starts before or at the current time
                { $gt: [{ $toDate: "$toDate" }, currentTime] }, // Booking ends after the current time
              ],
            },
          },
        },
        {
          $addFields: {
            parsedFromDate: {
              $dateFromString: {
                dateString: "$fromDate",
              },
            },
            active: true, // Adding active field set to true
          },
        },
        {
          $project: {
            parsedFromDate: 0,
          },
        },
      ]);

      // Filter active bookings based on current time
      const filteredActiveBookings = activeBookings.filter((booking) => {
        const fromDate = new Date(booking.fromDate);
        const toDate = new Date(booking.toDate);
        return currentTime >= fromDate && currentTime <= toDate;
      });

      res.status(200).json({
        success: true,
        activeBookings: filteredActiveBookings.map((booking) => ({
          ...booking,
          activePeriod: {
            fromDate: booking.fromDate,
            toDate: booking.toDate,
          },
        })),
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);



export const getCancelledBookings = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cancelledBookings = await BookingModel.find({ isDeleted: true });
      res.status(200).json({ success: true, cancelledBookings });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
//format date for upcoming bookings
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";
  return `${day}-${month}-${year} ${hours}:${minutes} ${period}`;
}

//format date for active bookings
function formatDateActive(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = "00";
  const minutes = "01";

  return `${day}-${month}-${year} ${hours}:${minutes}`;
}

function formatDateUpcoming(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  let hours = date.getHours();
  let period = "AM";

  // Convert hours to 12-hour format and determine period
  if (hours === 0) {
    hours = 12;
  } else if (hours === 12) {
    period = "PM";
  } else if (hours > 12) {
    hours -= 12;
    period = "PM";
  }

  const hoursStr = hours.toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}-${month}-${year} ${hoursStr}:${minutes} ${period}`;
}


export const getUpcomingBookingsCount = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentTime = new Date();

      const countOfUpcomingBookings = await BookingModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $gt: [
                {
                  $dateFromString: {
                    dateString: "$fromDate",
                  },
                },
                currentTime,
              ],
            },
          },
        },
        {
          $count: "upcomingBookings",
        },
      ]);

      const sumOfUpcomingBookings =
        countOfUpcomingBookings.length > 0
          ? countOfUpcomingBookings[0].upcomingBookings
          : 0;
      const series = [];
      series.push({ label: "upcoming bookings", value: sumOfUpcomingBookings });
      res.status(200).json({
        success: true,
        series,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
