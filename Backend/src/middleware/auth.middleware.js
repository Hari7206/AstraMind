import jwt from "jsonwebtoken"

export function authUser(req , res , next) {
    const token = req.cookies.token
    if(!token) {
        return res.status(401).json({
            message : "Unauthorized" ,
            sucess : false ,
            err : "Unauthorized"
        })
    }
    try {
        const decoded = jwt.verify(token , process.env.JWT_SECRET_KEY)
        req.user = decoded
        next()
    }
    catch(err) {
        return res.status(401).json({
            message : "Unauthorized" ,
            sucess : false ,
            err : "Unauthorized"
        })
    }
}