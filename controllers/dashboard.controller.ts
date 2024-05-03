import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import BookingModel from "../models/booking.model";
import CarModel from "../models/car.model";

export const getDashboardData = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const date = new Date();
      const currentDate = formatDate(date);
      const currentTime = new Date();

      const countOfRunningCars = await CarModel.aggregate([
        {
          $match: {
            "bookings.fromDate": { $lte: currentDate },
            "bookings.toDate": { $gte: currentDate },
            isDeleted: false,
          },
        },
        {
          $count: "runningCarsCount",
        },
      ]);

      const countOfCarsOnYard = await CarModel.aggregate([
        {
          $match: {
            $expr: {
              $lt: [
                {
                  $dateFromString: {
                    dateString: "$fromDate",
                  },
                },
                currentTime,
              ],
            },
            isDeleted: false,
          },
        },
        {
          $count: "carsOnYardCount",
        },
      ]);

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
          $count: "upcomingBookingsCount",
        },
      ]);

      const series = [
        {
          label: "running cars",
          value:
            countOfRunningCars.length > 0
              ? countOfRunningCars[0].runningCarsCount
              : 0,
        },
        {
          label: "cars on yard",
          value:
            countOfCarsOnYard.length > 0
              ? countOfCarsOnYard[0].carsOnYardCount
              : 0,
        },
        {
          label: "upcoming bookings",
          value:
            countOfUpcomingBookings.length > 0
              ? countOfUpcomingBookings[0].upcomingBookingsCount
              : 0,
        },
      ];

      res.status(200).json({ success: true, series });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";
  return `${day}-${month}-${year} ${hours}:${minutes} ${period}`;
}