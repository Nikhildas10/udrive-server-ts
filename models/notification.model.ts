import mongoose, { Schema, Document, Model } from "mongoose";

export interface INotification extends Document {
  booking: object;
  employee: object;
  customer: object;
  car: object;
  image: object;
  type: string;
  title: string;
  currentDate: Date;
  seen: Array;
  carId: mongoose.Schema.Types.ObjectId;
  notificationType: string;
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
  carId: {
    type: mongoose.Schema.Types.ObjectId
  },
  notificationType: {
    type: String,
  },
});

export const notificationModel: Model<INotification> =
  mongoose.model<INotification>("notifications", notificationSchema);
