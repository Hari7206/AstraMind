import { useState, useCallback } from "react";
import { getGalleryImages } from "../service/gallery.api";

export const useGallery = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchImages = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getGalleryImages();
      setImages(data.images || []);

    } catch (err) {
      console.log(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    images,
    loading,
    fetchImages,
  };
};