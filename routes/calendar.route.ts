import express from "express";
import { createEvent, deleteEvent, editEvent, getEvent, getSingleEvent } from "../controllers/calendar.controller";
import { isAuthenticated } from "../middleware/auth";

const calendarRouter=express.Router()

calendarRouter.post("/create",isAuthenticated,createEvent)
calendarRouter.put("/edit/:id",isAuthenticated,editEvent)
calendarRouter.get("/get-all-events",isAuthenticated,getEvent)
calendarRouter.get("/get-single-event/:id",isAuthenticated,getSingleEvent)
calendarRouter.delete("/delete/:id",isAuthenticated,deleteEvent)

export default calendarRouter;
