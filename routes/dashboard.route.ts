import express from "express";
import {  getDashboardData } from "../controllers/dashboard.controller";

const dashboardRouter = express.Router();

dashboardRouter.get("/get-piechart-data",getDashboardData)

export default dashboardRouter;
