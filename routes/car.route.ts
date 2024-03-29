import express from "express";
import { isAuthenticated } from "../middleware/auth";
import {
  addCars,
  deleteCars,
  getCars,
  updateCars,
} from "../controllers/car.controller";
import { upload } from "../middleware/multer";


const carRouter = express.Router();

carRouter.post("/create-car", isAuthenticated, upload.array("files",3), addCars);
carRouter.put("/update-car", isAuthenticated, updateCars);
carRouter.delete("/delete-car/:id", isAuthenticated, deleteCars);
carRouter.get("/get-car", isAuthenticated, getCars);
// carRouter.get("/get-single-car/:id",isAuthenticated,getcar)

export default carRouter;
