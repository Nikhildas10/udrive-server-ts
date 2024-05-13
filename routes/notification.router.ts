import express from "express";
import { getNotification, seenNotification, seenNotificationAll } from "../controllers/notification.controller";
import { isAuthenticated } from "../middleware/auth";

const notificationRouter=express.Router()

notificationRouter.get("/get-notification",isAuthenticated,getNotification)
notificationRouter.put("/seen-one/:id",isAuthenticated,seenNotification)
notificationRouter.put("/seen-all",isAuthenticated,seenNotificationAll)

export default notificationRouter