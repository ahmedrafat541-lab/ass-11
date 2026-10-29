// ده ملف الاتصال بالداتا بيز

import {DB_URI} from "../../config/config.service.js"

import mongoose from "mongoose";


export default async function connectionDB(){
    await  mongoose.connect(DB_URI , {serverSelectionTimeoutMS:5000})
    .then(()=>{console.log("DB connected successfully")})
    .catch((error)=>{console.log(error , "DB connecting failed")})
}    