import { Request, Response, NextFunction } from "express";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import { notificationModel } from "../models/notification.model";

export const seenNotification = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    await notificationModel.findByIdAndUpdate(
      id,
      { seen: true },
      { new: true }
    );
    res
      .status(200)
      .json({ success: true, message: "notification has been seen" });
  }
);

export const getNotification = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const notification = await notificationModel.find({ seen: false });
    res.status(200).json({ success: true, notification });
  }
);

export const seenNotificationAll = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    await notificationModel.updateMany({}, { seen: true });
    res.status(200).json({
      success: true,
      message: "All notifications have been marked as seen",
    });
  }
);
