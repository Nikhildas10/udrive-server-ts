import express from "express";
import {  getDashboardData } from "../controllers/dashboard.controller";

const dashboardRouter = express.Router();

dashboardRouter.get("/get-dashboard-data",getDashboardData)

export default dashboardRouter;
