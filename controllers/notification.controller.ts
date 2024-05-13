import { Request, Response, NextFunction } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import { notificationModel } from "../models/notification.model";
import ErrorHandler from "../utils/ErrorHandler";

export const seenNotification = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const employeeId = req?.user?._id;      
      const updatedNotification = await notificationModel.findByIdAndUpdate(
        id,
        { $push: { seen: employeeId } },
        { new: true }
      );

      if (!updatedNotification) {
        return next(new ErrorHandler("Notification not found", 404));
      }

      res.status(200).json({
        success: true,
        message: "Notification has been seen",
        updatedNotification,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getNotification = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req?.user?._id;
      const notifications = await notificationModel
        .find({
          seen: { $nin: [employeeId] },
        })
        .sort({ currentDate: 1 });
      res.status(200).json({ success: true, notifications });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);


export const seenNotificationAll = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const employeeId = req?.user?._id;
      await notificationModel.updateMany({}, { $push: { seen: employeeId } });
      res.status(200).json({
        success: true,
        message: "All notifications have been marked as seen",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

