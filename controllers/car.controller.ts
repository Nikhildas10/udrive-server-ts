import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import CarModel, { ICar } from "../models/car.model";
import getDataUri from "../utils/dataUri";
import cloudinary from "../utils/cloudinary";
import ErrorHandler from "../utils/ErrorHandler";
import BookingModel from "../models/booking.model";

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
        carImageResult = await cloudinary.uploader.upload(
          req.body.carImage,
          {
            folder: "cars",
          }
        );
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
      res.status(200).json({ succes: true, cars });
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
export const getBookedCars = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const bookedCars = await CarModel.find({
        "bookings.0": { $exists: true },
        isDeleted: false,
      });

      res.status(200).json({ success: true, bookedCars });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
export const getNonBookedCars = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nonBookedCars = await CarModel.find({
        "bookings.0": { $exists: false },
        isDeleted: false,
      });

      res.status(200).json({ success: true, nonBookedCars });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);


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
          const car = await CarModel.findById(booking._id);
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

// Function to format date to dd-mm-yyyy format
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const period = date.getHours() >= 12 ? "PM" : "AM";
  return `${day}-${month}-${year} ${hours}:${minutes} ${period}`;
}
