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
       const parseDate = (dateString) => {
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
       const filteredRunningCars = runningCars.filter((car) => {
         const fromDateTime = parseDate(car.bookings.fromDate);
         const toDateTime = parseDate(car.bookings.toDate);
         const getCurrentDateTime = () => {
           const now = new Date();
           const year = now.getFullYear();
           const month = now.getMonth();
           const day = now.getDate();
           const hours = now.getHours();
           const minutes = now.getMinutes();
           const seconds = now.getSeconds();
           return new Date(year, month, day, hours, minutes, seconds);
         };

         const currentDateTime = getCurrentDateTime();
         // Check if current time is after the booking end time
         if (currentDateTime > toDateTime) {
           return false;
         }

         // Check if current time is within the booking time range
         if (currentDateTime > fromDateTime && currentDateTime < toDateTime) {
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

         const getCurrentDateTime = () => {
           const now = new Date();
           const year = now.getFullYear();
           const month = now.getMonth();
           const day = now.getDate();
           const hours = now.getHours();
           const minutes = now.getMinutes();
           const seconds = now.getSeconds();
           return new Date(year, month, day, hours, minutes, seconds);
         };
         const currentDateTime = getCurrentDateTime();

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


               const filteredUpcomingBookings = upcomingBookings.filter(
                 (booking) => {
                   const fromDate = parseDatee(booking.fromDate);
                   console.log(fromDate);

                   if (currentDateTime < fromDate) {
                     return true;
                   }
                 }
               );


      const series = [
        {
          label: "running cars",
          value:
            filteredRunningCars.length,
        },
        {
          label: "cars on yard",
          value:
            sortedNotRunningCars.length 
        },
        {
          label: "upcoming bookings",
          value:
            filteredUpcomingBookings.length
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