import mongoose from "mongoose";

const documentSchema = new mongoose.Schema({
  chat: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Chat",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ["pdf", "docx", "txt"],
    required: true
  },
  fileUrl: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  chunks: [{
    text: String
  }],
  status: {
    type: String,
    enum: ["processing", "processed", "failed"],
    default: "processing"
  }
}, {
  timestamps: true
});

const Document = mongoose.model("Document", documentSchema);
export default Document;