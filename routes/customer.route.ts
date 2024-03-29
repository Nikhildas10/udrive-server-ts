import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  createCustomer,
  deleteCustomerById,
  getAllCustomers,
  getSingleCustomer,
  updateCustomer,
} from "../controllers/customer.controller";

const customerRouter = express.Router();

customerRouter.post("/create", isAuthenticated, createCustomer);
customerRouter.put("/edit/:id", isAuthenticated, updateCustomer);
customerRouter.get("/getall", isAuthenticated, getAllCustomers);
customerRouter.delete("/delete/:id", isAuthenticated, deleteCustomerById);
customerRouter.get("/getsingle/:id", isAuthenticated, getSingleCustomer);

export default customerRouter;
