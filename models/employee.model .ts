require("dotenv").config();

import mongoose, { Document, Model, Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { IBooking } from "./booking.model";
const emailRegexPattern: RegExp =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface IEmployee extends Document {
  name: string;
  userName: string;
  email: string;
  password: string;
  role: string;
  isBlocked: Boolean;
  isVerified: Boolean;
  access: Array<{ title: string; value: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  signAccessToken: () => string;
  signRefreshToken: () => string;
  bookings: IBooking[];
  isDeleted: boolean;
  employeeImage: object;
}

const employeeSchema: Schema<IEmployee> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    userName: {
      type: String,
      required: [true, "Please enter your user-name"],
    },
    email: {
      type: String,
      required: [true, "Please enter your email address"],
      validate: {
        validator: function (value: string) {
          return emailRegexPattern.test(value);
        },
      },
      unique: true,
    },
    password: {
      type: String,
      select: false,
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      default: "admin",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    employeeImage: {
      public_id: String,
      url: String,
    },
    access: {
      type: [
        {
          title: {
            type: String,
            required: [true, "Please enter the title of the access"],
          },
          value: {
            type: String,
            required: [true, "Please enter the value of the access"],
          },
        },
      ],
      validate: [
        arrayMinLengthValidator,
        "Access list must have at least one item",
      ],
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
  },

  { timestamps: true }
);

function arrayMinLengthValidator(val: any[]) {
  return val && val.length > 0;
}

// hash_passwword

employeeSchema.pre<IEmployee>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//sign access token
employeeSchema.methods.signAccessToken = function () {
  //this.id is logged in user id  and acesstoken passed to jwt
  return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "");
};

//sign refresh token
employeeSchema.methods.signRefreshToken = function () {
  //this.id is logged in user id  and acesstoken passed to jwt
  return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "");
};

//compare password
//here this.password is the database password
employeeSchema.methods.comparePassword = async function (
  enteredPassword: string
) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const employeeModel: Model<IEmployee> = mongoose.model(
  "employee",
  employeeSchema
);

export default employeeModel;
