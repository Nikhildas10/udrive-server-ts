import mongoose, { Schema, Document } from "mongoose";
import { IBooking } from "./booking.model";

export interface ICustomer extends Document {
  name: string;
  contactNumber: number;
  abroadNumber: number;
  nativeNumber: number;
  email: string;
  passportNumber: string;
  pincode: number;
  state: string;
  address: string;
  locality: string;
  cityOrDistrict: string;
  bookings: IBooking[];
  isDeleted: boolean;
  customerImage: object;
  passportImage: object;
  location: string;
}

const customerSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: Number,
    required: true,
    message: "Contact number should contain minimum 10 digits.",
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
    // required: true,
  },
  pincode: {
    type: Number,
    // required: true,
  },
  state: {
    type: String,
    required: true,
  },
  address: {
    type: String,
    // required: true,
  },
  locality: {
    type: String,
    required: true,
  },
  customerImage: {
    public_id: String,
    url: String,
  },
  passportImage: [
    {
      public_id: String,
      url: String,
      filetype: String,
    },
  ],
  location: {
    type: String,
  },
  cityOrDistrict: {
    type: String,
    required: true,
  },
  bookings: [
    {
      type: Object,
    },
  ],
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

const customerModel = mongoose.model<ICustomer>("Customer", customerSchema);

export default customerModel;
