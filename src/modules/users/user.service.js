import userModel from "../../DB/models/user.model.js";
import * as dbservice from "../../DB/service/DB.service.js";
import { Decrypt, Encrypt } from "../../common/security/encrypt.js";
// الهاش بتاع الباسورد
import {hashSync , compareSync} from "bcrypt";
import { Hash  , Compare } from "../../common/security/hash.js";
// بيفحص التوكن
import jwt from "jsonwebtoken"; 
// علشان يتاكد من تسجيل دخول جوجل
  import {OAuth2Client} from 'google-auth-library';
import { ProvierEnum } from "../../common/enum/user.enum.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
// بيتحقق من الداتا الجايه
import joi from "joi";
import { signUpSchema } from './user.validation.js';
import {randomUUID} from "node:crypto";
import { getValue, incr, setValue } from "../../DB/service/redis.service.js";
import { deleteKey , Keys  } from "../../DB/service/redis.service.js";
import sendEmail, { generate_otp } from "../../common/service/sendEmail.js";
import { eventEmitter } from "../../common/utils/event.js";
import { sendEmailOtp } from "./user.helper.js";
import { success_response } from "../../common/utils/success.response.js";





const client = new OAuth2Client();


//  بتجهز الداتا و تعمل hash , encrypt و تخزن
export const signUp = async (req , res , next)=>{


    console.log(req.files)
    const {fName , lName , email , password , age , gender , phone} = req.body ; 
    // const user = await userModel.create([{fName , lName , email , password , age , gender , phone }])
    // await dbservice.findOne({ model:userModel , filter: {email:email.toLowerCase()}})
    const hashPassword = hashSync(password , 12)
    // بتسحب الحاجات من ال body
    const paths = []
    for (const file of req.files.attachments){
        paths.push(file.path)
    }

    const otp = await generate_otp()
    const otpHash = hashSync(otp , 12)


    
     await setValue({
        key:`otp::${email}`,
        value:otpHash , 
        ttl:60*20
    })

    eventEmitter.emit("confirm_email" , async ()=>{

         await sendEmail({
        to: email,
        subject: "confirm email",
        html : `<h1>otp:${otp}</h1>`
    })
    })


 await setValue({
        key:`otp::max::${email}`,
        value:1 , 
        ttl:60*5
    })







   
    const user = await dbservice.create({model:userModel , data: {fName ,
         lName ,
          email ,
           password: hashPassword ,
            age ,
             gender ,
              phone:Encrypt(phone) ,
              profileImage:req.files.attachment[0].path,
              coverImages:paths
             }});


   success_response({res, statusCode:201 ,data:user })
}

 



export const reSendOtp = async (req , res , next)=>{
    const {email} = req.body

//a77777aaaaaaaaaaaa

    await sendEmailOtp({email , isConfirmed:true})
 
return res.status(201).json({message:"done" })
}
 





// لو هسجل بجوجل بستلم idtoken وبتاكد انه حقيقي من هنا
export const signUpWithGmail = async (req , res , next)=>{

    const {idToken}=req.body;

    console.log({idToken})
    
    // بشوف هة حقيقي ولا لا
  const decoded = await client.verifyIdToken({
      idToken ,
      audience: "199384594082-p76fjog67gmiiqv6ckotkcoor1mfrq1t.apps.googleusercontent.com",
  });
  // بطلع بقى بيانات اليوزر
  const {family_name , given_name , picture , email_verified,email } = decoded.getPayload();

// لو اليوزر مش موجود بيتعمله حساب من غير باسوورد لانه مسجل ب جوجل
  let user =await dbservice.findOne({ model:userModel , filter: {email:email.toLowerCase()}})
 if(!user){
   [user]= await dbservice.create({model:userModel , data: {fName:given_name , lName:family_name , profileImage:picture  , inConfirmed:email_verified  ,  email , provider:ProvierEnum.google   }});
 };
 if(user.provider == ProvierEnum.system ){return res.status(400).json({message:"login with system only"})};




     const access_token = jwt.sign({id:user._id , email:user.email} , "ahmedmeshahmed" , {expiresIn:100});
         const refresh_token = jwt.sign({id:user._id , email:user.email} , "ahmedmeshahmed gg" );

   return res.status(201).json({message:"done"  , tokens:{access_token , refresh_token} });

  
    
}

 



// بيدور على اليوزر بالايميل 
export const signIn = async (req , res , next)=>{
    const { email , password }=req.body;
    // const user = await userModel.findOne({email:email.toLowerCase()})
    const user = await dbservice.findOne({ model:userModel , filter: {email:email.toLowerCase() , isConfirmed:{$exists:true} , provider:ProvierEnum.system} });
    if(!user){ throw new Error("email not exist" , {cause:400})};

// بيعمل id فريد لل jti
    const tokenId = randomUUID();


    if( !await Compare(  password ,  user.password)){
         throw new Error("ivalid password" ,{cause:400} )};




         const access_token = jwt.sign({id:user._id , email:user.email} , "ahmedmeshahmed" , {expiresIn:100 ,jwtid:tokenId});
         const refresh_token = jwt.sign({id:user._id , email:user.email} , "ahmedmeshahmed gg" , {jwtid:tokenId});

   return res.status(201).json({message:"done"  , tokens:{access_token , refresh_token} })


};






export const getProfile = async (req  ,res , next)=>{
    return res.status(200).json({message:"done" , user:req.user})
} ;
 





// لما وقت ال access token يخلص العميل يبعت refresh token علشان يتبعتله access token جديد من غير م يعمل تسجيل دخول تاني
export const refreshToken = async (req  ,res , next)=>{

    const {authorization} = req.headers;
    if(!authorization){ throw new Error("token not exist" , {cause:404}) }


    // اللوكشه دي كلها بتتحقق بال secret بتاع ال refresh وبتجيب اليوزر بال id و تعمله access جديد
    const decoded = jwt.verify( authorization , "ahmedmeshahmed gg") ;
    if(!decoded){throw new Error("invalid token" , {cause:404})}
    const user  =await dbservice.findOne({
        model:userModel , filter:{_id:decoded.id}
    })
    if(!user){throw new Error ("user not exist" , {cause:404})}
    const access_token = jwt.sign({id:user._id , email:user.email} , "ahmedmeshahmed" , {expiresIn:100});



    return res.status(200).json({message:"done" , access_token})   };
 
  







    
export const shareProfile = async (req  ,res , next)=>{

    const {id} = req.params;
    let user  =await dbservice.findById({
        model:userModel ,options:{password:0} ,  id
    })
    if(!user){ throw new Error("user not exist" , {cause:404}) }
    user.phone = Decrypt(user.phone)

    return res.status(200).json({message:"done" , user})
} ;






export const updateProfile = async (req  ,res , next)=>{
    const {fName , lName , age , gender , phone} = req.body;
   let updateQuery = {};
   if(fName !== undefined){updateQuery.fName = fName}
   if(lName !== undefined){updateQuery.lName = lName}
   if(age !== undefined){updateQuery.age = age}
   if(gender !== undefined){updateQuery.gender = gender}
   if(phone !== undefined){updateQuery.phone = Encrypt(phone)}

   let user  =await dbservice.findByIdAndUpdate({
    model:userModel , id:req.user._id , update:updateQuery , options:{new:true , runValidators:true}
   })
    return res.status(200).json({message:"done" , user})
} ;







export const updatePassword = async (req  ,res , next)=>{
    const {oldPassword , newPassword , } = req.body;
    if(!await Compare(oldPassword , req.user.password)){throw new Error("invalid old password" , {cause:400})}

    req.user.password = await Hash(newPassword);
    await req.user.save();
    return res.status(200).json({message:"done" , user:req.user})
};






export const logout = async (req  ,res , next)=>{

    const {flag} = req.query;
    if(flag == "all"){
         req.user.changeCredintialAt = new Date();
    await req.user.save();
    await deleteKey(await Keys(`revoke_token::${req.user._id}`))

    }
    else{

        await setValue({key:`revoke_token::${req.user._id}::${req.decoded.jti}` ,
             value:`${req.user._id}`,
             ttl:req.decoded.exp - Math.floor(Date.now() / 1000) })
  
              
        // await dbservice.create({model:revokeTokenModel , data:{
        //     userId:req.user._id , tokenId:req.decoded.jti , expiresAt:new Date(req.decoded.exp * 1000)
        // }})
    }


   
    return res.status(200).json({message:"done"})
};













export const confirmEmail = async (req, res , next)=>{


    const {email , otp} = req.body

    const otpValue = await getValue(`otp::${email}`)
    if(!otpValue){
        throw new Error("otp expire" , {cause:400})
    }

    if(!compareSync(otp , otpValue)){
        throw new Error("invalid otp" , {cause:400})
    }


    const user = await dbservice.findOneAndUpdate({
        model:userModel ,
        filter:{
            email , isConfirmed:{$exists:false}
        },
        update:{
            isConfirmed:true
        }
    })


    if(!user){
        throw new Error("user not exist" , {cause:400})
    }


    await deleteKey(`otp::${email}`)

    return res.status(200).json({message:"done" , user})


}









export const forgetPassword = async (req, res , next )=> {
    const {email} = req.body

    await sendEmailOtp({email , isConfirmed:true , subject:"forget password"})


return res.status(200).json({message:"done"})

}









export const resetPassword = async (req, res , next )=> {
    const {email , code , password} = req.body

   
           const otp = await getValue(`otp::${email}`)
           if(!otp ) throw new Error(`you can resend otp after ${otpTTl}`)
   

            if(!compareSync(code , otp))throw new Error("invalid otp")

         const user = await dbservice.findOneAndUpdate({
            model:userModel,
                    filter:{
                        email,
                        isConfirmed:{$exists:true}
                    },
                    update:{
                        password:hashSync(password , 12),
                        changeCredintialAt:new Date()
                    } 
                })
                if(!user)throw new Error("user not exist" , {cause:400})

                    await deleteKey(`otp::${email}`)



return res.status(200).json({message:"done"})

}




