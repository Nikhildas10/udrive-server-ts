import { NextFunction, Request, Response } from "express";
import * as customerService from "../services/customer.service";
import customerModel, { ICustomer } from "../models/customer.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";

export const createCustomer = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await customerModel.create(req.body);
      res.status(201).json({ success: true, data });
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
    const updatedCustomer = await customerService.updateCustomerById(
      customerId,
      updatedData
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
