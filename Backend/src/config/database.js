import mongoose from "mongoose"


function conntecToDb(){
    mongoose.connect(process.env.MONGO_URI)
    .then(() => {
        
    })
}

export default conntecToDb