import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICalendar extends Document{
    title:string,
    startDate:string,
    endDate:string,
    isDeleted:boolean
}

const calendarSchema=new Schema<ICalendar>({
    title:{
        type:String,
        required:true
    },
    startDate:{
        type:String,
        required:true
    },
    endDate:{
        type:String,
        required:true
    },
    isDeleted:{
        type:Boolean,
        default:false
    },

})

export const calendarModel:Model<ICalendar>=mongoose.model<ICalendar>("calendar",calendarSchema)