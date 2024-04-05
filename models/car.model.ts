import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICar extends Document {
  name: string;
  manufacturingCompany: string;
  yearOfManufacturing: number;
  fuelType: string;
  transmission: string;
  insurance: Date;
  lastService: Date;
  serviceInterval: string;
  rcBook?: string;
  insurancePolicy?: string;
  pollutionCertificate?: string;
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
  rcBook: String,
  insurancePolicy: String,
  pollutionCertificate: String,
});

const CarModel: Model<ICar> = mongoose.model<ICar>("Car", carSchema);

export default CarModel;
