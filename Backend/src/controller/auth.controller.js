import userModel from "../model/user.model.js";
import jwt from "jsonwebtoken"
import { sendEmail } from "../services/mail.service.js";

async function register(req , res  ) {
    const {username , password , email} = req.body
    const isAlreadyExist = await userModel.findOne({
        $or : [
            {username : username} , 
            {email : email}     
        ]
    })
    if(isAlreadyExist) {
        return res.status(400).json({
            message : "Username or email already exist" ,
            sucess : false ,
            err: "Username or email already exist"
        })
    }

    const user = await userModel.create({
        username , 
        password , 
        email
    })

    await sendEmail({
        to : email ,
        subject : "Welcome to AstraMind" ,
        html : `<h1>Welcome to AstraMind</h1>
        <p>Thank you for registering with us. We are excited to have you on board!</p>` 
    })
    return res.status(201).json({
        message : "User registered successfully" ,
        sucess : true ,
        user : {
            id : user._id ,
            username : user.username ,
            email : user.email
        }
    })
}


export  {register}