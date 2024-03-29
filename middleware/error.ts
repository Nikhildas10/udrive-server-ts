import { Request, Response, NextFunction } from "express";
import ErrorHandler from "../utils/ErrorHandler";
export const ErorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal server error";

  //wrong mongoDb id error
  if (err.name === "CastError") {
    const message = `Resource not found Invalid ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  //Duplicate key error
  if (err.name === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} entered`;
    err = new ErrorHandler(message, 400);
  }

  //wrong jwt error
  if (err.name === "JsonWebTokenError") {
    const message = `json web token invalid ,try again`;
    err = new ErrorHandler(message, 400);
  }

  //jwt Expired error

  if (err.name === "TokenExpiredError") {
    const message = `Json web token expired ,try again`;
    const err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    success:false,
    message:err.message
  })
};
