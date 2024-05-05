import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import CarModel, { ICar } from "../models/car.model";
import getDataUri from "../utils/dataUri";
import cloudinary from "../utils/cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import BookingModel from "../models/booking.model";
import mongoose from "mongoose";
import { format, parse } from "date-fns";

export const addCars = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      manufacturingCompany,
      yearOfManufacturing,
      fuelType,
      transmission,
      insurance,
      lastService,
      serviceInterval,
    } = req.body;

    try {
      let rcBookResult: any,
        insurancePolicyResult: any,
        pollutionCertificateResult: any,
        carImageResult: any;

      if (req.body.rcBook) {
        rcBookResult = await cloudinary.uploader.upload(req.body.rcBook, {
          folder: "cars",
        });
      }

      if (req.body.insurancePolicy) {
        insurancePolicyResult = await cloudinary.uploader.upload(
          req.body.insurancePolicy,
          {
            folder: "cars",
          }
        );
      }

      if (req.body.pollutionCertificate) {
        pollutionCertificateResult = await cloudinary.uploader.upload(
          req.body.pollutionCertificate,
          {
            folder: "cars",
          }
        );
      }
      if (req.body.carImage) {
        carImageResult = await cloudinary.uploader.upload(req.body.carImage, {
          folder: "cars",
        });
      }

      const newCarData = {
        name,
        manufacturingCompany,
        yearOfManufacturing,
        fuelType,
        transmission,
        insurance,
        lastService,
        serviceInterval,
        rcBook: rcBookResult
          ? {
              public_id: rcBookResult.public_id,
              url: rcBookResult.secure_url,
              filetype: rcBookResult?.format == "pdf" ? "pdf" : "image",
            }
          : undefined,
        insurancePolicy: insurancePolicyResult
          ? {
              public_id: insurancePolicyResult.public_id,
              url: insurancePolicyResult.secure_url,
              filetype:
                insurancePolicyResult?.format == "pdf" ? "pdf" : "image",
            }
          : undefined,
        pollutionCertificate: pollutionCertificateResult
          ? {
              public_id: pollutionCertificateResult.public_id,
              url: pollutionCertificateResult.secure_url,
              filetype:
                pollutionCertificateResult?.format == "pdf" ? "pdf" : "image",
            }
          : undefined,
        carImage: carImageResult
          ? {
              public_id: carImageResult.public_id,
              url: carImageResult.secure_url,
            }
          : undefined,
      };
      console.log(newCarData);

      const newCar: ICar = new CarModel(newCarData);
      const savedCar = await newCar.save();
      res.status(201).json({ success: true, savedCar });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getAllCar = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cars = await CarModel.find({ isDeleted: false });
      res.status(200).json({ success: true, cars });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getSingleCar = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ErrorHandler("Please provide a car ID", 400));
      }
      const cars = await CarModel.findOne({ _id: id, isDeleted: false });

      if (!cars) {
        return next(new ErrorHandler("car not found", 404));
      }
      res.status(200).json({ success: true, cars });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const editCar = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    console.log(req.body);
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ErrorHandler("Invalid car ID", 400));
      }

      console.log("editCar", req.body);
      const updatedCarData: any = { ...req.body };

      const uploadImageIfNotExists = async (imageField: string) => {
        // Check if the image field is present in the request body
        if (!req.body[imageField]) return;

        // Check if the image already has a public_id (meaning it's not a new upload)
        if (!req.body[imageField].public_id) {
          const result = await cloudinary.uploader.upload(
            req.body[imageField],
            {
              folder: "cars",
            }
          );
          updatedCarData[imageField] = {
            public_id: result.public_id,
            url: result.secure_url,
            filetype: result?.format === "pdf" ? "pdf" : "image",
          };
        }
      };

      await uploadImageIfNotExists("carImage");

      await Promise.all([
        uploadImageIfNotExists("rcBook"),
        uploadImageIfNotExists("insurancePolicy"),
        uploadImageIfNotExists("pollutionCertificate"),
      ]);

      const updatedCar = await CarModel.findByIdAndUpdate(id, updatedCarData, {
        new: true,
      });

      if (!updatedCar) {
        return next(new ErrorHandler("Car not found", 404));
      }

      res.status(200).json({ success: true, updatedCar });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const deleteCar = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ErrorHandler("invalid car id", 400));
      }
      const deletedCar = await CarModel.findByIdAndUpdate(
        id,
        { isDeleted: true },
        { new: true }
      );
      if (!deletedCar) {
        return next(new ErrorHandler("car not found", 404));
      }
      res.status(200).json({
        success: true,
        message: "car has been deleted successfully",
        deletedCar,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const deleteMultipleCars = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { carIds } = req.body;

      if (!carIds) {
        return next(new ErrorHandler("Invalid car Id provided", 400));
      }

      const deletedCars = await CarModel.updateMany(
        { _id: { $in: carIds } },
        { isDeleted: true }
      );

      res.status(200).json({
        success: true,
        message: "cars deleted successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const runningCars = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentDate = formatDate(new Date());
      const currentTime = new Date().getHours();
      console.log(currentDate);

      const runningCars = await CarModel.aggregate([
        {
          $match: {
            isDeleted: false,
            "bookings.fromDate": { $lte: currentDate },
            "bookings.toDate": { $gte: currentDate },
          },
        },
        {
          $unwind: "$bookings",
        },
        {
          $match: {
            "bookings.fromDate": { $lte: currentDate },
          },
        },
        {
          $addFields: {
            runningDate: {
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

      const filteredRunningCars = runningCars.filter((car) => {
        const fromDateTime = new Date(car.bookings.fromDate);
        const toDateTime = new Date(car.bookings.toDate);
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

      res.status(200).json({ success: true, runningCars: filteredRunningCars });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const carsOnYard = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const currentDate = formatDate(new Date());

      // Fetch running cars
      const runningCars = await CarModel.aggregate([
        {
          $match: {
            isDeleted: false,
            "bookings.fromDate": { $lte: currentDate },
            "bookings.toDate": { $gte: currentDate },
          },
        },
        {
          $unwind: "$bookings",
        },
        {
          $match: {
            "bookings.fromDate": { $lte: currentDate },
          },
        },
        {
          $addFields: {
            nextAvailableDate: "$bookings.fromDate", // Use fromDate as nextAvailableDate
          },
        },
        {
          $sort: {
            "bookings.fromDate": 1,
          },
        },
      ]);

      const filteredRunningCars = runningCars.filter((car) => {
        const fromDateTime = new Date(car.bookings.fromDate);
        const toDateTime = new Date(car.bookings.toDate);
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
        if (currentDateTime >= fromDateTime && currentDateTime <= toDateTime) {
          return true;
        }

        return false;
      });

      const runningCarsIds = filteredRunningCars.map((car) => car?._id);

      // Fetch all cars except running cars
      const notRunningCars = await CarModel.find({
        isDeleted: false,
        _id: { $nin: runningCarsIds }
      });

      const sortedNotRunningCars = notRunningCars.map((car) => {
        return {
          ...car.toObject(),
          bookings: car.bookings.sort(
            (a, b) => new Date(a.fromDate) - new Date(b.fromDate)
          ),
        };
      });

      res.status(200).json({ success: true, carsOnYard: sortedNotRunningCars });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

// export const carsOnYard = catchAsyncErrors(
//   async (req: Request, res: Response, next: NextFunction) => {
//     try {
//       const currentDate = formatDate(new Date());
//       const currentTime = new Date().getHours();

//       const notRunningCars = await CarModel.aggregate([
//         {
//           $match: {
//             isDeleted: false,
//           },
//         },
//         {
//           $unwind: "$bookings",
//         },

//         {
//           $addFields: {
//             nextAvailableDate: "$bookings.fromDate", // Use fromDate as nextAvailableDate
//           },
//         },
//         {
//           $sort: { nextAvailableDate: 1 },
//         },
//       ]);
//       const cars = await CarModel.find({
//         isDeleted: false,
//         $or: [
//           { bookings: { $exists: false } }, // Find cars where the bookings array does not exist
//           { bookings: { $elemMatch: { $exists: false } } }, // Find cars where the bookings array exists but is empty
//         ],
//       });

//       const filteredNonRunningCars = notRunningCars.filter((car) => {
//         const fromDateTime = new Date(car.bookings.fromDate);
//         const toDateTime = new Date(car.bookings.toDate);
//         const getCurrentDateTime = () => {
//           const now = new Date();
//           const year = now.getFullYear();
//           const month = now.getMonth();
//           const day = now.getDate();
//           const hours = now.getHours();
//           const minutes = now.getMinutes();
//           const seconds = now.getSeconds();
//           return new Date(year, month, day, hours, minutes, seconds);
//         };

//         const currentDateTime = getCurrentDateTime();
//         // Check if current time is after the booking end time
//         if (currentDateTime < fromDateTime) {
//           return true;
//         }
//         if (!fromDateTime) {
//           return true;
//         }

//         // Check if the current time is after the booking end time
//         if (currentDateTime > toDateTime) {
//           return true;
//         }

//         // If the current time is within the booking time range, the car is considered running
//         return false;
//       });
//       const final = Object.values(
//         filteredNonRunningCars.reduce((uniqueCars, car) => {
//           // Assuming each car has a unique identifier field named 'carId'
//           const carId = car?._id;

//           // Add the car to the uniqueCars object if it's not already present
//           if (!uniqueCars[carId]) {
//             uniqueCars[carId] = car;
//           }

//           return uniqueCars;
//         }, {})
//       );

//       const runningCars = await CarModel.aggregate([
//         {
//           $match: {
//             isDeleted: false,
//             "bookings.fromDate": { $lte: currentDate },
//             "bookings.toDate": { $gte: currentDate },
//           },
//         },
//         {
//           $unwind: "$bookings",
//         },
//         {
//           $match: {
//             "bookings.fromDate": { $lte: currentDate },
//           },
//         },
//         {
//           $addFields: {
//             runningDate: {
//               $concat: ["$bookings.fromDate", " to ", "$bookings.toDate"],
//             },
//           },
//         },
//         {
//           $sort: {
//             "bookings.fromDate": 1,
//           },
//         },
//       ]);

//       const filteredRunningCars = runningCars.filter((car) => {
//         const fromDateTime = new Date(car.bookings.fromDate);
//         const toDateTime = new Date(car.bookings.toDate);
//         const getCurrentDateTime = () => {
//           const now = new Date();
//           const year = now.getFullYear();
//           const month = now.getMonth();
//           const day = now.getDate();
//           const hours = now.getHours();
//           const minutes = now.getMinutes();
//           const seconds = now.getSeconds();
//           return new Date(year, month, day, hours, minutes, seconds);
//         };

//         const currentDateTime = getCurrentDateTime();
//         // Check if current time is after the booking end time
//         if (currentDateTime > toDateTime) {
//           return false;
//         }

//         // Check if current time is within the booking time range
//         if (currentDateTime > fromDateTime && currentDateTime < toDateTime) {
//           return true;
//         }

//         return false;
//       });
//       // Extract _id values from filteredRunningCars array and convert them to strings
//       const runningCarIds = filteredRunningCars.map((car) =>
//         car?._id.toString()
//       );

//       // Filter out cars from final array that have corresponding entries in runningCarIds array
//       const result = cars.filter(
//         (car) => !runningCarIds.includes(car?._id.toString())
//       );

//       // Now 'result' array contains cars from 'final' array excluding those present in 'filteredRunningCars' array

//       res.status(200).json({
//         success: true,
//         carsOnYard: [res],
//       });
//     } catch (err: any) {
//       return next(new ErrorHandler(err.message, 400));
//     }
//   }
// );

export const getMostBookedCars = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startDate = new Date();
      startDate.setDate(1);
      const endDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + 1,
        0
      );

      //convert to string
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
          const car = await CarModel.findById(booking?._id);
          return {
            label: car?.name,
            value: booking.count,
          };
        })
      );

      res.status(200).json({ success: true, series });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
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
// Function to format date to dd-mm-yyyy format
function formatDate(date: Date): string {
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

function formattDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = "12";
  const minutes = "00";
  const period = "PM";
  return `${day}-${month}-${year} ${hours}:${minutes} ${period}`;
}

export const getCarTotalRevenue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ message: "id not found" });
    }

    const car = await CarModel.aggregate([
      {
        $match: { _id: new mongoose.Types.ObjectId(id) },
      },
      {
        $unwind: "$bookings",
      },
      {
        $group: {
          _id: "$_id",
          totalRevenue: { $sum: "$bookings.total" },
        },
      },
      {
        $project: {
          _id: 0,
          totalRevenue: 1,
        },
      },
    ]);

    if (car.length === 0) {
      return res.status(200).json({ success: true, totalRevenue: 0 });
    }
    const totalRevenue = car[0].totalRevenue;

    res.status(200).json({ success: true, totalRevenue });
  } catch (err: any) {
    next(new ErrorHandler(err.message, 400));
  }
};
