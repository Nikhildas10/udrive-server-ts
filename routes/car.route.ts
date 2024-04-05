import express from "express";
import { isAuthenticated } from "../middleware/auth";

import upload from "../middleware/multer";
import multipleUpload from "../middleware/multer";
import { addCars, deleteCar, editCar, getAllCar, getSingleCar } from "../controllers/car.controller";

const carRouter = express.Router();

carRouter.post("/create",isAuthenticated,addCars);
carRouter.put("/edit/:id", isAuthenticated,multipleUpload.array("files"), editCar);
carRouter.delete("/delete/:id", isAuthenticated, deleteCar);
carRouter.get("/get-all-cars", isAuthenticated, getAllCar);
carRouter.get("/get/:id", isAuthenticated, getSingleCar);

export default carRouter;
