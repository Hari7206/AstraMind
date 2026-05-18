import mongoose from "mongoose"


function conntecToDb(){
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        console.log("data base is connected ");
        
    })
}

export default conntecToDb