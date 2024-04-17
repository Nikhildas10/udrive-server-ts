import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import CarModel, { ICar } from "../models/car.model";
import getDataUri from "../utils/dataUri";
import cloudinary from "../utils/cloudinary";
import ErrorHandler from "../utils/ErrorHandler";

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
        pollutionCertificateResult: any;

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

      // Function to upload image to Cloudinary if it doesn't have a public ID
      const uploadImageIfNotExists = async (imageField: string) => {
        if (!req.body[imageField]) return; // If field is empty, do nothing
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
          };
        } else {
          // If the image already has a public ID, retain its data
          updatedCarData[imageField] = req.body[imageField];
        }
      };

      // Check and upload each image if necessary
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
