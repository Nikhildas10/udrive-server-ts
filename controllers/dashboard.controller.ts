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

       const carsWithBookings = await CarModel.aggregate([
         {
           $match: { isDeleted: false },
         },
         {
           $unwind: "$bookings",
         },
         {
           $match: {
             "bookings.fromDate": { $gte: currentDate },
           },
         },
         {
           $group: {
             _id: "$_id",
             car: { $first: "$$ROOT" },
             nextAvailableDate: { $min: "$bookings.fromDate" },
           },
         },
         {
           $sort: { nextAvailableDate: 1 },
         },
         {
           $project: {
             _id: 0,
             car: 1,
             nextAvailableDate: 1,
           },
         },
       ]);

       const carsWithoutBookings = await CarModel.find({
         isDeleted: false,
         bookings: { $exists: false }, // Find cars without bookings
       }).select("-_id car nextAvailableDate");

       const allCarsOnYard = [...carsWithBookings, ...carsWithoutBookings];

       // Remove duplicate cars
       const uniqueCarsOnYard = [];
       const addedIds = new Set();

       allCarsOnYard.forEach((carObj) => {
         if (!addedIds.has(carObj.car?._id.toString())) {
           uniqueCarsOnYard.push(carObj);
           addedIds.add(carObj.car?._id.toString());
         }
       });

       // Count of cars on the yard
       const countOfCarsOnYard = uniqueCarsOnYard.length;

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
            countOfCarsOnYard 
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