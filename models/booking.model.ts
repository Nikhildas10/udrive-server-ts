import mongoose, { Schema, Document } from "mongoose";

export interface IBooking extends Document {
  customerId: mongoose.Types.ObjectId;
  carId: mongoose.Types.ObjectId;
  bookedTime: Date;
  totalHours: number;
  totalAmount: number;
  transactionId: string;
}

const bookingSchema: Schema = new Schema({
  customerId: {
    type: mongoose.Types.ObjectId,
    ref: "Customer",
  },
  carId: {
    type: mongoose.Types.ObjectId,
    ref: "Car",
  },
  bookedTime: {
    type: Date,
  },
  totalHours: {
    type: Number,
  },
  totalAmount: {
    type: Number,
  },
  transactionId: {
    type: String,
  },
});

const BookingModel = mongoose.model<IBooking>("Booking", bookingSchema);

export default BookingModel;
