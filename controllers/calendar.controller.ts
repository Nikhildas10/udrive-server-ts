import { NextFunction, Request, Response } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import { calendarModel } from "../models/calendar.model";

export const createEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await calendarModel.create(req.body);
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      next(new ErrorHandler(err.message, 400));
    }
  }
);

export const editEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const updatedData = req.body;
    const updatedEvent = await calendarModel.findByIdAndUpdate(
      id,
      updatedData,
      { new: true }
    );
    if (!updatedEvent) {
      res.status(404).json({ message: "event not found" });
      return;
    }
    res.status(200).json({ success: true, updatedEvent });
  }
);

export const getEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const event = await calendarModel.find({ isDeleted: false });
    if (!event) {
      res.status(400).json({ success: false, message: "no events found" });
    }
    res.status(200).json({ success: true, event });
  }
);

export const getSingleEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const event = await calendarModel.findById(id);
    if (!event) {
      res.status(400).json({ success: false, message: "no events found" });
    }
    res.status(200).json({ success: true, event });
  }
);

export const deleteEvent = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const deletedData = await calendarModel.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (!deletedData) {
      res.status(400).json({ success: false, message: "incorrect event id" });
    }
    res
      .status(200)
      .json({ success: true, message: "event deleted successfully" });
  }
);

export const deleteMultipleEvents = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { eventIds } = req.body;

      if (!eventIds) {
        return next(new ErrorHandler("Invalid event ID provided", 400));
      }

      const deletedEvents = await calendarModel.updateMany(
        { _id: { $in: eventIds } },
        { isDeleted: true }
      );

      res.status(200).json({
        success: true,
        message: "events deleted successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
