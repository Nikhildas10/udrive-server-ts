import { Request, Response, NextFunction } from "express";
import CarModel, { ICar } from "../models/car.model";
import cloudinary, { UploadApiResponse } from "cloudinary";
import { upload } from "../middleware/multer";

const cloudinaryFileUploadMethod = async (file: string) => {
  return new Promise((resolve, reject) => {
    cloudinary.v2.uploader.upload(
      file,
      (error: any, result: UploadApiResponse) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );
  });
};

export const addCars = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || req.files.length !== 3) {
      return res.status(400).json({ message: "Please upload exactly 3 files" });
    }

    const urls: string[] = [];

    for (const file of req.files as Express.Multer.File[]) {
      const { path } = file;
      const newPath = await cloudinaryFileUploadMethod(path);
      // urls.push(newPath);
    }

    const {
      carName,
      modelName,
      manufacturingCompany,
      yearOfManufacturing,
      fuelType,
      transmission,
      insurance,
      lastService,
      serviceInterval,
    } = req.body;

    const newCar: ICar = new CarModel({
      carName,
      modelName,
      manufacturingCompany,
      yearOfManufacturing,
      fuelType,
      transmission,
      insurance: new Date(insurance),
      lastService: new Date(lastService),
      serviceInterval,
      rcBook: urls[0] || "",
      insurancePolicy: urls[1] || "",
      pollutionCertificate: urls[2] || "", 
    });

    const savedCar = await newCar.save();
    res.status(201).json(savedCar);
  } catch (err: any) {
    next(new Error(`Error adding cars: ${err.message}`));
  }
};

export const getCars = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const cars: ICar[] = await CarModel.find({});
    res.json(cars);
  } catch (err: any) {
    next(new Error(`Error getting cars: ${err.message}`));
  }
};

export const deleteCars = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { _id } = req.params;
    const deletedCar = await CarModel.findByIdAndDelete(_id);
    res.json({ message: "Car deleted successfully", deletedCar });
  } catch (err: any) {
    next(new Error(`Error deleting car: ${err.message}`));
  }
};

export const updateCars = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { _id } = req.params;
    const {
      model,
      companyName,
      manufacturingYear,
      fuel,
      transmission,
      insuranceDate,
      lastService,
      serviceInterval,
      rcBook,
      pollutionCertificate,
      insurancePolicy,
    } = req.body;

    const updatedCar = await CarModel.findByIdAndUpdate(
      _id,
      {
        model,
        companyName,
        manufacturingYear,
        fuel,
        transmission,
        insuranceDate,
        lastService,
        serviceInterval,
        rcBook,
        pollutionCertificate,
        insurancePolicy,
      },
      { new: true }
    );

    res.json(updatedCar);
  } catch (err: any) {
    next(new Error(`Error updating car: ${err.message}`));
  }
};
