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
import { Server } from "socket.io";
import { emitSocketEvent } from "../server";
import { notificationModel } from "../models/notification.model";
const io = new Server({
  cors: {
    origin: [
      "https://u-drive-three.vercel.app",
      "http://localhost:3031",
      "http://localhost:3030",
    ],
    credentials: true,
  },
});

export const createBooking = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        customerSelected,
        carSelected,
        advanceAmount,
        total,
        invoiceDetails,
        ...bookingData
      } = req.body;
      bookingData.advancePaid =
        advanceAmount && advanceAmount > 0 ? true : false;
      bookingData.invoiceGenerated = total && total > 0 ? true : false;

      //check invoice is null or not
      const filteredInvoiceDetails = invoiceDetails.filter((detail) => {
        return (
          detail &&
          detail.name &&
          detail.amount !== undefined &&
          detail.amount !== null
        );
      });

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

      // console.log("im employeeeeeeeeeeeeeeeee", employee);

      // Pass reference data to cars
      const carId = carSelected?._id;
      const car = await CarModel.findById(carId);
      if (!car) {
        return next(new ErrorHandler("Car not found", 404));
      }

      const bookingDataWithoutCircularRefs = {
        ...bookingData,
        invoiceDetails: filteredInvoiceDetails,
        advanceAmount,
        total,
        carSelected: {
          rcBook: carSelected.rcBook,
          insurancePolicy: carSelected.insurancePolicy,
          pollutionCertificate: carSelected.pollutionCertificate,
          carImage: carSelected.carImage,
          _id: carSelected._id,
          name: carSelected.name,
          manufacturingCompany: carSelected.manufacturingCompany,
          yearOfManufacturing: carSelected.yearOfManufacturing,
          fuelType: carSelected.fuelType,
          transmission: carSelected.transmission,
          insurance: carSelected.insurance,
          lastService: carSelected.lastService,
          serviceInterval: carSelected.serviceInterval,
          isDeleted: carSelected.isDeleted,
          vehicleNumber: carSelected.vehicleNumber,
          totalKmCovered: carSelected.totalKmCovered,
          kmBeforeTrip: carSelected?.totalKmCovered,
        },
        customerSelected: {
          customerImage: customerSelected.customerImage,
          passportImage: customerSelected.passportImage,
          _id: customerSelected._id,
          name: customerSelected.name,
          contactNumber: customerSelected.contactNumber,
          abroadNumber: customerSelected.abroadNumber,
          nativeNumber: customerSelected.nativeNumber,
          email: customerSelected.email,
          passportNumber: customerSelected.passportNumber,
          pincode: customerSelected.pincode,
          state: customerSelected.state,
          address: customerSelected.address,
          locality: customerSelected.locality,
          cityOrDistrict: customerSelected.cityOrDistrict,
          isDeleted: customerSelected.isDeleted,
        },
        // employee: employee.toObject(),
        employee: {
          employeeImage: employee.employeeImage,
          _id: employee._id,
          name: employee.name,
          userName: employee.userName,
          email: employee.email,
          isBlocked: employee.isBlocked,
          role: employee.role,
          isVerified: employee.isVerified,
          access: employee.access,
          isDeleted: employee.isDeleted,
        },
      };
      const parseDatee = (dateString) => {
        // Split the date string into parts
        const parts = dateString.split(" ");
        const datePart = parts[0];
        const timePart = parts[1] + " " + parts[2]; // Join time and AM/PM

        // Split the date part into day, month, and year
        const dateParts = datePart.split("-");
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Month is 0-based in JavaScript
        const year = parseInt(dateParts[2]);

        // Split the time part into hours and minutes
        const timeParts = timePart.split(":");
        let hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);

        // Adjust hours for PM if necessary
        if (parts[2] === "PM" && hours !== 12) {
          hours += 12;
        }
        // Create a new Date object with the parsed values
        return new Date(year, month, day, hours, minutes);
      };
      const date = parseDatee(bookingData?.fromDate);
      const formattedDate = formatDate(date);
      console.log(formattedDate);

      const notificationData = {
        currentDate: new Date(),
        type: "newBooking",
        title: `${employee.name} booked a ${carSelected.manufacturingCompany}-${carSelected.name} for ${customerSelected.name}, starting ${formattedDate}`,
        employee: {
          employeeImage: employee?.employeeImage,
          _id: employee?._id,
          name: employee?.name,
        },
        car: {
          carImage: carSelected?.carImage,
          _id: carSelected?._id,
          name: carSelected?.name,
        },
        customer: {
          _id: customerSelected._id,
          name: customerSelected.name,
          customerImage: customerSelected.customerImage,
        },
        booking: {
          fromDate: bookingData.fromDate,
          toDate: bookingData.toDate,
        },
      };
      const notification = await notificationModel.create(notificationData);
      await notification.save();

      const booking = await BookingModel.create(bookingDataWithoutCircularRefs);
      await booking.save();

      customer.bookings.push(booking);
      employee.bookings.push(booking);
      car.bookings.push(booking);
      car.bookings.sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );

      await customer.save();
      await employee.save();
      await car.save();
      emitSocketEvent("newBooking", notificationData);

      res.status(201).json({ success: true, booking });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
function getDayWithSuffix(day) {
  if (day >= 11 && day <= 13) {
    return day + "th";
  }
  switch (day % 10) {
    case 1:
      return day + "st";
    case 2:
      return day + "nd";
    case 3:
      return day + "rd";
    default:
      return day + "th";
  }
}

function formatDate(date) {
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedTime =
    (hours % 12 || 12) + ":" + (minutes < 10 ? "0" : "") + minutes + " " + ampm;

  return (
    month +
    " " +
    getDayWithSuffix(day) +
    "," +
    year +
    " " +
    "at" +
    " " +
    formattedTime
  );
}

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
          (bookingId) => bookingId?._id?.toString() !== id
        );
        await customer.save();
      }

      const employee = await employeeModel.findById(req?.user?._id);
      if (employee) {
        employee.bookings = employee.bookings.filter(
          (bookingId) => bookingId?._id?.toString() !== id
        );
        await employee.save();
      }

      const car = await CarModel.findById(booking?.carSelected?._id);
      if (car) {
        car.bookings = car.bookings.filter(
          (bookingId) => bookingId?._id?.toString() !== id
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

      // const { customerSelected: newCustomer, carSelected: newCar } = req.body;
      const {
        customerSelected: newCustomer,
        carSelected: newCar,
        ...bookingData
      } = req.body;
      const employeeId = req.user?._id || "";
      const employee = await employeeModel.findById(employeeId);
      if (!employee) {
        return next(new ErrorHandler("Employee not found", 404));
      }
      const bookingDataWithoutCircularRefs = {
        ...bookingData,
        carSelected: {
          rcBook: newCar?.rcBook,
          insurancePolicy: newCar?.insurancePolicy,
          pollutionCertificate: newCar?.pollutionCertificate,
          carImage: newCar?.carImage,
          _id: newCar?._id,
          name: newCar?.name,
          manufacturingCompany: newCar?.manufacturingCompany,
          yearOfManufacturing: newCar?.yearOfManufacturing,
          fuelType: newCar?.fuelType,
          transmission: newCar?.transmission,
          insurance: newCar?.insurance,
          lastService: newCar?.lastService,
          serviceInterval: newCar?.serviceInterval,
          isDeleted: newCar?.isDeleted,
          totalKmCovered: newCar?.totalKmCovered,
          vehicleNumber: newCar?.vehicleNumber,
        },
        customerSelected: {
          customerImage: newCustomer?.customerImage,
          passportImage: newCustomer?.passportImage,
          _id: newCustomer?._id,
          name: newCustomer?.name,
          contactNumber: newCustomer?.contactNumber,
          abroadNumber: newCustomer?.abroadNumber,
          nativeNumber: newCustomer?.nativeNumber,
          email: newCustomer?.email,
          passportNumber: newCustomer?.passportNumber,
          pincode: newCustomer?.pincode,
          state: newCustomer?.state,
          address: newCustomer?.address,
          locality: newCustomer?.locality,
          cityOrDistrict: newCustomer?.cityOrDistrict,
          isDeleted: newCustomer?.isDeleted,
        },
        // employee: employee.toObject(),
        employee: {
          employeeImage: employee?.employeeImage,
          _id: employee?._id,
          name: employee?.name,
          userName: employee?.userName,
          email: employee?.email,
          isBlocked: employee?.isBlocked,
          role: employee?.role,
          isVerified: employee?.isVerified,
          access: employee?.access,
          isDeleted: employee?.isDeleted,
        },
      };
      const updatedBooking = await BookingModel.findByIdAndUpdate(
        id,
        bookingDataWithoutCircularRefs,
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
          (bookingId) => bookingId?._id?.toString() !== id
        );
        await prevCustomer.save();
      }

      // Remove booking from previous car
      const prevCar = await CarModel.findById(prevCarId);
      if (prevCar) {
        prevCar.bookings = prevCar.bookings.filter(
          (bookingId) => bookingId?._id?.toString() !== id
        );
        await prevCar.save();
      }
      // Remove booking from previous employee
      const prevEmployee = await employeeModel.findById(req.user._id);
      if (prevEmployee) {
        prevEmployee.bookings = prevEmployee.bookings.filter(
          (bookingId) => bookingId?._id?.toString() !== id
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
      const currentTimeUTC = new Date();

      const upcomingBookings = await BookingModel.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $addFields: {
            parsedFromDate: {
              $dateFromString: {
                dateString: "$fromDate",
                timezone: "Asia/Kolkata", // Use India time zone for parsing
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

      const parseDate = (dateString: string): Date => {
        const parts = dateString.split(" ");
        const datePart = parts[0];
        const timePart = parts[1] + " " + parts[2];

        const [day, month, year] = datePart.split("-").map(Number);
        const [time, period] = timePart.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        // Create a Date object in UTC and adjust for IST offset
        const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
        return new Date(date.getTime() - 5.5 * 60 * 60 * 1000); // Convert IST to UTC
      };

      const getCurrentDateTimeUTC = () => {
        return new Date();
      };

      const currentDateTimeUTC = getCurrentDateTimeUTC();
      console.log(currentDateTimeUTC);

      const filteredUpcomingBookings = upcomingBookings.filter((booking) => {
        const fromDate = parseDate(booking.fromDate);
        console.log(fromDate);

        return currentDateTimeUTC < fromDate;
      });

      upcomingBookings.forEach((booking) => {
        const bookingTime = parseDate(booking.fromDate).getTime();

        const timeDifference = Math.abs(
          bookingTime - currentDateTimeUTC.getTime()
        );

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
      const getCurrentDateTimeUTC = () => {
        return new Date();
      };

      const currentDateTimeUTC = getCurrentDateTimeUTC();
      const timeZoneDifference = 5.5 * 60 * 60 * 1000; // Convert to milliseconds for IST
      const upcomingDateTimeUTC = new Date(
        currentDateTimeUTC.getTime() - timeZoneDifference
      );

      const activeBookings = await BookingModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $and: [
                { $lte: [{ $toDate: "$fromDate" }, currentDateTimeUTC] }, // Booking starts before or at the current time
                { $gt: [{ $toDate: "$toDate" }, currentDateTimeUTC] }, // Booking ends after the current time
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

      const parseDate = (dateString: string) => {
        // Split the date string into parts
        const parts = dateString.split(" ");
        const datePart = parts[0];
        const timePart = parts[1] + " " + parts[2]; // Join time and AM/PM

        // Split the date part into day, month, and year
        const dateParts = datePart.split("-");
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Month is 0-based in JavaScript
        const year = parseInt(dateParts[2]);

        // Split the time part into hours and minutes
        const timeParts = timePart.split(":");
        let hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);

        // Adjust hours for PM if necessary
        if (parts[2] === "PM" && hours !== 12) {
          hours += 12;
        }

        // Create a new Date object with the parsed values in UTC
        return new Date(Date.UTC(year, month, day, hours, minutes));
      };

      // Filter active bookings based on current time
      const filteredActiveBookings = activeBookings.filter((booking) => {
        const fromDate = parseDate(booking.fromDate);
        const toDate = parseDate(booking.toDate);
        return upcomingDateTimeUTC >= fromDate && upcomingDateTimeUTC <= toDate;
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

// export const addKilometre = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const { id } = req.params;
//       const { kilometreCovered } = req.body;

//       const booking = await BookingModel.findById(id);
//       const carSelected: any = booking?.carSelected;
//       const customerSelected: any = booking?.customerSelected;

//       const car = await CarModel.findById(carSelected?._id);
//       if (!car) {
//         return next(new ErrorHandler("Car not found", 404));
//       }
//       const customer = await customerModel.findById(customerSelected?._id);
//       if (!customer) {
//         return next(new ErrorHandler("Customer not found", 404));
//       }
//       const employee = await employeeModel.findById(req?.user?._id);
//       if (!employee) {
//         return next(new ErrorHandler("Employee not found", 404));
//       }

//       const kmPerBooking = kilometreCovered - car.totalKmCovered;

//       try {
//         if (kmPerBooking) {
//           car.totalKmCovered += kmPerBooking;
//           await car.save();

//           // Mark booking as updated and update kilometreCovered
//           booking.isKilometreUpdated = true;
//           booking.kilometreCovered = kmPerBooking;
//           await booking.save();

//           // Remove existing booking from car, customer, and employee bookings arrays
//           car.bookings = car.bookings.filter(
//             (b) => b._id.toString() !== booking._id.toString()
//           );
//           customer.bookings = customer.bookings.filter(
//             (b) => b._id.toString() !== booking._id.toString()
//           );
//           employee.bookings = employee.bookings.filter(
//             (b) => b._id.toString() !== booking._id.toString()
//           );

//           // Push the updated booking to car, customer, and employee bookings arrays
//           car.bookings.push(booking);
//           customer.bookings.push(booking);
//           employee.bookings.push(booking);
//           await Promise.all([car.save(), customer.save(), employee.save()]);

//           // Set car selected for the booking with full details
//          await BookingModel.findByIdAndUpdate(booking._id, {
//            $set: { "carSelected.totalKmCovered": kilometreCovered },
//          });
//           await booking.save();
//         }
//       } catch (err: any) {
//         next(new ErrorHandler(err.message, 400));
//       }
//       res.status(200).json({
//         success: true,
//         message: "Kilometre successfully added",
//         booking,
//       });
//     } catch (err: any) {
//       next(new ErrorHandler(err.message, 400));
//     }
//   }
// );

export const addKilometre = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { kilometreCovered } = req.body;

      const booking = await BookingModel.findById(id);
      const carSelected: any = booking?.carSelected;
      const customerSelected: any = booking?.customerSelected;

      const car = await CarModel.findById(carSelected?._id);
      if (!car) {
        return next(new ErrorHandler("Car not found", 404));
      }
      const customer = await customerModel.findById(customerSelected?._id);
      if (!customer) {
        return next(new ErrorHandler("Customer not found", 404));
      }
      const employee = await employeeModel.findById(req?.user?._id);
      if (!employee) {
        return next(new ErrorHandler("Employee not found", 404));
      }

      const kmPerBooking = kilometreCovered - car.totalKmCovered;
      try {
        if (kilometreCovered == 0) {
          return;
        }
        booking.isKilometreUpdated = true;
        booking.kilometreCovered = kmPerBooking;
        await booking.save();
        car.totalKmCovered = kilometreCovered;
        car.serviceKilometre += kmPerBooking;
        await car.save();

        if (car) {
          const bookingIndex = car.bookings.findIndex(
            (booking) => booking._id.toString() === id.toString()
          );

          if (bookingIndex !== -1) {
            car.bookings[bookingIndex].kilometreCovered = kmPerBooking;
            car.bookings[bookingIndex].isKilometreUpdated = true;
            console.log(car.bookings);
          }
          car.markModified("bookings");

          await car.save();
        }

        // await CarModel.findByIdAndUpdate(
        //   carSelected._id,
        //   {
        //     $set: {
        //       "bookings.$[booking].kilometreCovered": kmPerBooking,
        //       "bookings.$[booking].isKilometreUpdated": true,
        //       "bookings.$[booking].carSelected.totalKmCovered": kilometreCovered,
        //     },
        //   },
        //   {
        //     arrayFilters: [{ "booking._id": id }], // Replace 'id' with the actual booking ID
        //   }
        // );

        await BookingModel.findByIdAndUpdate(
          id,
          {
            $set: { "carSelected.totalKmCovered": kilometreCovered },
          },
          { new: true }
        );

        if (customer) {
          const bookingIndex = customer.bookings.findIndex(
            (booking) => booking._id.toString() === id.toString()
          );

          if (bookingIndex !== -1) {
            customer.bookings[bookingIndex].kilometreCovered = kmPerBooking;
            customer.bookings[bookingIndex].isKilometreUpdated = true;
            customer.markModified("bookings");

            await customer.save();
          }
        }

        if (employee) {
          const bookingIndex = employee.bookings.findIndex(
            (booking) => booking._id.toString() === id.toString()
          );

          if (bookingIndex !== -1) {
            employee.bookings[bookingIndex].kilometreCovered = kmPerBooking;
            employee.bookings[bookingIndex].isKilometreUpdated = true;
            employee.markModified("bookings");

            await employee.save();
          }
        }
        await employee.save();
      } catch (err: any) {
        next(new ErrorHandler(err.message, 400));
      }
      res
        .status(200)
        .json({ success: true, message: "kilometre successfully added", car });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const notUpdatedKilometre = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const getCurrentDateTimeUTC = () => {
        return new Date();
      };

      const currentDateTimeUTC = getCurrentDateTimeUTC();
      const timeZoneDifference = 5.5 * 60 * 60 * 1000; // Convert to milliseconds for IST
      const upcomingDateTimeUTC = new Date(
        currentDateTimeUTC.getTime() - timeZoneDifference
      );

      const bookings = await BookingModel.aggregate([
        {
          $match: {
            isDeleted: false,
            isKilometreUpdated: false,
          },
        },
      ]);

      const parseDate = (dateString: string) => {
        // Split the date string into parts
        const parts = dateString.split(" ");
        const datePart = parts[0];
        const timePart = parts[1] + " " + parts[2]; // Join time and AM/PM

        // Split the date part into day, month, and year
        const dateParts = datePart.split("-");
        const day = parseInt(dateParts[0]);
        const month = parseInt(dateParts[1]) - 1; // Month is 0-based in JavaScript
        const year = parseInt(dateParts[2]);

        // Split the time part into hours and minutes
        const timeParts = timePart.split(":");
        let hours = parseInt(timeParts[0]);
        const minutes = parseInt(timeParts[1]);

        // Adjust hours for PM if necessary
        if (parts[2] === "PM" && hours !== 12) {
          hours += 12;
        }

        // Create a new Date object with the parsed values in UTC
        return new Date(Date.UTC(year, month, day, hours, minutes));
      };

      const filteredBookings = bookings.filter((booking) => {
        const toDateUTC = parseDate(booking.toDate);
        return upcomingDateTimeUTC > toDateUTC;
      });

      res.status(200).json({ success: true, filteredBookings });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const addInvoice = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { driver, invoiceDetails, ...bookingData } = req.body;
      const { id } = req.params;
      const booking: any = await BookingModel.findById(id);
      const carId = booking?.carSelected?._id;
      const customerId = booking?.customerSelected?._id;
      const employeeId = req?.user?._id;

      const filteredInvoiceDetails = invoiceDetails.filter((detail: any) => {
        return (
          detail &&
          detail.name &&
          detail.amount !== undefined &&
          detail.amount !== null
        );
      });
      const updatedBookings = await BookingModel.findByIdAndUpdate(
        id,
        {
          $push: { invoiceDetails: { $each: filteredInvoiceDetails } },
          $set: {
            invoiceGenerated: true,
            driver: driver,
            total: bookingData?.total,
            subTotals: bookingData?.subTotals,
            discount: bookingData?.discount,
            advanceAmount: bookingData?.advanceAmount,
            tax: bookingData?.tax,
            payment: bookingData?.payment,
          },
        },
        { new: true }
      );

      if (!updatedBookings) {
        res.status(400).json({ success: false, message: "no bookings found" });
      }

      const car = await CarModel.findById(carId);
      const customer = await customerModel.findById(customerId);
      const employee = await employeeModel.findById(employeeId);

      if (car) {
        const bookingIndex = car.bookings.findIndex(
          (booking) => booking._id.toString() === id.toString()
        );

        if (bookingIndex !== -1) {
          car.bookings[bookingIndex].invoiceDetails.push(...filteredInvoiceDetails);
          car.bookings[bookingIndex].invoiceGenerated = true;
          car.bookings[bookingIndex].driver = driver;
          car.bookings[bookingIndex].total = bookingData?.total;
          car.bookings[bookingIndex].subTotals = bookingData?.subTotals;
          car.bookings[bookingIndex].discount = bookingData?.discount;
          car.bookings[bookingIndex].advanceAmount = bookingData?.advanceAmount;
          car.bookings[bookingIndex].tax = bookingData?.tax;
          car.bookings[bookingIndex].payment = bookingData?.payment;
        }
        car.markModified("bookings");
        await car.save();
      }
      if (customer) {
        const bookingIndex = customer.bookings.findIndex(
          (booking) => booking._id.toString() === id.toString()
        );

        if (bookingIndex !== -1) {
          customer.bookings[bookingIndex].invoiceDetails.push(...filteredInvoiceDetails);
          customer.bookings[bookingIndex].invoiceGenerated = true;
          customer.bookings[bookingIndex].driver = driver;
          customer.bookings[bookingIndex].total = bookingData?.total;
          customer.bookings[bookingIndex].subTotals = bookingData?.subTotals;
          customer.bookings[bookingIndex].discount = bookingData?.discount;
          customer.bookings[bookingIndex].advanceAmount =
            bookingData?.advanceAmount;
          customer.bookings[bookingIndex].tax = bookingData?.tax;
          customer.bookings[bookingIndex].payment = bookingData?.payment;
        }
        customer.markModified("bookings");
        await customer.save();
      }
      if (employee) {
        const bookingIndex = employee.bookings.findIndex(
          (booking) => booking._id.toString() === id.toString()
        );

        if (bookingIndex !== -1) {
          employee.bookings[bookingIndex].invoiceDetails.push(...filteredInvoiceDetails);
          employee.bookings[bookingIndex].invoiceGenerated = true;
          employee.bookings[bookingIndex].driver = driver;
          employee.bookings[bookingIndex].total = bookingData?.total;
          employee.bookings[bookingIndex].subTotals = bookingData?.subTotals;
          employee.bookings[bookingIndex].discount = bookingData?.discount;
          employee.bookings[bookingIndex].advanceAmount =
            bookingData?.advanceAmount;
          employee.bookings[bookingIndex].tax = bookingData?.tax;
          employee.bookings[bookingIndex].payment = bookingData?.payment;
        }
        employee.markModified("bookings");
        await employee.save();
      }

      res.status(200).json({ success: true, updatedBookings });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);
export const invoiceDueBefore1 = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Fetch all bookings where the invoice has not been generated
      const bookings = await BookingModel.find({
        invoiceGenerated: false,
        isDeleted: false,
      });

      // Function to parse the date string into a Date object
      const parseDate = (dateString: string): Date => {
        const parts = dateString.split(" ");
        const datePart = parts[0];
        const timePart = parts[1] + " " + parts[2];

        const [day, month, year] = datePart.split("-").map(Number);
        const [time, period] = timePart.split(" ");
        let [hours, minutes] = time.split(":").map(Number);

        if (period === "PM" && hours !== 12) hours += 12;
        if (period === "AM" && hours === 12) hours = 0;

        // Create a Date object in UTC and adjust for IST offset
        const date = new Date(Date.UTC(year, month - 1, day, hours, minutes));
        return new Date(date.getTime() - 5.5 * 60 * 60 * 1000); // Convert IST to UTC
      };

      // Function to get the current date and time in UTC
      const getCurrentDateTimeUTC = () => {
        return new Date();
      };

      // Calculate the current date and time in UTC
      const currentDateTimeUTC = getCurrentDateTimeUTC();

      const filteredUpcomingBookings = bookings.filter((booking) => {
        const toDate = parseDate(booking.toDate);
        const oneDatesFromNow = new Date(
          currentDateTimeUTC.getTime() + 1 * 24 * 60 * 60 * 1000
        );        
        return toDate <= oneDatesFromNow;
      });

      res.status(200).json({
        success: true,
        bookings: filteredUpcomingBookings,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getNonInvoiceGenrerated = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookings = await BookingModel.find({
        invoiceGenerated: false,
        isDeleted: false,
      });
      if (!bookings) {
        res.status(400).json({ success: false, message: "no bookings found" });
      }
      res.status(200).json({ success: true, bookings });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);
