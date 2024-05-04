import express from "express";
import { isAuthenticated } from "../middleware/auth";

import upload from "../middleware/multer";
import multipleUpload from "../middleware/multer";
import { addCars, carsOnYard, deleteCar, deleteMultipleCars, editCar, getAllCar, getBookedCars, getCarTotalRevenue, getMostBookedCars, getNonBookedCars, getSingleCar, runningCars } from "../controllers/car.controller";
import { getDashboardData } from "../controllers/dashboard.controller";

const carRouter = express.Router();

carRouter.post("/create",isAuthenticated,addCars);
carRouter.put("/edit/:id", isAuthenticated, editCar);
carRouter.delete("/delete/:id", isAuthenticated, deleteCar);
carRouter.get("/get-all-cars", isAuthenticated, getAllCar);
// carRouter.get("/most-booked-cars", isAuthenticated, getMostBookedCars);
carRouter.get("/most-booked-cars", isAuthenticated, getDashboardData);
carRouter.delete("/multiple-delete", isAuthenticated, deleteMultipleCars);
carRouter.get("/get-running-cars", isAuthenticated, runningCars);
carRouter.get("/get-cars-on-yard", isAuthenticated, carsOnYard);
carRouter.get("/get/:id", isAuthenticated, getSingleCar);
carRouter.get("/get-total-revenue/:id", isAuthenticated, getCarTotalRevenue);

export default carRouter; 
