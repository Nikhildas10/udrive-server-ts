import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import CarModel, { ICar } from "../models/car.model";
import getDataUri from "../utils/dataUri";
import cloudinary from "../utils/cloudinary";
import ErrorHandler from "../utils/ErrorHandler";

export const addCars =catchAsyncErrors( async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
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
    const rcBookResult = await cloudinary.uploader.upload(req.body.rcBook, {
      folder: "cars",
    });

    const insurancePolicyResult = await cloudinary.uploader.upload(
      req.body.insurancePolicy,
      {
        folder: "cars",
      }
    );

    const pollutionCertificateResult = await cloudinary.uploader.upload(
      req.body.pollutionCertificate,
      {
        folder: "cars",
      }
    );

    const newCarData = {
      name,
      manufacturingCompany,
      yearOfManufacturing,
      fuelType,
      transmission,
      insurance,
      lastService,
      serviceInterval,
      rcBook: {
        public_id: rcBookResult.public_id,
        url: rcBookResult.secure_url,
      },
      insurancePolicy: {
        public_id: insurancePolicyResult.public_id,
        url: insurancePolicyResult.secure_url,
      },
      pollutionCertificate: {
        public_id: pollutionCertificateResult.public_id,
        url: pollutionCertificateResult.secure_url,
      },
    };

    const newCar: ICar = new CarModel(newCarData);
    const savedCar = await newCar.save();
    res.status(201).json({ success: true, savedCar });
  } catch (err: any) {
    return next(new ErrorHandler(err.message, 400));
  }
});

export const getAllCar = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cars = await CarModel.find({});
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
      const cars = await CarModel.findById(id);
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
    try {
      const { id } = req.params;
      if (!id) {
        return next(new ErrorHandler("Invalid car ID", 400));
      }

      const files = await req.files;
      const urlArray: string[] = [];

      for (let index: any = 0; index < files.length; index++) {
        const file = files[index];
        const fileUri = getDataUri(file);

        const myCloud: any = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload(fileUri, (error, result) => {
            if (error) {
              reject(new Error(`Error uploading file: ${error.message}`));
            } else {
              resolve(result);
            }
          });
        });

        urlArray.push(myCloud.secure_url);
      }

      const updatedCarData = { ...req.body };

      if (urlArray.length >= 1) {
        updatedCarData.rcBook = urlArray[0];
      }
      if (urlArray.length >= 2) {
        updatedCarData.insurancePolicy = urlArray[1];
      }
      if (urlArray.length >= 3) {
        updatedCarData.pollutionCertificate = urlArray[2];
      }

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
      const deletedCar = await CarModel.findByIdAndDelete(id);
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
