import nodemailer from "nodemailer";
import { randomInt } from 'node:crypto';

const sendEmail = async ({to , subject , html , attachments} ={})=>{
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: "ahmedrafat541@gmail.com",
            pass: "uotoxcajauomcxec"
        }
    })


    const info = await transporter.sendMail({
    from: '"3b8ny" <ahmedrafat541@gmail.com>',
    to,
    subject,
    html:html || "" ,
    attachments: attachments || []
});

return info.accepted.length > 0 ? true : false

}

export const generate_otp = async () =>{
    return randomInt(100000 ,1000000).toString()
}









export default sendEmail


