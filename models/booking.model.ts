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
  status:string;
  invoiceDetails: Array;
  invoiceId:number;
  isDeleted: boolean;
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
    status: {
      type: String,
    },
    tax: {
      type: Number,
    },
    invoiceId: {
      type: Number,
    },
    invoiceDetails: [
      {
        type: Object,
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const BookingModel = mongoose.model<IBooking>("Booking", bookingSchema);

export default BookingModel;
