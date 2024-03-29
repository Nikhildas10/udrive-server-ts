import mongoose, { Schema, Document } from "mongoose";

export interface ICustomer extends Document {
  name: string;
  contactNumber: string;
  abroadNumber: string;
  nativeNumber: string;
  email: string;
  passportNumber: string;
  pincode: string;
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
    type: String,
  },
  abroadNumber: {
    type: String,
  },
  nativeNumber: {
    type: String,
  },
  email: {
    type: String,
  },
  passportNumber: {
    type: String,
  },
  pincode: {
    type: String,
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
