import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  booking:object;
  employee:object;
  customer:object;
  car:Object;
  currentDate:Date
  seen: boolean;
}

const notificationSchema = new Schema<INotification>({
  booking: {
    type: Object,
  },
  employee: {
    type: Object,
  },
  customer: {
    type: Object,
  },
  car: {
    type: Object,
  },
  currentDate: {
    type: Date,
  },
  seen: {
    type: Boolean,
    default: false,
  },
});

export const notificationModel: Model<INotification> = mongoose.model<INotification>(
  "notifications",
  notificationSchema
);
