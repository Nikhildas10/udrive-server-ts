import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import BookingModel from "../models/booking.model";
import CarModel from "../models/car.model";
import { emitSocketEvent } from "../server";

export const getDashboardData = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const getCurrentDateTimeUTC = (): Date => {
        const now = new Date();
        const utcTimestamp = now.getTime() + now.getTimezoneOffset() * 60000;
        return new Date(utcTimestamp);
      };

      const currentDateTimeUTC = getCurrentDateTimeUTC();

      // Fetch running cars
      const runningCars = await CarModel.aggregate([
        {
          $match: {
            isDeleted: false,
          },
        },
        {
          $unwind: "$bookings",
        },
        {
          $addFields: {
            nextAvailableDate: {
              $concat: ["$bookings.fromDate", " to ", "$bookings.toDate"],
            },
          },
        },
        {
          $sort: {
            "bookings.fromDate": 1,
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

      const filteredRunningCars = runningCars.filter((car) => {
        const fromDateTime = parseDate(car.bookings.fromDate);
        const toDateTime = parseDate(car.bookings.toDate);

        // Check if current time is after the booking end time (in UTC)
        if (currentDateTimeUTC > toDateTime) {
          return false;
        }

        // Check if current time is within the booking time range (in UTC)
        if (
          currentDateTimeUTC >= fromDateTime &&
          currentDateTimeUTC <= toDateTime
        ) {
          return true;
        }

        return false;
      });

      const runningCarsIds = filteredRunningCars.map((car) => car?._id);

      // Fetch all cars except running cars
      const notRunningCars = await CarModel.find({
        isDeleted: false,
        _id: { $nin: runningCarsIds },
      });

      const sortedNotRunningCars = notRunningCars.map((car) => {
        return {
          ...car.toObject(),
          bookings: car.bookings.sort(
            (a, b) => new Date(a.fromDate) - new Date(b.fromDate)
          ),
        };
      });

      // Fetch upcoming bookings
      const upcomingBookings = await BookingModel.aggregate([
        {
          $match: {
            isDeleted: false,
            $expr: {
              $gt: [{ $toDate: "$fromDate" }, currentDateTimeUTC], // fromDate is after current time
            },
          },
        },
        {
          $sort: {
            fromDate: 1,
          },
        },
      ]);

      const series = [
        {
          label: "running cars",
          value: filteredRunningCars.length,
        },
        {
          label: "cars on yard",
          value: sortedNotRunningCars.length,
        },
        {
          label: "upcoming bookings",
          value: upcomingBookings.length,
        },
      ];

      res.status(200).json({ success: true, series });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getMessage = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    emitSocketEvent("newMessage", "this is new message");
    res.status(200).json({success:true})
  }
);
