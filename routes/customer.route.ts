import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  createCustomer,
  deleteCustomerById,
  deleteMultipleCustomer,
  getAllCustomers,
  getCustomerTotalRevenue,
  getSingleCustomer,
  updateCustomer,
} from "../controllers/customer.controller";
import { getTotalRevenue } from "../controllers/booking.controller";

const customerRouter = express.Router();

customerRouter.post("/create", isAuthenticated, createCustomer);
customerRouter.put("/edit/:id", isAuthenticated, updateCustomer);
customerRouter.get("/getall", isAuthenticated, getAllCustomers);
customerRouter.delete("/delete/:id", isAuthenticated, deleteCustomerById);
customerRouter.delete("/multiple-delete", isAuthenticated, deleteMultipleCustomer);
customerRouter.get("/getsingle/:id", isAuthenticated, getSingleCustomer);
customerRouter.get("/get-total-revenue/:id", isAuthenticated, getCustomerTotalRevenue);

export default customerRouter;
