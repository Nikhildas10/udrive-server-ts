import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  fromDate: string;
  toDate: string;
  pickupPoint: string;
  dropPoint: string;
  carSelected: object;
  customerSelected: object;
  driver: object;
  subTotals: number;
  total: number;
  discount: number;
  kilometreCovered: number;
  tax: number;
  status: string;
  invoiceDetails: Array;
  invoiceId: number;
  isDeleted: boolean;
  isKilometreUpdated: boolean;
  payment: string;
  advancePaid: boolean;
  advanceAmount: number;
  invoiceGenerated: boolean;
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
    employee: {
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
      default: "active",
    },
    tax: {
      type: Number,
    },
    invoiceId: {
      type: Number,
    },
    kilometreCovered: {
      type: Number,
      default: 0,
    },
    invoiceDetails: [
      {
        type: Object,
      },
    ],
    driver: 
      {
        type: Object,
      },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    isKilometreUpdated: {
      type: Boolean,
      default: false,
    },
    advancePaid: {
      type: Boolean,
      default: false,
    },
    payment: {
      type: String,
      default: "paid",
    },
    advanceAmount: {
      type: Number,
      default: 0,
    },
    invoiceGenerated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);
const BookingModel = mongoose.model<IBooking>("Booking", bookingSchema);

export default BookingModel;
