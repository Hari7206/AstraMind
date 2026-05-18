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

    const emailVerificationToken = jwt.sign({ email : user.email} , process.env.JWT_SECRET_KEY)
    await sendEmail({
        to : email ,
        subject : "Welcome to AstraMind" ,
        html : `<h1>Welcome to AstraMind</h1>
        <p>Thank you for registering with us. We are excited to have you on board!</p>
        <p>Please click the link below to verify your email address:</p>
        <a href="http://localhost:3000/api/auth/verify-email?token=${emailVerificationToken}">Verify Email</a>
        <p>If you did not register for an account, please ignore this email.</p>
        <p>Best regards,<br>AstraMind Team</p>` 
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



async function verifyEmail(req , res) {

    const {token} = req.query
    if(!token) {
        return res.status(400).json({
            message : "Token is required" ,
            sucess : false ,
            err : "Token is required"
        })
    }
    try {
        const decoded = jwt.verify(token , process.env.JWT_SECRET_KEY)
        const user = await userModel.findOne({email : decoded.email})
        if(!user) {
            return res.status(400).json({
                message : "Invalid token" ,
                sucess : false ,
                err : "Invalid token"
            })
        }
        user.isVerified = true
        await user.save()

    const html = `<h1>Email Verified</h1>
    <p>Your email has been successfully verified. You can now log in to your account.</p>
    <a href="http://localhost:3000/login">Go to Login</a>
    <p>Best regards,<br>AstraMind Team</p>`

    res.send(html)

    }
    catch(err) {
        return res.status(400).json({
            message : "Invalid token" ,
            sucess : false ,
            err : "Invalid token"
        })
    }
}


export  {register , verifyEmail}