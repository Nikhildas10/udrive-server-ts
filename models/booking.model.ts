import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  fromDate: string;
  toDate: string;
  pickupPoint: string;
  dropPoint: string;
  carSelected: object;
  customerSelected: object;
  subTotals: number;
  total: number;
  discount: number;
  tax: number;
  invoiceDetails: Array;
}

const bookingSchema: Schema = new Schema(
  {
    fromDate: {
      type: String,
    },
    toDate: {
      type: String,
    },
    pickupPoint: {
      type: String,
    },
    dropPoint: {
      type: String,
    },
    carSelected: {
      type: Object,
    },
    customerSelected: {
      type: Object,
    },
    subTotals: {
      type: Number,
    },
    total: {
      type: Number,
    },
    discount: {
      type: Number,
    },
    tax: {
      type: Number,
    },
    invoiceDetails: [
      {
        type: Object,
      },
    ],
  },
  { timestamps: true }
);

const BookingModel = mongoose.model<IBooking>("Booking", bookingSchema);

export default BookingModel;
