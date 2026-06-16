import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    chat: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "chat",
        required: true,
    },
    content: {
        type: String,
        required: function() { return this.messageType === "text"; }, 
    },
    role: {
        type: String,
        enum: ["user", "ai"],
        required: true,
    },
    messageType: {
        type: String,
        enum: ["text", "image"],
        default: "text"
    },
    fileUrl: {
        type: String, 
        default: null
    }
},
    {
        timestamps: true,
    }
)

const messageModel = mongoose.model("message", messageSchema)

export default messageModel;