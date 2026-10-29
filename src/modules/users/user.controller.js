// بيربط كل ال url ب ال middlewares في اخرها داله من ال service




import { Router } from "express";
import * as US from "./user.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import { authorization } from "../../common/middleware/authorization.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { Validation } from "../../common/middleware/validation.js";
import { signUpSchema } from "./user.validation.js";
import {signInSchema} from "./user.validation.js";
// برفع بيه الملفات
import { multerLocal } from "../../common/middleware/multer.js";
import { refreshTokenSchema } from "./user.validation.js";
import { shareProfileSchema } from "./user.validation.js";
import { updateProfileSchema } from "./user.validation.js";
import {updatePasswordSchema} from "./user.validation.js";
import { confirmEmailSchema } from "./user.validation.js";
import messageRouter from "../messages/message.controller.js";

const userRouter = Router({strict:true , caseSensitive:true});


userRouter.use("/:userId/messages" , messageRouter)




 
userRouter.post("/signup"    , multerLocal({customPath:"admins" , customTypes:['image/jpeg']}).fields([{name:"attachment" , maxCount:1} , {name:"attachments" , maxCount:6}]) , Validation(signUpSchema), US.signUp); 
userRouter.post("/signin" , Validation(signInSchema), US.signIn);
userRouter.post("/refresh-token" , Validation(refreshTokenSchema), US.refreshToken);
userRouter.get("/profile" , authentication , authorization([RoleEnum.user]) ,  US.getProfile);
userRouter.get("/share-profile/:id" , Validation(shareProfileSchema) ,  US.shareProfile);
userRouter.patch("/update-password" , Validation(updatePasswordSchema) , authentication ,  US.updatePassword);
userRouter.patch("/update-profile" ,  Validation(updateProfileSchema) ,authentication  , US.updateProfile);
userRouter.patch("/logout" , authentication , US.logout);
userRouter.patch("/confirmEmail" , Validation(confirmEmailSchema) , US.confirmEmail )
userRouter.post("/signup/gmail" , US.signUpWithGmail);
userRouter.patch("/reSend-otp"  , US.reSendOtp); 
userRouter.patch("/forget-password" , US.forgetPassword); 
userRouter.patch("/reset-password" , US.resetPassword); 


export default userRouter
