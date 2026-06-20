import { useEffect, useState } from "react"; // Added useState hook
import { useNavigate } from "react-router-dom";
import { useGallery } from "../hooks/useGallery";

export default function Gallery() {
  const navigate = useNavigate();
  const { images, fetchImages, loading } = useGallery();
  
  // STEP 5.1 — STATE FOR SELECTED IMAGE
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    fetchImages();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Back Button */}
      <button
        type="button"
        onClick={() => navigate("/")}
        className="mb-4 text-sm text-blue-600 hover:underline flex items-center gap-1 font-medium bg-transparent border-none cursor-pointer"
      >
        ← Back to Chat
      </button>

      <h1 className="text-2xl font-bold mb-6 text-slate-800">
        Your Image Gallery
      </h1>

      {/* LOADING UI UPGRADE (Skeleton Screen) */}
      {loading && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(6)
            .fill(0)
            .map((_, i) => (
              <div
                key={i}
                className="h-52 bg-slate-200 animate-pulse rounded-xl"
              />
            ))}
        </div>
      )}

      {/* EMPTY STATE */}
      {!loading && images.length === 0 && (
        <div className="text-center text-gray-500 mt-10 p-8 border border-dashed rounded-xl bg-slate-50">
          <p className="text-lg font-medium">No images generated yet.</p>
          <p className="text-sm text-gray-400 mt-1">Head back to the chat to create some art!</p>
        </div>
      )}

      {/* IMAGE CARD UI GRID */}
      {!loading && images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img) => (
            // STEP 5.2 — MAKE IMAGE CLICKABLE
            <div
              key={img._id}
              className="relative group rounded-xl overflow-hidden border bg-white shadow-sm cursor-pointer"
              onClick={() => setSelectedImage(img)}
            >
              {/* IMAGE */}
              <img
                src={img.fileUrl}
                alt={img.content}
                className="w-full h-52 object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />

              {/* DARK OVERLAY ON HOVER */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300"></div>

              {/* PROMPT TEXT */}
              <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/90 to-transparent">
                <p className="text-white text-xs line-clamp-2 font-medium">
                  {img.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP 5.3 — FULLSCREEN MODAL OVERLAY */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-3xl w-full p-4 bg-slate-900 rounded-xl"
            onClick={(e) => e.stopPropagation()} // Prevents closing modal when clicking content inside
          >
            <div className="max-h-[70vh] overflow-hidden rounded-xl flex items-center justify-center bg-black">
              <img
                src={selectedImage.fileUrl}
                alt={selectedImage.content}
                className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg"
              />
            </div>

            <p className="text-white text-sm mt-3 font-medium line-clamp-3">
              {selectedImage.content}
            </p>

            {/* ACTIONS FOOTER */}
            <div className="flex gap-3 mt-4">
              {/* DOWNLOAD */}
              <a
                href={selectedImage.fileUrl}
                download={`astramind-${selectedImage._id}.png`}
                target="_blank"
                rel="noreferrer"
                className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Download
              </a>

              {/* CLOSE */}
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}