import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import BookingModel from "../models/booking.model";
import CarModel from "../models/car.model";


export const getDashboardData = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dashboardData = await getDashboardDataInternal();
      const mostBookedCars = await getMostBookedCarsInternal();

      const series = [
        ...dashboardData.series,
        ...mostBookedCars.series.map((car) => ({
          label: car.label,
          value: car.value,
        })),
      ];

      res.status(200).json({ success: true, series });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
async function getDashboardDataInternal() {
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
        countOfCarsOnYard.length > 0 ? countOfCarsOnYard[0].carsOnYardCount : 0,
    },
    {
      label: "upcoming bookings",
      value:
        countOfUpcomingBookings.length > 0
          ? countOfUpcomingBookings[0].upcomingBookingsCount
          : 0,
    },
  ];

  return { series };
}

async function getMostBookedCarsInternal() {
  const startDate = new Date();
  startDate.setDate(1);
  const endDate = new Date(
    startDate.getFullYear(),
    startDate.getMonth() + 1,
    0
  );

  const formattedStartDate = formatDate(startDate);
  const formattedEndDate = formatDate(endDate);

  const bookingAggregation = await CarModel.aggregate([
    {
      $match: { isDeleted: false },
    },
    {
      $unwind: "$bookings",
    },
    {
      $match: {
        $or: [
          {
            "bookings.fromDate": {
              $gte: formattedStartDate,
              $lte: formattedEndDate,
            },
          },
          {
            "bookings.toDate": {
              $gte: formattedStartDate,
              $lte: formattedEndDate,
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: "$_id",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 4,
    },
  ]);

  const series = await Promise.all(
    bookingAggregation.map(async (booking: any) => {
      const car = await CarModel.findById(booking._id);
      return {
        label: car?.name,
        value: booking.count,
      };
    })
  );

  return { series };
}

function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";
  return `${day}-${month}-${year} ${hours}:${minutes} ${period}`;
}
