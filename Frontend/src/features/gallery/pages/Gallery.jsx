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
    <div className="relative min-h-screen bg-[#07080c] text-slate-100">
      {/* Ambient background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-orange-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[28rem] h-[28rem] rounded-full bg-fuchsia-600/10 blur-[130px]" />
      </div>

      <div className="relative z-10 p-6 max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          type="button"
          onClick={() => navigate("/")}
          className="mb-6 text-sm text-slate-300 hover:text-white flex items-center gap-1.5 font-medium bg-white/5 border border-white/10 hover:border-white/20 rounded-lg px-3 py-1.5 transition-colors cursor-pointer"
        >
          ← Back to Chat
        </button>

        <h1 className="text-2xl font-bold mb-6 bg-gradient-to-r from-orange-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
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
                  className="h-52 bg-white/5 border border-white/10 animate-pulse rounded-xl"
                />
              ))}
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && images.length === 0 && (
          <div className="text-center text-slate-400 mt-10 p-10 border border-dashed border-white/15 rounded-2xl bg-white/[0.02] backdrop-blur-sm">
            <p className="text-lg font-medium text-slate-200">No images generated yet.</p>
            <p className="text-sm text-slate-500 mt-1">Head back to the chat to create some art!</p>
          </div>
        )}

        {/* IMAGE CARD UI GRID */}
        {!loading && images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((img) => (
              // STEP 5.2 — MAKE IMAGE CLICKABLE
              <div
                key={img._id}
                className="group relative rounded-xl overflow-hidden border border-white/10 bg-white/[0.03] backdrop-blur-sm cursor-pointer transition-shadow hover:shadow-[0_0_30px_-5px] hover:shadow-fuchsia-500/30 hover:border-white/20"
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
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-all duration-300"></div>

                {/* PROMPT TEXT */}
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 bg-gradient-to-t from-black/95 to-transparent">
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
            className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div
              className="relative max-w-3xl w-full p-4 bg-[#0d0f16] border border-white/10 rounded-2xl shadow-2xl shadow-fuchsia-500/10"
              onClick={(e) => e.stopPropagation()} // Prevents closing modal when clicking content inside
            >
              <div className="max-h-[70vh] overflow-hidden rounded-xl flex items-center justify-center bg-black">
                <img
                  src={selectedImage.fileUrl}
                  alt={selectedImage.content}
                  className="max-w-full max-h-[70vh] object-contain rounded-xl"
                />
              </div>

              <p className="text-slate-200 text-sm mt-3 font-medium line-clamp-3">
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
                  className="bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 hover:brightness-110 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all"
                >
                  Download
                </a>

                {/* CLOSE */}
                <button
                  type="button"
                  onClick={() => setSelectedImage(null)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg text-slate-200 text-sm font-medium transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}