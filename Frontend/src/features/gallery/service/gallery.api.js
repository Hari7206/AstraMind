import axios from "axios";
import { API_URL } from "../../../config/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const getGalleryImages = async () => {
  const res = await api.get("/api/ai/gallery");
  return res.data;
};