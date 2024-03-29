import mongoose from "mongoose";
require("dotenv").config();
const dbUrl: string = process.env.DB_URL || "";
export const connectDb = async () => {
  try {
    await mongoose.connect(dbUrl).then((data: any) => {
      console.log(`Database connected sucessfully`);
    });
  } catch (error: any) {
    console.log(`Error connecting database ${error.message}`);
  }
};
