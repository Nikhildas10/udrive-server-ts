import express from "express";
import {  getDashboardData, getMessage } from "../controllers/dashboard.controller";

const dashboardRouter = express.Router();

dashboardRouter.get("/get-piechart-data",getDashboardData)
dashboardRouter.get("/get-message",getMessage)

export default dashboardRouter;
