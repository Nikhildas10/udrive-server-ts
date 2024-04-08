import mongoose, { Schema, Document, Model } from "mongoose";
import { IBooking } from "./booking.model";

export interface ICar extends Document {
  name: string;
  manufacturingCompany: string;
  yearOfManufacturing: number;
  fuelType: string;
  transmission: string;
  insurance: Date;
  lastService: Date;
  serviceInterval: string;
  rcBook?: object;
  insurancePolicy?: object;
  pollutionCertificate?: object;
  bookings:IBooking[]
}

const carSchema = new Schema<ICar>({
  name: {
    type: String,
    required: true,
  },
  manufacturingCompany: {
    type: String,
    required: true,
  },
  yearOfManufacturing: {
    type: Number,
  },
  fuelType: {
    type: String,
  },
  transmission: {
    type: String,
  },
  insurance: {
    type: Date,
  },
  lastService: {
    type: Date,
  },
  serviceInterval: {
    type: String,
  },
  rcBook: {
    public_id: String,
    url: String,
  },
  insurancePolicy: {
    public_id: String,
    url: String,
  },
  pollutionCertificate: {
    public_id: String,
    url: String,
  },
  bookings: [
    {
      type: Object,
    },
  ],
});

const CarModel: Model<ICar> = mongoose.model<ICar>("Car", carSchema);

export default CarModel;
