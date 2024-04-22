import express from "express";
import { isAuthenticated } from "../middleware/auth";

import upload from "../middleware/multer";
import multipleUpload from "../middleware/multer";
import { addCars, deleteCar, deleteMultipleCars, editCar, getAllCar, getMostBookedCars, getSingleCar } from "../controllers/car.controller";

const carRouter = express.Router();

carRouter.post("/create",isAuthenticated,addCars);
carRouter.put("/edit/:id", isAuthenticated, editCar);
carRouter.delete("/delete/:id", isAuthenticated, deleteCar);
carRouter.get("/get-all-cars", isAuthenticated, getAllCar);
carRouter.get("/most-booked-cars", isAuthenticated, getMostBookedCars);
carRouter.delete("/multiple-delete", isAuthenticated, deleteMultipleCars);
carRouter.get("/get/:id", isAuthenticated, getSingleCar);

export default carRouter;
