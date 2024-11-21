require("dotenv").config();
import { Response } from "express";
import { IUser } from "../models/user.model";
import { redis } from "./redis";
import { IEmployee } from "../models/employee.model ";

interface ITokenOptions {
  expires: Date;
  maxAge: number;
  httpOnly: boolean;
  sameSite: "none" | "strict" | "none" | undefined;
  secure?: boolean;
}

export const accessTokenExpires = parseInt(
  process.env.ACCESS_TOKEN_EXPIRE || "300",
  10
);
export const refreshTokenExpires = parseInt(
  process.env.REFRESH_TOKEN_EXPIRE || "1200",
  10
);
//5 days
export const accessTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + accessTokenExpires * 60 * 60 * 1000),
  maxAge: accessTokenExpires * 60 * 60 * 1000,
  httpOnly: true,
  sameSite: "none",
  secure:true
};
//3 days
export const refreshTokenOptions: ITokenOptions = {
  expires: new Date(Date.now() + refreshTokenExpires * 24 * 60 * 60 * 1000),
  maxAge: refreshTokenExpires * 24 * 60 * 60 * 1000,
  httpOnly: true,
  /* none means cookie can be used 
   for navigation or redirection but information
   cannot be accessed without the consent of the owner */
  sameSite: "none",
  secure:true
};
/**/



export const sendToken = (user: IEmployee, statusCode: number, res: Response) => {
  const accessToken = user.signAccessToken();
  const refreshToken = user.signRefreshToken();
  // upload session to redis to maintain cache (user login session)
  redis.set(user._id, JSON.stringify(user));
  //parse env if it gets undefined OR on fallback

  /*only set the secure to true in production not on local!!*/
  if (process.env.NODE_ENV === "production") {
    accessTokenOptions.secure = true;
  }
  res.cookie("access_token", accessToken, accessTokenOptions);
  res.cookie("refresh_token", refreshToken, refreshTokenOptions);
  res.status(statusCode).json({ success: true, user, accessToken });
};
