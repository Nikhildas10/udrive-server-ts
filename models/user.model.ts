require("dotenv").config();

import mongoose, { Document, Model, Schema, model } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
const emailRegexPattern: RegExp =
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  avatar: {
    public_id: string;
    url: string;
  };
  role: string;
  isVerified: Boolean;
  courses: Array<{ courseId: string }>;
  comparePassword: (password: string) => Promise<boolean>;
  signAccessToken: () => string;
  signRefreshToken: () => string;
}

const userSchema: Schema<IUser> = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    email: {
      type: String,
      required: [true, "please enter your email adress"],
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
    avatar: {
      public_id: String,
      url: String,
    },
    role: {
      type: String,
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    courses: [
      {
        courseId: String,
      },
    ],
  },
  { timestamps: true }
);

// hash_passwword

userSchema.pre<IUser>("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

//sign access token
userSchema.methods.signAccessToken=function(){
  //this.id is logged in user id  and acesstoken passed to jwt
  return jwt.sign({id:this._id},process.env.ACCESS_TOKEN || '')
}

//sign refresh token
userSchema.methods.signRefreshToken=function(){
  //this.id is logged in user id  and acesstoken passed to jwt
  return jwt.sign({id:this._id},process.env.REFRESH_TOKEN || '')
}

//compare password
//here this.password is the database password
userSchema.methods.comparePassword = async function (enteredPassword: string) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const userModel: Model<IUser> =mongoose.models.User ||  mongoose.model("user", userSchema);

export default userModel;
