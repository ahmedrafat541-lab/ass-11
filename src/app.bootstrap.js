
import { ALLOW_ORIGINS, PORT } from "../config/config.service.js";

import express from "express";

import connectionDB from "./DB/connectionDB.js";
import connectionRedis from "./DB/connection.redis.js";
import userRouter from "./modules/users/user.controller.js";
// بخلي السرفر يستقبل من الفرونت
import cors from "cors" ;
import { setValue } from "./DB/service/redis.service.js";
import messageRouter from "./modules/messages/message.controller.js";
import rateLimit from "express-rate-limit";
import helmet from 'helmet';





const app = express();
const port = PORT;

const limiter = rateLimit({
    windowMs:60*1000,
    limit:30,
    message:{
        success:false,
        message:"done over"
    },
    standardHeaders:true,
    legacyHeaders:false,
    handler:(req,res)=>{
        res.status(401).json({
            message:"game over tany"
        })
    }
});
app.use(limiter)

// const allowOrigins = ["http//localhost:4000",
//     "http//localhost:5000",
//     undefined
// ]
const bootstrap = async()=>{

    app.set("case sensitive routing" , true)
    app.set(" strict routing" , true)
    // بيسمح لاي موقع انو يتصل بالسرفر
    app.use(cors({origin: function (origin , callback){
        if([...ALLOW_ORIGINS , undefined].includes(origin)){
            callback(null ,  true)
        } else{
            callback(new Error("not allowed by origin"))
        }

    }}))
    // بيقرا ال body بتاع الريكوست وبيخليه جيسون ويحط الناتج في req.body
    app.use(express.json());
    app.use(helmet());
    app.get("/" , (req , res  )=>{
res.status(200).json({message:"hello nigga"})});


await connectionDB();
await connectionRedis();


app.use("/users",userRouter)
app.use("/messages", messageRouter)



app.use("{/*demo}" , (req , res ,next)=>{
    throw new Error( `url:${req.originalUrl} with method:${req.method} not found` , {cause:404})  });


    app.use(( err , req , res  , next)=>{
        console.log(err);
        res.status(err.cause || 500).json({message:err.message , stack:err.stack })
    });
 


    app.listen(port , ()=>{console.log(`example app.listening on port ${port}!`)})

};


export default bootstrap
