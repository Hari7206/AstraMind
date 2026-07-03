import { Router } from "express";
import { authUser } from "../middleware/auth.middleware.js";
import {
  uploadDocument,
  chatWithDocument,
  getDocuments,
  deleteDocument
} from "../controller/document.controller.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const documentRouter = Router();

const uploadsDir = path.join(__dirname, "../../uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ["pdf", "docx", "txt"];
  const extension = file.originalname.split(".").pop().toLowerCase();
  if (allowedTypes.includes(extension)) {
    cb(null, true);
  } else {
    cb(new Error("Only PDF, DOCX, and TXT files are allowed"), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 
  }
});

documentRouter.post(
  "/upload",
  authUser,
  upload.single("file"),
  uploadDocument
);

documentRouter.post(
  "/chat",
  authUser,
  chatWithDocument
);

documentRouter.get(
  "/",
  authUser,
  getDocuments
);

documentRouter.delete(
  "/:documentId",
  authUser,
  deleteDocument
);

export default documentRouter;