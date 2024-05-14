import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  booking:object;
  employee:object;
  customer:object;
  car:Object;
  image:Object;
  type:string;
  title:string;
  currentDate:Date
  seen: Array;
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
  image: {
    type: Object,
  },
  currentDate: {
    type: Date,
  },
  type: {
    type: String,
  },
  title: {
    type: String,
  },
  seen: {
    type: Array,
  },
});

export const notificationModel: Model<INotification> = mongoose.model<INotification>(
  "notifications",
  notificationSchema
);
