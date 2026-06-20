import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000",
  withCredentials: true,
});

export const getGalleryImages = async () => {
  const res = await api.get("/api/ai/gallery");
  return res.data;
};