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
  pollution: Date;
  serviceKilometre: number;
  serviceInterval: number;
  totalKmCovered: number;
  vehicleNumber: string;
  rcBook?: object;
  insurancePolicy?: object;
  pollutionCertificate?: object;
  bookings: IBooking[];
  isDeleted: boolean;
  carImage: object;
  serviceHistory: Array;
}

const carSchema = new Schema<ICar>({
  name: {
    type: String,
    required: true,
  },
  manufacturingCompany: {
    type: String,
  },
  yearOfManufacturing: {
    type: Number,
  },
  serviceKilometre: {
    type: Number,
    default:0
  },
  fuelType: {
    type: String,
  },
  transmission: {
    type: String,
  },
  pollution: {
    type: Date,
  },
  insurance: {
    type: Date,
  },
  lastService: {
    type: Date,
  },
  serviceInterval: {
    type: Number,
  },
  totalKmCovered: {
    type: Number,
    default: 0,
  },

  vehicleNumber: {
    type: String,
  },
  serviceHistory: {
    type: Array,
  },
  rcBook: {
    public_id: String,
    url: String,
    filetype: String,
  },
  insurancePolicy: {
    public_id: String,
    url: String,
    filetype: String,
  },
  pollutionCertificate: {
    public_id: String,
    url: String,
    filetype: String,
  },
  carImage: {
    public_id: String,
    url: String,
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

const CarModel: Model<ICar> = mongoose.model<ICar>("Car", carSchema);

export default CarModel;
