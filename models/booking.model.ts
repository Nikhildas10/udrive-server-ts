import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  fromDate: Date;
  toDate: Date;
  pickupPoint: string;
  dropPoint: string;
  carSelected: Object;
  customerSelected: Object;
  employeeSelected: Object;
  subTotals: object;
  total: number;
  discount: number;
  tax: number;
  invoiceDetails: Array;
}

const bookingSchema: Schema = new Schema({
  fromDate: {
    type: Date,
  },
  toDate: {
    type: Date,
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
  employeeSelected: {
    type: Object,
  },
  subTotals: {
    type: Array,
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
});

const BookingModel = mongoose.model<IBooking>("Booking", bookingSchema);

export default BookingModel;
