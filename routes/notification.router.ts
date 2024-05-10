import express from "express";
import { getNotification, seenNotification, seenNotificationAll } from "../controllers/notification.controller";

const notificationRouter=express.Router()

notificationRouter.get("/get-notification",getNotification)
notificationRouter.put("/seen-one/:id",seenNotification)
notificationRouter.put("/seen-all",seenNotificationAll)

export default notificationRouter