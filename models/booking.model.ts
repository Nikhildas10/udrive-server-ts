import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  fromDate: Date;
  toDate: Date;
  pickupPoint: string;
  dropPoint: string;
  carSelected: Object;
  customerSelected: Object;
  subTotals: Array;
  total: number;
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
  subTotals: {
    type: Array,
  },
  total: {
    type: Number,
  },
  invoiceDetails: {
    type: Array,
  },
});

const BookingModel = mongoose.model<IBooking>("Booking", bookingSchema);

export default BookingModel;
