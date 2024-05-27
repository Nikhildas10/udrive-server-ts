import express from "express";
import { isAuthenticated } from "../middleware/auth";

import upload from "../middleware/multer";
import multipleUpload from "../middleware/multer";
import { addCars, addServiceHistory, carsOnYard, deleteCar, deleteMultipleCars, deleteServiceHistory, editCar, getAllCar, getCarTotalRevenue, getInsuaranceDue, getInsuaranceOverDue, getInsuranceDue, getMostBookedCars, getPollutionDue, getPollutionOverDue, getServiceDueCars, getServiceOverDueCars, getSingleCar, lastInsuranceKm, resetServiceKm, runningCars } from "../controllers/car.controller";
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
carRouter.put("/last-service-kilometre/:id", isAuthenticated,lastInsuranceKm);
carRouter.put("/reset-service-kilometre/:id", isAuthenticated,resetServiceKm);
carRouter.get("/get-service-due", isAuthenticated,getServiceDueCars);
carRouter.get("/get-insurance-due", isAuthenticated,getInsuranceDue);
carRouter.get("/get-service-overdue", isAuthenticated,getServiceOverDueCars);
carRouter.get("/get-insurance-overdue", isAuthenticated,getInsuaranceOverDue);
carRouter.get("/get-pollution-overdue", isAuthenticated,getPollutionOverDue);
carRouter.get("/get-pollution-notification", isAuthenticated,getPollutionDue);
carRouter.put("/add-service-details/:id", isAuthenticated,addServiceHistory);
carRouter.delete("/delete-service-details/:carId/:serviceHistoryId", isAuthenticated,deleteServiceHistory);

export default carRouter; 
