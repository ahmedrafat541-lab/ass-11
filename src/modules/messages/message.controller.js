import { Router } from "express";
import * as MS from "./message.service.js";
import { authentication } from "../../common/middleware/authentication.js";
import { Validation } from "../../common/middleware/validation.js";
// برفع بيه الملفات
import { multerLocal } from "../../common/middleware/multer.js";
import * as MV from "./message.validation.js";
import { Multer_Enum } from "../../common/enum/multer.enum.js";


const messageRouter = Router({strict : true , caseSensitive:true , mergeParams:true });
 
messageRouter.post("/"    ,
     multerLocal({
        customPath:"messages" ,
         customTypes: Multer_Enum.images 
        }).array("attachments" , 6 ) ,
          Validation(MV.createMessageSchema),
         MS.createMessage); 


         messageRouter.get("/" , authentication , MS.getMessage); 
         messageRouter.get("/:id" , authentication , MS.getMessageById); 






export default messageRouter
