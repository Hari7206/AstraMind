// components/ChatInputBar.jsx
import { useRef, useState } from "react";

export default function ChatInputBar({
  message,
  setMessage,
  handleSubmit,
  fileInputRef,
  handleFileUpload,
  plusMenuRef,
  isPlusMenuOpen,
  setIsPlusMenuOpen,
  selectedMode,
  setSelectedMode,
  handleModeSelect,
  getModePlaceholder,
  isListening,
  startListening,
  handleCancelSpeech,
  handleAcceptSpeech,
  handleImageClick,
  isAiThinking,
  isUploading,
  isNewChat = false
}) {
  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto w-full">
      <div className="relative">
        {/* Glowing border effect */}
        <div
          className={`absolute -inset-1 rounded-[28px] blur-md transition-all duration-500 ${
            isNewChat
              ? "bg-gradient-to-r from-orange-500/30 to-orange-600/30 animate-pulse"
              : "bg-gradient-to-r from-orange-500/20 to-orange-600/20"
          }`}
        />

        <div className="relative flex flex-col bg-[#0a0a0f] rounded-[28px] p-4 gap-3 ring-1 ring-white/5 min-h-[130px]">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />

          {/* Top row: text input area, bigger + roomier */}
          <div className="flex-1 relative flex items-start pt-1">
            {selectedMode && (
              <div className="absolute left-1 top-1 flex items-center gap-2 z-10">
                <span className="text-sm font-medium text-orange-400">
                  {selectedMode === "webSearch" && "Web Search"}
                  {selectedMode === "jobSearch" && "Job Search"}
                  {selectedMode === "upload" && "Upload"}
                  {selectedMode === "email" && "Email"}
                  {selectedMode === "youtube" && "YouTube"}
                  {selectedMode === "bookmark" && "Bookmark"}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMode(null);
                    setMessage("");
                  }}
                  className="text-white/40 hover:text-white/80 transition-colors"
                >
                  <i className="fa-solid fa-xmark text-xs"></i>
                </button>
              </div>
            )}
            <textarea
              rows={1}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              className={`w-full bg-transparent outline-none resize-none py-1 text-slate-100 placeholder-slate-500 text-base leading-6 ${
                selectedMode ? "pt-8" : ""
              } ${isListening ? "placeholder-red-400" : ""}`}
              placeholder={getModePlaceholder()}
            />
          </div>

          {/* Bottom row: all icons, same order/place as before, just bigger */}
          <div className="flex items-center gap-1">
            <div ref={plusMenuRef} className="relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                  isPlusMenuOpen || selectedMode
                    ? "bg-orange-500/20 text-orange-400"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <i className={`fa-solid ${isPlusMenuOpen || selectedMode ? "fa-xmark" : "fa-plus"} text-xl`}></i>
              </button>

              {isPlusMenuOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-56 bg-[#0a0a0f] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                  <div className="py-2">
                    {[
                      { id: "webSearch", icon: "fa-earth-africa", label: "Web Search" },
                      { id: "jobSearch", icon: "fa-briefcase", label: "Job Search" },
                      { id: "upload", icon: "fa-upload", label: "Upload Document" },
                      { id: "email", icon: "fa-regular fa-envelope", label: "Generate Email" },
                      { id: "youtube", icon: "fa-brands fa-youtube", label: "YouTube Summarizer" },
                      { id: "bookmark", icon: "fa-regular fa-bookmark", label: "Save Bookmark" }
                    ].map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          handleModeSelect(item.id);
                          setIsPlusMenuOpen(false);
                        }}
                        className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                      >
                        <i className={`${item.icon} text-orange-400 w-5 text-center`}></i>
                        <span className="text-sm text-slate-200">{item.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1" />

            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                className="text-slate-400 hover:text-orange-400 hover:bg-white/5 w-11 h-11 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
                title="Voice input"
              >
                <i className="fa-solid fa-microphone text-lg"></i>
              </button>
            ) : (
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCancelSpeech}
                  className="bg-red-500/80 hover:bg-red-500 text-white w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-xmark text-sm"></i>
                </button>
                <button
                  type="button"
                  onClick={handleAcceptSpeech}
                  className="bg-orange-500/80 hover:bg-orange-500 text-white w-9 h-9 rounded-lg flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-check text-sm"></i>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleImageClick}
              disabled={isAiThinking || isListening || isUploading}
              className="text-slate-400 hover:text-orange-400 px-4 py-2.5 rounded-xl disabled:opacity-40 transition-colors flex-shrink-0 text-sm font-medium"
            >
              Image
            </button>

            <button
              type="submit"
              disabled={isAiThinking || isListening || isUploading}
              className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-110 text-white w-11 h-11 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0 shadow-lg shadow-orange-500/30 ${
                isNewChat ? "glow-pulse" : ""
              }`}
            >
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}