import { Request } from "express";
import { IUser } from "../models/user.model";
import { IEmployee } from "../models/employee.model ";

declare global{
    namespace Express {
        interface Request{
            user?:IEmployee
        }
    }
}