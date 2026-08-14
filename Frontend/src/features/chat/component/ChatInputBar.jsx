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
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto w-full">
      <div className="relative">
        {isNewChat && (
          <div
            className="absolute -inset-0.5 rounded-3xl blur-md transition-all duration-500 bg-gradient-to-r from-orange-500/30 to-orange-600/30 animate-pulse"
          />
        )}

        <div className="relative flex flex-col bg-[#1a1a1a] rounded-3xl p-4 ring-0">
          {/* Text Input - Top */}
          <div className="flex-1 relative flex items-center">
            {selectedMode && (
              <div className="absolute left-3 flex items-center gap-2 z-10">
                <span className="text-sm font-medium text-orange-400">
                  {selectedMode === 'webSearch' && 'Web Search'}
                  {selectedMode === 'jobSearch' && 'Job Search'}
                  {selectedMode === 'upload' && 'Upload'}
                  {selectedMode === 'email' && 'Email'}
                  {selectedMode === 'youtube' && 'YouTube'}
                  {selectedMode === 'bookmark' && 'Bookmark'}
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
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={`w-full bg-transparent outline-none py-3 text-slate-100 placeholder-slate-400 text-base ${
                selectedMode ? 'pl-[130px]' : 'pl-3'
              } ${isListening ? "placeholder-red-400" : ""}`}
              placeholder={getModePlaceholder()}
            />
          </div>

          {/* Bottom Row - Options & Send Button */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-1">
              {/* Plus Menu Button */}
              <div ref={plusMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isPlusMenuOpen || selectedMode
                      ? 'bg-orange-500/20 text-orange-400'
                      : 'text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  <i className={`fa-solid ${isPlusMenuOpen || selectedMode ? 'fa-xmark' : 'fa-plus'} text-base`}></i>
                </button>

                {isPlusMenuOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-56 bg-[#1a1a1a] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                    <div className="py-2">
                      {[
                        { id: 'webSearch', icon: 'fa-solid fa-globe', label: 'Web Search' },
                        { id: 'jobSearch', icon: 'fa-solid fa-briefcase', label: 'Job Search' },
                        { id: 'upload', icon: 'fa-solid fa-upload', label: 'Upload Document' },
                        { id: 'email', icon: 'fa-regular fa-envelope', label: 'Generate Email' },
                        { id: 'youtube', icon: 'fa-brands fa-youtube', label: 'YouTube Summarizer' },
                        { id: 'bookmark', icon: 'fa-regular fa-bookmark', label: 'Save Bookmark' }
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

              {/* Image Button */}
              <button
                type="button"
                onClick={handleImageClick}
                disabled={isAiThinking || isListening || isUploading}
                className="text-slate-400 hover:text-orange-400 px-3 py-2 rounded-lg disabled:opacity-40 transition-colors text-sm font-medium"
              >
                Image
              </button>

              {/* Voice Input Button */}
              {!isListening ? (
                <button
                  type="button"
                  onClick={startListening}
                  className="text-slate-400 hover:text-orange-400 hover:bg-white/10 w-10 h-10 rounded-xl flex items-center justify-center transition-colors"
                  title="Voice input"
                >
                  <i className="fa-solid fa-microphone text-base"></i>
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleCancelSpeech}
                    className="bg-red-500/80 hover:bg-red-500 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <i className="fa-solid fa-xmark text-sm"></i>
                  </button>
                  <button
                    type="button"
                    onClick={handleAcceptSpeech}
                    className="bg-orange-500/80 hover:bg-orange-500 text-white w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                  >
                    <i className="fa-solid fa-check text-sm"></i>
                  </button>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isAiThinking || isListening || isUploading}
              className={`bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-110 text-white px-5 py-2.5 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all shadow-lg shadow-orange-500/30 gap-2 ${
                isNewChat ? 'glow-pulse' : ''
              }`}
            >
              <span className="text-sm font-medium">Ask</span>
              <i className="fa-solid fa-arrow-up text-sm"></i>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}