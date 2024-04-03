import { Response } from "express";
import userModel from "../models/user.model";
import { redis } from "../utils/redis";
import employeeModel from "../models/employee.model ";

//get user by id
export const getUserById = async (id: string, res: Response) => {
  const user = await employeeModel.findById(id);
  res.status(201).json({
    success: true,
    user,
  });
};
