import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  contactNumber: number;
  abroadNumber: number;
  nativeNumber: number;
  email: string;
  passportNumber: string;
  pincode: number;
  status: string;
  address: string;
  locality: string;
  cityOrDistrict: string;
  bookings: mongoose.Types.ObjectId[];
}

const customerSchema: Schema = new Schema({
  name: {
    type: String,
  },
  contactNumber: {
    type: Number,
  },
  abroadNumber: {
    type: Number,
  },
  nativeNumber: {
    type: Number,
  },
  email: {
    type: String,
  },
  passportNumber: {
    type: String,
  },
  pincode: {
    type: Number,
  },
  status: {
    type: String,
  },
  address: {
    type: String,
  },
  locality: {
    type: String,
  },
  cityOrDistrict: {
    type: String,
  },
  bookings: [
    {
      type: mongoose.Types.ObjectId,
      ref: "Booking",
    },
  ],
});

const customerModel = mongoose.model<ICustomer>("Customer", customerSchema);

export default customerModel;
