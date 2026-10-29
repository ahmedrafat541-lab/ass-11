import { hashSync } from "bcrypt";
import { eventEmitter } from './../../common/utils/event.js'; 
import sendEmail , { generate_otp } from "../../common/service/sendEmail.js";
import { getValue , setValue , ttl ,incr, deleteKey } from "../../DB/service/redis.service.js";
import * as dbservice from "../../DB/service/DB.service.js";
import userModel from "../../DB/models/user.model.js";



export const sendEmailOtp = async ({email , isConfirmed , subject="confirm Email"} = {})=>{
    
        const isBlocked_ttl = await ttl(`otp::block::${email}`)
        if( isBlocked_ttl > 0){throw new Error(`you blocked you can resend after ${isBlocked_ttl}`)
        }
    
        // if(isBlocked_ttl < 0){
        //     if(getValue(`otp::max::${email}`)>=3){
        //         await setValue({
        //             key:`otp::max::${email}`,
        //             value:0,
        //             ttl:60*5
        //         })
     
        //     }
        // }
    


        const otpTTl = await ttl(`otp::${email}`)
        if(otpTTl > 0 ) throw new Error(`you can resend otp after ${otpTTl}`)

            const max_opt = await getValue(`otp::max::${email}`)
            if(max_opt >=3) {
                await setValue({
                    key:`otp::block::${email}`,
                    value:"1",
                    ttl:60*10
                })
                await deleteKey(`otp::max::${email}`)
                throw new Error(`you have axceeded the max numbers`)
            }

    const user = await dbservice.findOne({
        model:userModel,
        filter:{email , isConfirmed:{$exists:isConfirmed}}
    })   

    if(!user)throw new Error("user not exist")

        const otp = await generate_otp()
        const otpHash = hashSync (otp , 12)

        await setValue({
            key:`otp::${email}`,
            value:otpHash,
            ttl:60*20
        })

eventEmitter.emit("confirm_email" , async ()=>{
    await sendEmail({
        to:email , 
        subject,
        html:`<h1>otp:${otp}</h1>`
    })
})



await incr(`otp::max::${email}`)


}