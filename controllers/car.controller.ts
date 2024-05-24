import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import CarModel, { ICar } from "../models/car.model";
import getDataUri from "../utils/dataUri";
import cloudinary from "../utils/cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import BookingModel from "../models/booking.model";
import mongoose from "mongoose";
import { format, parse } from "date-fns";
import { notificationModel } from "../models/notification.model";
import { emitSocketEvent } from "../server";

export const addCars = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const {
      name,
      manufacturingCompany,
      yearOfManufacturing,
      fuelType,
      transmission,
      insurance,
      vehicleNumber,
      lastService,
      lastServiceKilometre,
      serviceInterval,
      totalKmCovered,
      pollution,
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
        vehicleNumber,
        lastService,
        lastServiceKilometre,
        serviceInterval,
        pollution,
        totalKmCovered,
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
      // console.log(newCarData);

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
    // console.log(req.body);
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ErrorHandler("Invalid car ID", 400));
      }

      // console.log("editCar", req.body);
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
      // console.log(currentDate);

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

        const getCurrentDateTimeUTC = () => {
          return new Date();
        };
        const currentDateTime = getCurrentDateTimeUTC();
        console.log(currentDateTime);

        // Check if current time is after the booking end time
        if (currentDateTime > toDateTime) {
          return false;
        }
        //  console.log(currentDateTime);

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
          },
        },
        {
          $unwind: "$bookings",
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

        const currentDateTime = new Date();
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

export const lastInsuranceKm = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const km = req.body.lastServiceKm;
      if (km) {
        const updatedkm = await CarModel.findByIdAndUpdate(
          id,
          {
            lastServiceKilometre: km,
          },
          { new: true }
        );
        res.status(200).json({ success: true, updatedkm });
      }
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);
export const resetServiceKm = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const updatedkm = await CarModel.findByIdAndUpdate(
        id,
        {
          serviceKilometre: 0,
        },
        { new: true }
      );
      res.status(200).json({ success: true, updatedkm });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getServiceDueCars = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cars = await CarModel.find({ isDeleted: false });

      const dueCars8 = cars.filter((car) => {
        return (
          car.serviceKilometre < car.serviceInterval - 1000 &&
          car.serviceKilometre >= car.serviceInterval - 2000
        );
      });

      const dueCars9 = cars.filter((car) => {
        return (
          car.serviceKilometre < car.serviceInterval - 500 &&
          car.serviceKilometre >= car.serviceInterval - 1000
        );
      });

      const dueCars9and5 = cars.filter((car) => {
        return (
          car.serviceKilometre < car.serviceInterval &&
          car.serviceKilometre >= car.serviceInterval - 500
        );
      });

      const dueCarsFull = cars.filter((car) => {
        return car.serviceKilometre >= car.serviceInterval;
      });

      if (dueCars8.length > 0) {
        for (const car of dueCars8) {
          const notificationExists = await notificationModel.findOne({
            carId: car._id,
            notificationType: "serviceBefore2000",
          });

          if (!notificationExists) {
            const notificationData = {
              currentDate: new Date(),
              type: "serviceBefore2000",
              title: `Next service for ${car.name} car is in less than 2000 kilometre. Schedule service immediately to prevent potential issues`,
              image: car.carImage,
              car: car,
              carId: car._id,
              notificationType: "serviceBefore2000",
            };
            const notification = await notificationModel.create(
              notificationData
            );
            await notification.save();
            emitSocketEvent("serviceBefore2000", notificationData);
          }
        }
      }

      if (dueCars9.length > 0) {
        for (const car of dueCars9) {
          const notificationExists = await notificationModel.findOne({
            carId: car._id,
            notificationType: "serviceBefore1000",
          });

          if (!notificationExists) {
            const notificationData = {
              currentDate: new Date(),
              type: "serviceBefore1000",
              title: `Next service for ${car.name} car is in less than 1000 kilometre. Schedule service immediately to prevent potential issues`,
              image: car.carImage,
              car: car,
              carId: car._id,
              notificationType: "serviceBefore1000",
            };
            const notification = await notificationModel.create(
              notificationData
            );
            await notification.save();
            emitSocketEvent("serviceBefore1000", notificationData);
          }
        }
      }

      if (dueCars9and5.length > 0) {
        for (const car of dueCars9and5) {
          const notificationExists = await notificationModel.findOne({
            carId: car._id,
            notificationType: "serviceBefore500",
          });

          if (!notificationExists) {
            const notificationData = {
              currentDate: new Date(),
              type: "serviceBefore500",
              title: `Next service for ${car.name} car is in less than 500 kilometre. Schedule service immediately to prevent potential issues`,
              image: car.carImage,
              car: car,
              carId: car._id,
              notificationType: "serviceBefore500",
            };
            const notification = await notificationModel.create(
              notificationData
            );
            await notification.save();
            emitSocketEvent("serviceBefore500", notificationData);
          }
        }
      }

      if (dueCarsFull.length > 0) {
        for (const car of dueCarsFull) {
          const notificationExists = await notificationModel.findOne({
            carId: car._id,
            notificationType: "serviceDueReached",
          });

          if (!notificationExists) {
            const notificationData = {
              currentDate: new Date(),
              type: "serviceDueReached",
              title: `${car.name} car's service is now overdue. Schedule service immediately to prevent potential issues`,
              image: car.carImage,
              car: car,
              carId: car._id,
              notificationType: "serviceDueReached",
            };
            const notification = await notificationModel.create(
              notificationData
            );
            await notification.save();
            emitSocketEvent("serviceDueReached", notificationData);
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getInsuranceDue = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cars = await CarModel.find({ isDeleted: false });
      const currentDate = new Date();

      if (cars) {
        const dueCars10 = cars.filter((car) => {
          const dueDate = new Date(car.insurance);
          const timeDiff = dueDate.getTime() - currentDate.getTime();
          const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

          return daysUntilDue === 10;
        });

        const dueCars5 = cars.filter((car) => {
          const dueDate = new Date(car.insurance);
          const timeDiff = dueDate.getTime() - currentDate.getTime();
          const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

          return daysUntilDue === 5;
        });

        const dueCarsOver = cars.filter((car) => {
          return car.insurance < currentDate;
        });

        if (dueCars10.length > 0) {
          for (const car of dueCars10) {
            const notificationExists = await notificationModel.findOne({
              carId: car._id,
              notificationType: "insuranceBefore10",
            });

            if (!notificationExists) {
              const notificationData = {
                currentDate: new Date(),
                type: "insuranceBefore10",
                title: `Insurance for the car ${car.name} is due in 10 days`,
                image: car.carImage,
                carId: car._id,
                notificationType: "insuranceBefore10",
              };
              const notification = await notificationModel.create(
                notificationData
              );
              await notification.save();

              emitSocketEvent("insuranceBefore10", notificationData);
            }
          }
        }

        if (dueCars5.length > 0) {
          for (const car of dueCars5) {
            const notificationExists = await notificationModel.findOne({
              carId: car._id,
              notificationType: "insuranceBefore5",
            });

            if (!notificationExists) {
              const notificationData = {
                currentDate: new Date(),
                type: "insuranceBefore5",
                title: `Insurance for the car ${car.name} is due in 5 days`,
                image: car.carImage,
                carId: car._id,
                notificationType: "insuranceBefore5",
              };
              const notification = await notificationModel.create(
                notificationData
              );
              await notification.save();

              emitSocketEvent("insuranceBefore5", notificationData);
            }
          }
        }

        if (dueCarsOver.length > 0) {
          for (const car of dueCarsOver) {
            const notificationExists = await notificationModel.findOne({
              carId: car._id,
              notificationType: "insuranceOver",
            });

            if (!notificationExists) {
              const notificationData = {
                currentDate: new Date(),
                type: "insuranceOver",
                title: `Insurance for the car ${car.name} is currently overdue`,
                image: car.carImage,
                carId: car._id,
                notificationType: "insuranceOver",
              };
              const notification = await notificationModel.create(
                notificationData
              );
              await notification.save();

              emitSocketEvent("insuranceOver", notificationData);
            }
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getServiceOverDueCars = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cars = await CarModel.find({ isDeleted: false });
      if (!cars) {
        return next(new ErrorHandler("no cars found", 400));
      }
      const dueCarsOver = cars.filter((car) => {
        const distanceToService = car.serviceInterval - car.serviceKilometre;
        return distanceToService <= 500;
      });
      res.status(200).json({ success: true, dueCarsOver });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getInsuaranceOverDue = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cars = await CarModel.find({ isDeleted: false });
      const currentDate = new Date();
      if (!cars) {
        return next(new ErrorHandler("no cars found", 400));
      }
      const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;
      const dueCarsOver = cars.filter((car) => {
        const insuranceDate = new Date(car.insurance);
        const differenceInMilliseconds =
          insuranceDate.getTime() - currentDate.getTime();
        return differenceInMilliseconds <= fiveDaysInMilliseconds;
      });
      res.status(200).json({ success: true, dueCarsOver });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getPollutionOverDue = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cars = await CarModel.find({ isDeleted: false });
      const currentDate = new Date();
      if (!cars) {
        return next(new ErrorHandler("no cars found", 400));
      }
      const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;
      const dueCarsPollution = cars.filter((car) => {
        const pollutionDate = new Date(car.pollution);
        const differenceInMilliseconds =
          pollutionDate.getTime() - currentDate.getTime();
        return differenceInMilliseconds <= fiveDaysInMilliseconds;
      });
      res.status(200).json({ success: true, dueCarsPollution });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getPollutionDue = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cars = await CarModel.find({ isDeleted: false });
      const currentDate = new Date();

      if (cars) {
        const dueCars10 = cars.filter((car) => {
          const dueDate = new Date(car.pollution);
          const timeDiff = dueDate.getTime() - currentDate.getTime();
          const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

          return daysUntilDue === 10;
        });

        const dueCars5 = cars.filter((car) => {
          const dueDate = new Date(car.pollution);
          const timeDiff = dueDate.getTime() - currentDate.getTime();
          const daysUntilDue = Math.ceil(timeDiff / (1000 * 3600 * 24));

          return daysUntilDue === 5;
        });

        const dueCarsOver = cars.filter((car) => {
          return car.pollution < currentDate;
        });

        if (dueCars10.length > 0) {
          for (const car of dueCars10) {
            const notificationExists = await notificationModel.findOne({
              carId: car._id,
              notificationType: "pollutionBefore10",
            });

            if (!notificationExists) {
              const notificationData = {
                currentDate: new Date(),
                type: "pollutionBefore10",
                title: `pollution for the car ${car.name} is due in 10 days`,
                image: car.carImage,
                carId: car._id,
                notificationType: "pollutionBefore10",
              };
              const notification = await notificationModel.create(
                notificationData
              );
              await notification.save();

              emitSocketEvent("pollutionBefore10", notificationData);
            }
          }
        }

        if (dueCars5.length > 0) {
          for (const car of dueCars5) {
            const notificationExists = await notificationModel.findOne({
              carId: car._id,
              notificationType: "pollutionBefore5",
            });

            if (!notificationExists) {
              const notificationData = {
                currentDate: new Date(),
                type: "pollutionBefore5",
                title: `pollution for the car ${car.name} is due in 5 days`,
                image: car.carImage,
                carId: car._id,
                notificationType: "pollutionBefore5",
              };
              const notification = await notificationModel.create(
                notificationData
              );
              await notification.save();

              emitSocketEvent("pollutionBefore5", notificationData);
            }
          }
        }

        if (dueCarsOver.length > 0) {
          for (const car of dueCarsOver) {
            const notificationExists = await notificationModel.findOne({
              carId: car._id,
              notificationType: "pollutionOver",
            });

            if (!notificationExists) {
              const notificationData = {
                currentDate: new Date(),
                type: "pollutionOver",
                title: `pollution for the car ${car.name} is currently overdue`,
                image: car.carImage,
                carId: car._id,
                notificationType: "pollutionOver",
              };
              const notification = await notificationModel.create(
                notificationData
              );
              await notification.save();

              emitSocketEvent("pollutionOver", notificationData);
            }
          }
        }
      }

      res.status(200).json({ success: true });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const addServiceHistory = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const serviceHistoryEntry = req.body;
    const date = new Date();
    try {
      const updatedCar = await CarModel.findByIdAndUpdate(
        id,
        {
          $push: { serviceHistory: serviceHistoryEntry },
          $set: {
            serviceKilometre: 0,
            lastService: date,
          },
        },
        { new: true }
      );
      if (!updatedCar) {
        return res.status(404).json({
          success: false,
          message: "Car not found",
        });
      }
      let totalAmount = 0;
      updatedCar.serviceHistory.forEach((entry) => {
        entry.worksDone.forEach((work) => {
          totalAmount += work.amount;
        });
      });

      if (totalAmount) {
        updatedCar.totalServiceAmount = totalAmount;
      }
      await updatedCar.save();
      res.status(200).json({ success: true, updatedCar });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);
