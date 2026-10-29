import mongoose from "mongoose";
import { GenderEnum, ProvierEnum, RoleEnum } from "../../common/enum/user.enum.js";


//هنا الschema بتاع اليوزر وبيتم تحديد نوع الداتا اللي هتتحفظ في الداتا بيز والخصائص بتاعتها زي النوع والrequired والdefault والenum


const userSchema = new mongoose.Schema({ 

fName:{ 
    type:String,
    required:true,
    // بيشيل المسافه بتاعت الاطراف
    trim:true,
    minlenght:2,
    
},
lName:{ 
    type:String,
    required:true,
    trim:true,
    minlength:2,
   
},
email:{
    type:String,
    required:true,
    trim:true,
    unique:true,
    lowercase:true
},
password:{
    type:String,
    // لو اليوزر سجل بجوجل ميطلبش منه 
    required: function(){
       return this.provider === ProvierEnum.system
    },
    trim:true,
},
cpassword:{
    type:String,
    trim:true,
},
age:{
    type:Number,
    required:function(){
       return this.provider === ProvierEnum.system
    },
    min:19,
    max:70
},
gender:{
    type:String,
    enum:Object.values(GenderEnum),
    default:GenderEnum.male
},

profileImage:{type:String},
coverImages:[String] , 

phone: String ,

provider:{
    type:String,
enum: Object.values(ProvierEnum) ,
default:ProvierEnum.system
},
role:{
    type:String,
enum:Object.values(RoleEnum),
default:RoleEnum.user
},
isConfirmed:{
    type:Boolean
},
//بيحفظ اخر login time للuser
changeCredintialAt:Date,


},{
    timestamps:true,
    strict:true,
    strictQuery:true,
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
});


const userModel = mongoose.models.User || mongoose.model("User" , userSchema);


export default userModel 


