import { Request, Response, NextFunction } from "express";
import { catchAsyncErrors } from "./catchAsyncErrors";
import ErrorHandler from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { redis } from "../utils/redis";
export const isAuthenticated = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    const acesstoken = req.cookies.access_token as string;
    console.log(acesstoken);
    if (!acesstoken) {
      return next(
        new ErrorHandler("please login to access these resource", 400)
      );
    }
    const decoded = jwt.verify(
      acesstoken,
      process.env.ACCESS_TOKEN as string
    ) as JwtPayload;
    if (!decoded) {
      return next(new ErrorHandler("access token invalid", 400));
    }
    const user = await redis.get(decoded.id);
    if (!user) {
      return next(new ErrorHandler("user not found", 400));
    }
    req.user = JSON.parse(user);
    next();
  }
);

//checks with db weather role passed is included in db role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.user?.role || "")) {
      return next(
        new ErrorHandler(
          `ROLE ${
            req.user?.role
          } is not allowed to access this resource. Only ${roles
            .map((role) => role)
            .join(", ")} can access these`,
          403
        )
      );
    }
    // Continue processing if the user has the required role
    next();
  };
};
