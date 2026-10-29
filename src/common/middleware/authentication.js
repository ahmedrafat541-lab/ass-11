// امن الجامعه 


import jwt from "jsonwebtoken";
import userModel from "../../DB/models/user.model.js";
import * as dbservice from "../../DB/service/DB.service.js";
import { ttl } from "../../DB/service/redis.service.js";


export const authentication = async (req , res , next) =>{


// بيجيب التوكن من ال header
     const {authorization} = req.headers;

    if(!authorization){ throw new Error("token not exist" , {cause:400}) } 
// هنا بيتاكد انه سليم
    const decoded = jwt.verify( authorization , "ahmedmeshahmed") ;
    if(!decoded){throw new Error("invalid token" , {cause:400})} 
// بيجيب بقى اليوزر من الداتا بيز بالايميل الي جوا التوكن
    const user  =await dbservice.findOne({
        model:userModel , filter:{email:decoded.email.toLowerCase()}
    })

    if(!user){throw new Error ("email not exist" , {cause:404})}
if (!user?.isConfirmed){throw new Error ("user not confirmed")}

// هنا فحص ال logout
// ال iat ده وقت عمل التوكن
    if(user?.changeCredintialAt?.getTime() > decoded.iat * 1000){
        throw new Error("invalid token" , {cause:400})}

        // if(await dbservice.findOne({model:revokeTokenModel , filter:{tokenId:decoded.jti}})){
        //     throw new Error("invalid token" , {cause:400})}
    
 

        if(await ttl(`revoke_token::${user._id}::${decoded.jti}`)>0){
            throw new Error("invalid revoke token , you should login again")}


    req.user = user
    req.decoded = decoded
    next()


}


