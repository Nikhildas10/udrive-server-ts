import express from "express";
import {
  socialAuth,
  updateProfilePicture,
} from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { blockEmployee, createEmployee, deleteEmployee, deleteMultipleEmployees, editEmployee, forgotPassword, getAllEmployeesInfo, getSingleEmployeeInfo, getUserInfo, loginEmployee, logoutEmployee, resetPassword, updateAcessToken, updatePassword } from "../controllers/employee.controller";
const employeeRouter = express.Router();
employeeRouter.post("/create", createEmployee);
employeeRouter.get("/get-all-employee", getAllEmployeesInfo);
employeeRouter.get("/get-single-employee/:id", getSingleEmployeeInfo);
employeeRouter.put("/edit/:id",isAuthenticated,authorizeRoles("admin","superAdmin","user"), editEmployee);
employeeRouter.put("/update-pass/:id",isAuthenticated,authorizeRoles("admin","superAdmin","user"), updatePassword);
employeeRouter.delete("/delete/:id",isAuthenticated,authorizeRoles("admin","superAdmin","user"), deleteEmployee);
employeeRouter.post("/logout", isAuthenticated,authorizeRoles("admin","superAdmin","user"), logoutEmployee);
employeeRouter.put("/block/:id", isAuthenticated,authorizeRoles("admin","superAdmin","user"), blockEmployee);
employeeRouter.post("/login", loginEmployee);
employeeRouter.get("/refresh-employee", updateAcessToken);
employeeRouter.get("/me", isAuthenticated, getUserInfo);
employeeRouter.delete("/multiple-delete", isAuthenticated, deleteMultipleEmployees);
employeeRouter.post("/forgot-password",forgotPassword);
employeeRouter.post("/reset-password",resetPassword);




// employeeRouter.post("/activate-user", activateUser);
// employeeRouter.get("/logout", isAuthenticated,authorizeRoles("admin","superAdmin","user"), logoutUser);
// employeeRouter.get("/refresh", updateAcessToken);
// employeeRouter.get("/me", isAuthenticated,getUserInfo);
// employeeRouter.put("/update-user-info", isAuthenticated,updateUserInfo);
employeeRouter.put("/update-password", isAuthenticated,updatePassword);
employeeRouter.put("/update-user-avatar", isAuthenticated,updateProfilePicture);
employeeRouter.post('/socialauth',socialAuth)
export default employeeRouter;
