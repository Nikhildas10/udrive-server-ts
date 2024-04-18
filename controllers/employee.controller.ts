require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import nodeMailer, { Transporter } from "nodemailer";
import userModel, { IUser } from "../models/user.model";
import ErrorHandler from "../utils/ErrorHandler";
import { catchAsyncErrors } from "../middleware/catchAsyncErrors";
import jwt, { JwtPayload } from "jsonwebtoken";
import {
  accessTokenOptions,
  refreshTokenOptions,
  sendToken,
} from "../utils/jwt";
import ejs from "ejs";
import { redis } from "../utils/redis";
import { getUserById } from "../services/user.services";
import cloudinary from "cloudinary";
import employeeModel from "../models/employee.model ";
import { sendMail } from "../utils/sendMail";
import path from "path";
interface IRegistrationBody {
  name: string;
  email: string;
  password: string;
  userName: string;
  access: [];
}
export const registrationUser = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, access, userName } = req.body;
      const isEmailExist = await userModel.findOne({ email });
      if (isEmailExist) {
        return next(new ErrorHandler("Email already exist", 400));
      }

      const user: IRegistrationBody = {
        name,
        email,
        password,
        access,
        userName,
      };
      try {
        const user = await userModel.create({ name, email, password });
        res.status(201).json({ success: true });
      } catch (error: any) {
        return next(new ErrorHandler(error.message, 400));
      }
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IActivationToken {
  token: string;
  activationCode: string;
}

export const createActivationToken = (
  user: IRegistrationBody
): IActivationToken => {
  const activationCode = Math.floor(1000 + Math.random() * 9000).toString();
  const token = jwt.sign(
    { user, activationCode },
    process.env.ACTIVATION_SECRET,
    { expiresIn: "5m" }
  );
  return { token, activationCode };
};

interface IActivationRequest {
  activation_token: string;
  activation_code: string;
}

export const createEmployee = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, access, userName } = req.body;
      const existingUser = await employeeModel.findOne({ email });
      if (existingUser) {
        return next(new ErrorHandler("EMAIL already exist", 400));
      }
      const data = await employeeModel.create({
        name,
        email,
        password,
        access,
        userName,
      });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IEmployeeLogin {
  email: string;
  password: string;
}

export const loginEmployee = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as IEmployeeLogin;
      if (!email || !password) {
        console.log("first");
        return next(new ErrorHandler("please enter email and password", 400));
      }
      const user = await employeeModel.findOne({ email }).select("+password");
      if (!user) {
        return next(new ErrorHandler("Invalid email and password", 400));
      }
      if (user.isDeleted) {
        return next(new ErrorHandler("Invalid email and password", 400));
      }
      const isPasswordMatch = await user.comparePassword(password);
      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid email and password", 400));
      }
      if (user.isBlocked) {
        return next(new ErrorHandler("Your account is blocked", 400));
      }
      sendToken(user, 200, res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getAllEmployeesInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await employeeModel.find({ isDeleted: false });
      res.status(201).json({ success: true, data });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
export const getSingleEmployeeInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await employeeModel.findOne({
        _id: req.params.id,
        isDeleted: false,
      });
      if (!data) {
        return next(new ErrorHandler("Employee not found", 404));
      }
      res.status(200).json({ success: true, data });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IblockEmployee {
  name?: string;
  email?: string;
  password: string;
  access: [];
  userName: string;
}

export const blockEmployee = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { isBlocked } = req.body;
      req.body as IblockEmployee;
      const userId = req.params?.id;
      console.log(userId);
      const user = await employeeModel.findById(userId);
      console.log("user", user);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }
      user.isBlocked = isBlocked;
      await user.save();
      res.status(201).json({
        success: true,
        user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IupdateEmployee {
  name?: string;
  email?: string;
  password: string;
  access: [];
  userName: string;
}
export const editEmployee = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email, password, access, userName } =
        req.body as IupdateEmployee;
      const userId = req.params?.id;
      console.log(userId);
      const user = await employeeModel.findById(userId);
      console.log("user", user);
      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      if (email !== user.email) {
        const isEmailExist = await employeeModel.findOne({ email });
        if (isEmailExist) {
          return next(new ErrorHandler("Email already exists", 400));
        }
      }

      if (email) {
        user.email = email;
      }
      if (name) {
        user.name = name;
      }
      if (password) {
        user.password = password;
      }
      if (access) {
        user.access = access;
      }
      if (userName) {
        user.userName = userName;
      }
      // Save the updated user
      await user.save();

      res.status(201).json({
        success: true,
        user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const deleteEmployee = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.params?.id;
      console.log(userId);
      const user = await employeeModel.findById(userId);
      if (!user) {
        return next(new ErrorHandler("Employee not found", 404));
      }
      const deletedUser = await employeeModel.findByIdAndUpdate(
        userId,
        { isDeleted: true },
        { new: true }
      );
      if (!deletedUser) {
        return next(new ErrorHandler("Failed to delete employee", 500));
      }
      res.status(201).json({
        success: true,
        message: "Employee deleted",
        data: deletedUser,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const deleteMultipleEmployees = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { employeeIds } = req.body;
      if (employeeIds.includes(req.user?.id)) {
        return next(new ErrorHandler("self deletion not allowed", 400));
      }

      if (!employeeIds) {
        return next(new ErrorHandler("Invalid employee ID provided", 400));
      }
      const superAdminEmployee = await employeeModel.find({
        _id: { $in: employeeIds },
        role: "superAdmin",
      });
      if (superAdminEmployee.length > 0) {
        return next(new ErrorHandler("Super admin cannot be deleted", 400));
      }
      const deletedEmployees = await employeeModel.updateMany(
        { _id: { $in: employeeIds } },
        { isDeleted: true }
      );

      res.status(200).json({
        success: true,
        message: "Employees deleted successfully",
        data: deletedEmployees,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const logoutEmployee = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.cookie("access_token", "", { maxAge: 1 });
      res.cookie("refresh_token", "", { maxAge: 1 });
      res.status(200).json({
        success: true,
        message: "Logged out successfully",
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const updateAcessToken = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refresh_token = req.cookies.refresh_token;
      const decoded = jwt.verify(
        refresh_token,
        process.env.REFRESH_TOKEN as string
      ) as JwtPayload;
      const message = "could not refresh token";
      if (!decoded) {
        return next(new ErrorHandler(message, 400));
      }
      const session = await redis.get(decoded.id as string);
      if (!session) {
        return next(new ErrorHandler(message, 400));
      }
      const user = JSON.parse(session);

      const accessToken = jwt.sign(
        { id: user._id },
        process.env.ACCESS_TOKEN as string,
        { expiresIn: "1d" }
      );
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.REFRESH_TOKEN as string,
        { expiresIn: "7d" }
      );

      req.user = user;

      res.cookie("access_token", accessToken, accessTokenOptions);
      res.cookie("refresh_token", refreshToken, refreshTokenOptions);

      res.status(200).json({
        status: "success",
        accessToken,
        user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const getUserInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?._id;
      getUserById(userId, res);
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
interface ISocialAuthBody {
  email: string;
  name: string;
  avatar: string;
}

//updateUserInfo

interface IUpdateUserInfo {
  name?: string;
  email?: string;
}
export const updateUserInfo = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, email } = req.body as IUpdateUserInfo;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);
      if (email && user) {
        const isEmailExist = await userModel.findOne({ email });
        if (isEmailExist) {
          return next(new ErrorHandler("Email already exist", 400));
        }
        user.email = email;
      }
      if (name && user) {
        user.name = name;
      }
      res.status(201).json({
        success: true,
        user,
      });
      await user?.save();
      await redis.set(userId, JSON.stringify(user));
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IForgotPasswordRequest {
  email: string;
}

export const forgotPassword = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const user = await employeeModel.findOne({ email });

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      const resetToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET_KEY,
        {
          expiresIn: "1h",
        }
      );

      const resetLink = `http://localhost:3030/reset-password/${resetToken}`;

      const data = {
        user: { name: user.name },
        resetLink,
      };

      await sendMail({
        email: user.email,
        subject: "Reset Your Password",
        template: "reset-password.ejs",
        data,
      });

      res.status(200).json({
        success: true,
        message: `Password reset link has been sent to ${user.email}`,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

export const resetPassword = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { resetToken } = req.body;
      const { newPassword } = req.body;
      if (!resetToken || !newPassword) {
        return next(
          new ErrorHandler("Reset token and new password are required", 400)
        );
      }

      const decoded: any = jwt.verify(resetToken, process.env.JWT_SECRET_KEY);
      if (!decoded.userId) {
        return next(new ErrorHandler("Invalid reset token", 400));
      }

      const userId = decoded.userId;
      const user = await employeeModel.findById(userId);

      if (!user) {
        return next(new ErrorHandler("User not found", 404));
      }

      user.password = newPassword;
      await user.save();

      res.status(200).json({
        success: true,
        message: "Password has been reset successfully",
      });
    } catch (error: any) {
      return next(new ErrorHandler(error.message, 400));
    }
  }
);

export const updatePassword = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await employeeModel
        .findById(req.user?._id)
        .select("+password");

      if (user?.password === undefined) {
        return next(new ErrorHandler("Invalid ", 400));
      }

      const isPasswordMatch = await user?.comparePassword(oldPassword);

      if (!isPasswordMatch) {
        return next(new ErrorHandler("Invalid old password", 400));
      }
      user.password = newPassword;
      await user.save();
      await redis.set(req.user?._id, JSON.stringify(user));
      res.status(201).json({
        success: true,
        user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);

interface IUpdateProfilePicture {
  avatar: {
    url: string;
  };
}

export const updateProfilePicture = catchAsyncErrors(
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { avatar } = req.body;
      const userId = req.user?._id;
      const user = await userModel.findById(userId);
      if (avatar && user) {
        if (user?.avatar?.public_id) {
          await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);
          const mycloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
          };
        } else {
          const mycloud = await cloudinary.v2.uploader.upload(avatar, {
            folder: "avatars",
            width: 150,
          });
          user.avatar = {
            public_id: mycloud.public_id,
            url: mycloud.secure_url,
          };
        }
      }

      await user?.save();
      await redis.set(userId, JSON.stringify(user));
      res.status(200).json({
        success: true,
        user,
      });
    } catch (err: any) {
      return next(new ErrorHandler(err.message, 400));
    }
  }
);
