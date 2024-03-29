import { Response } from "express";
import { redis } from "../utils/redis";
import courseModel from "../models/course.model";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import CarModel from "../models/car.model";

//get user by id
export const createCar = catchAsyncErrors(async (data: any, res: Response) => {
  const car = await CarModel.create(data);
  res.status(201).json({
    success: true,
    car,
  });
});

// Update Car by ID
export const update_car = async (id: string, data: any) => {
  const car = await CarModel.findByIdAndUpdate(id, data, { new: true });
  return car;
};

// Delete Car by ID
export const delete_car = async (id: string) => {
  const car = await CarModel.findByIdAndDelete(id);
  return car;
};

// Get all Cars
export const get_Cars = async () => {
  const cars = await CarModel.find({});
  return cars;
};

// Get Car by ID
export const get_car_by_id = async (id: string) => {
  const car = await CarModel.findById(id);
  return car;
};