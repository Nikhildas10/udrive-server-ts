import { NextFunction, Request, Response } from "express";
import * as customerService from "../services/customer.service";
import customerModel, { ICustomer } from "../models/customer.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import cloudinary from "../utils/cloudinary";

export const createCustomer = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let customerImageResult: any;
      let passportImageResult: any;

      if (req.body.customerImage) {
        customerImageResult = await cloudinary.uploader.upload(
          req.body.customerImage,
          {
            folder: "customers",
          }
        );
      }
      if (req.body.passportImage) {
        passportImageResult = await cloudinary.uploader.upload(
          req.body.passportImage,
          {
            folder: "customers",
          }
        );
      }

      const customerData = {
        ...req.body,
        customerImage: customerImageResult
          ? {
              public_id: customerImageResult.public_id,
              url: customerImageResult.secure_url,
            }
          : undefined,
        passportImage: passportImageResult
          ? {
              public_id: passportImageResult.public_id,
              url: passportImageResult.secure_url,
            }
          : undefined,
      };

      const data = await customerModel.create(customerData);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId: string = req.params.id;
    const updatedData = req.body;

    let updatedCustomerImageResult: any;
    let updatedPassportImageResult: any;

    if (req.body.customerImage) {
      updatedCustomerImageResult = await cloudinary.uploader.upload(
        req.body.customerImage,
        {
          folder: "customers",
        }
      );
    }
    if (req.body.passportImage) {
      updatedPassportImageResult = await cloudinary.uploader.upload(
        req.body.passportImage,
        {
          folder: "customers",
        }
      );
    }

    if (updatedCustomerImageResult) {
      updatedData.customerImage = {
        public_id: updatedCustomerImageResult.public_id,
        url: updatedCustomerImageResult.secure_url,
      };
    }
    if (updatedPassportImageResult) {
      updatedData.passportImage = {
        public_id: updatedPassportImageResult.public_id,
        url: updatedPassportImageResult.secure_url,
      };
    }

    const updatedCustomer = await customerModel.findByIdAndUpdate(
      customerId,
      updatedData,
      { new: true }
    );

    if (!updatedCustomer) {
      res.status(404).json({ message: "Customer not found" });
      return;
    }

    res.status(200).json({ success: true, updatedCustomer });
  } catch (err: any) {
    next(new ErrorHandler(err.message, 400));
  }
};

export const deleteCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId: string = req.params.id;
    await customerService.deleteCustomerById(customerId);
    res
      .status(200)
      .json({ success: true, message: "Customer deleted successfully" });
  } catch (err: any) {
    next(new ErrorHandler(err.message, 400));
  }
};

export const getAllCustomers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customers = await customerService.getAllCustomers();
    res.status(200).json({ success: true, customers });
  } catch (err: any) {
    next(new ErrorHandler(err.message, 400));
  }
};

export const getSingleCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const customerId: string = req.params.id;
    const customer = await customerService.getSingleCustomer(customerId);
    if (!customer) {
      res.status(404).json({ success: false, message: "Customer not found" });
      return;
    }
    res.status(200).json({ success: true, customer });
  } catch (err: any) {
    next(new ErrorHandler(err.message, 400));
  }
};

export const deleteMultipleCustomer = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { customerIds } = req.body;

      if (!customerIds) {
        return next(new ErrorHandler("Invalid customer IDs provided", 400));
      }

      const deletedCustomer = await customerModel.updateMany(
        { _id: { $in: customerIds } },
        { isDeleted: true }
      );

      res.status(200).json({
        success: true,
        message: "customers deleted successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
