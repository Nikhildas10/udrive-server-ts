import express from "express";
import {
  activateUser,
  getUserInfo,
  loginUser,
  logoutUser,
  registrationUser,
  socialAuth,
  updateAcessToken,
  updatePassword,
  updateProfilePicture,
  updateUserInfo,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const userRouter = express.Router();
userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated,authorizeRoles("admin","superAdmin","user"), logoutUser);
userRouter.get("/refresh", updateAcessToken);
userRouter.get("/me", isAuthenticated,getUserInfo);
userRouter.put("/update-user-info", isAuthenticated,updateUserInfo);
userRouter.put("/update-password", isAuthenticated,updatePassword);
userRouter.put("/update-user-avatar", isAuthenticated,updateProfilePicture);
userRouter.post('/socialauth',socialAuth)
export default userRouter;
