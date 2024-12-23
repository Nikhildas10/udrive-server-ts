import { NextFunction, Request, Response } from "express";
import * as customerService from "../services/customer.service";
import customerModel, { ICustomer } from "../models/customer.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import cloudinary from "../utils/cloudinary";
import mongoose from "mongoose";

export const createCustomer = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      let customerImageResult: any;
      let passportImageResults: any[] = [];

      // Upload the customer image if it exists
      if (req.body.customerImage) {
        customerImageResult = await cloudinary.uploader.upload(
          req.body.customerImage,
          {
            folder: "customers",
          }
        );
      }

      // Upload all passport images if they exist
      if (req.body.passportImage && Array.isArray(req.body.passportImage)) {
        passportImageResults = await Promise.all(
          req.body.passportImage.map(async (base64Image: string) => {
            return await cloudinary.uploader.upload(base64Image, {
              folder: "cars",
            });
          })
        );
      }
      // Prepare customer data
      const customerData = {
        ...req.body,
        customerImage: customerImageResult
          ? {
              public_id: customerImageResult.public_id,
              url: customerImageResult.secure_url,
            }
          : undefined,
        passportImage: passportImageResults.length
          ? passportImageResults.map((result) => ({
              public_id: result.public_id,
              url: result.secure_url,
              filetype: result?.format === "pdf" ? "pdf" : "image",
            }))
          : undefined,
      };

      // Create the customer in the database
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
    const updatedData = { ...req.body };

    // Check and process customerImage
    if (req.body.customerImage) {
      if (req.body.customerImage.startsWith("data:")) {
        // Upload new customer image if it's Base64
        const uploadedCustomerImage = await cloudinary.uploader.upload(
          req.body.customerImage,
          { folder: "customers" }
        );
        updatedData.customerImage = {
          public_id: uploadedCustomerImage.public_id,
          url: uploadedCustomerImage.secure_url,
        };
      }
    }

    // Check and process passportImage
    if (req.body.passportImage && Array.isArray(req.body.passportImage)) {
      const updatedPassportImages = await Promise.all(
        req.body.passportImage.map(async (image: string) => {
          if (image.startsWith("data:")) {
            // Upload new image if it's Base64
            const result = await cloudinary.uploader.upload(image, {
              folder: "customers",
            });
            return {
              public_id: result.public_id,
              url: result.secure_url,
              filetype: result?.format === "pdf" ? "pdf" : "image",
            };
          } else {
            // Return the existing URL directly
            return {
              url: image, // Keep the current URL as is
              filetype: image.endsWith(".pdf") ? "pdf" : "image",
            };
          }
        })
      );
      updatedData.passportImage = updatedPassportImages;
    }

    // Update the customer in the database
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

export const getCustomerTotalRevenue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params;
    const customerData = await customerModel.findById(id);
    if (!customerData) {
      res.status(400).json({ message: "customer not found" });
    }
    const customer = await customerModel.aggregate([
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
    ]);

    if (customer.length === 0) {
      return res.status(200).json({ success: true, totalRevenue: 0 });
    }
    const totalRevenue = customer[0].totalRevenue;

    res.status(200).json({ success: true, totalRevenue });
  } catch (err: any) {
    next(new ErrorHandler(err.message, 400));
  }
};
