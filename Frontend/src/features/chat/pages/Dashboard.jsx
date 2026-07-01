import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setCurrentChatId,
  updateStreamingMessage,
  setAiThinking,
  addNewMessage,
  createNewChat,
  setModel
} from "../chat.slice";
import { useChats } from "../hooks/useChats";
import { initializeSocketConnection } from "../service/chat.socket";

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isAiThinking = useSelector((state) => state.chat.isAiThinking);
  const selectedModel = useSelector((state) => state.chat.selectedModel || "mistral");

  const {
    handleSendMessage,
    handleGetChats,
    handleGetMessages,
    handleGenerateImage: generateImageFromApi
  } = useChats();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const [speechState, setSpeechState] = useState({ index: null, status: "stopped" });

  // --- Speech Recognition States ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const baseMessageRef = useRef(""); // Keeps track of text before turning on mic

  const chatEndRef = useRef(null);
  const activeChat = currentChatId ? chats[currentChatId] : null;

  useEffect(() => {
    handleGetChats();
  }, [handleGetChats]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentChatId]);

  // --- Speech Recognition Logic ---
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          baseMessageRef.current += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Combine existing text + finalized speech + temporary speech
      setMessage(baseMessageRef.current + interimTranscript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error", event.error);
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    baseMessageRef.current = message ? message + " " : ""; // save what was already typed
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
  };

  const handleCancelSpeech = () => {
    if (!recognitionRef.current) return;
    recognitionRef.current.stop();
    setIsListening(false);
    setMessage(baseMessageRef.current.trim()); // Revert back to text before mic started
  };

  const handleAcceptSpeech = () => {
    stopListening();
    // Keeps the text inside the input box so user can press send normally or make quick edits
  };

  const handleNewChat = () => {
    dispatch(setCurrentChatId(null));
    setMessage("");
  };

  const handleSelectChat = async (chatId) => {
    dispatch(setCurrentChatId(chatId));
    await handleGetMessages(chatId);
  };

  const handleCopyText = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageIndex(index);
    setTimeout(() => setCopiedMessageIndex(null), 2000);
  };

  const handleToggleSpeech = (text, index) => {
    const synth = window.speechSynthesis;
    if (!synth) return;

    if (speechState.index === index) {
      if (speechState.status === "playing") {
        synth.pause();
        setSpeechState({ index, status: "paused" });
      } else if (speechState.status === "paused") {
        synth.resume();
        setSpeechState({ index, status: "playing" });
      } else {
        startSpeaking(text, index, synth);
      }
    } else {
      synth.cancel();
      startSpeaking(text, index, synth);
    }
  };

  const startSpeaking = (text, index, synth) => {
    const cleanText = text.replace(/\[.*?\]\(.*?\)/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);

    const voices = synth.getVoices();
    const femaleVoice = voices.find(
      (v) =>
        v.name.toLowerCase().includes("female") ||
        v.name.toLowerCase().includes("zira") ||
        v.name.toLowerCase().includes("google uk english female") ||
        v.name.toLowerCase().includes("natural")
    );
    if (femaleVoice) utterance.voice = femaleVoice;

    utterance.onend = () => {
      setSpeechState({ index: null, status: "stopped" });
    };

    utterance.onerror = () => {
      setSpeechState({ index: null, status: "stopped" });
    };

    setSpeechState({ index, status: "playing" });
    synth.speak(utterance);
  };

  const handleImageClick = async () => {
    const prompt = message.trim();
    if (!prompt) return;

    try {
      dispatch(setAiThinking(true));

      const data = await generateImageFromApi(prompt, currentChatId);

      if (data && data.success) {
        const activeSessionId = data.chatId || currentChatId;

        if (!currentChatId && activeSessionId) {
          dispatch(
            createNewChat({
              chatId: activeSessionId,
              title: data.chat?.title || prompt
            })
          );
          dispatch(setCurrentChatId(activeSessionId));
        }

        if (data.userMessage) {
          dispatch(addNewMessage({
            chatId: activeSessionId,
            content: data.userMessage.content,
            role: data.userMessage.role,
            messageType: data.userMessage.messageType
          }));
        }

        if (data.aiMessage) {
          dispatch(addNewMessage({
            chatId: activeSessionId,
            content: data.aiMessage.content,
            role: data.aiMessage.role,
            messageType: data.aiMessage.messageType,
            fileUrl: data.aiMessage.fileUrl
          }));
        }

        if (!currentChatId && data.chatId) {
          handleGetChats();
        } else {
          await handleGetMessages(activeSessionId);
        }
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      dispatch(setAiThinking(false));
      setMessage("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    if (currentChatId) {
      dispatch(
        addNewMessage({
          chatId: currentChatId,
          content: trimmedMessage,
          role: "user"
        })
      );
    }

    setMessage("");
    await handleSendMessage(trimmedMessage, currentChatId, selectedModel);
  };

  useEffect(() => {
    if (!currentChatId) return;

    const socket = initializeSocketConnection(
      currentChatId,
      dispatch,
      { updateStreamingMessage, setAiThinking }
    );

    return () => {
      if (socket && typeof socket.disconnect === "function") {
        socket.disconnect();
      }
    };
  }, [currentChatId, dispatch]);

  const chatList = Object.values(chats).sort(
    (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
  );

  return (
    <div className="relative flex h-screen bg-[#07080c] text-slate-100 overflow-hidden">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[32rem] h-[32rem] rounded-full bg-orange-600/20 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[36rem] h-[36rem] rounded-full bg-blue-600/20 blur-[140px]" />
        <div className="absolute bottom-0 left-1/3 w-[28rem] h-[28rem] rounded-full bg-fuchsia-600/10 blur-[130px]" />
      </div>

      {/* Sidebar */}
      <div
        className={`relative z-10 ${
          sidebarOpen ? "w-72" : "w-20"
        } flex flex-col bg-white/[0.03] backdrop-blur-2xl border-r border-white/10 transition-all duration-300`}
      >
        <div className="p-4 flex justify-between items-center border-b border-white/5">
          {sidebarOpen && (
            <span className="font-semibold tracking-wide bg-gradient-to-r from-orange-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              AstraMind
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((p) => !p)}
            className="text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/40 hover:brightness-110 transition-all"
          >
            {sidebarOpen ? "New Chat" : "+"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/gallery")}
            className="w-full py-2.5 rounded-xl font-medium text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
          >
            {sidebarOpen ? "Gallery" : "🖼"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4">
          {sidebarOpen && (
            <h2 className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-2 mb-3 mt-2">
              Chats
            </h2>
          )}

          <div className="space-y-1.5">
            {chatList.map((chat) => {
              const isActive = currentChatId === chat.id;
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => handleSelectChat(chat.id)}
                  className={`relative w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                  }`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-4 w-[3px] rounded-full bg-gradient-to-b from-orange-400 via-fuchsia-400 to-blue-400" />
                  )}
                  <span className={isActive ? "pl-2" : "pl-2"}>
                    {sidebarOpen ? (chat.title || chat.id) : <i className="fa-solid fa-message"></i>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Panel */}
      <div className="relative z-10 flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <div className="bg-white/[0.02] backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-slate-100">
              {activeChat?.title || "New Chat"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-semibold bg-white/5 text-slate-300 border border-white/10 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Selected: {selectedModel}
            </span>

            <select
              value={selectedModel}
              onChange={(e) => dispatch(setModel(e.target.value))}
              className="bg-white/5 border border-white/10 text-slate-100 text-sm px-3 py-1.5 rounded-lg outline-none focus:ring-2 focus:ring-fuchsia-500/50 focus:border-fuchsia-500/40 font-medium transition-shadow"
            >
              <option className="bg-[#0d0f16]" value="mistral">Mistral</option>
              <option className="bg-[#0d0f16]" value="groq">Groq (LLaMA 3)</option>
            </select>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeChat?.messages?.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col group ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              {msg.role === "ai" && (
                <div className="text-xs font-medium text-slate-500 mb-1 ml-2 flex items-center gap-1.5">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_2px] shadow-emerald-400/50"></span>
                  AI • <span className="capitalize font-semibold text-slate-300">{msg.model || "mistral"}</span>
                </div>
              )}

              <div
                className={`max-w-2xl px-5 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-orange-500/90 via-fuchsia-500/90 to-blue-500/90 text-white shadow-lg shadow-fuchsia-500/10"
                    : "bg-white/[0.04] border border-white/10 backdrop-blur-md text-slate-100"
                }`}
              >
                {(!msg.messageType || msg.messageType === "text") && (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}

                {msg.messageType === "image" && (
                  <div className="flex flex-col gap-2 p-1">
                    <img
                      src={msg.fileUrl}
                      alt={msg.content}
                      className="max-w-xs sm:max-w-md rounded-xl shadow-lg shadow-black/40 border border-white/10"
                      loading="lazy"
                    />
                    <p className="text-xs text-slate-400 italic mt-1">{msg.content}</p>
                  </div>
                )}
              </div>

              {/* Message Controls */}
              <div className="mt-1 flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {(!msg.messageType || msg.messageType === "text") && (
                  <button
                    type="button"
                    onClick={() => handleToggleSpeech(msg.content, index)}
                    className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 rounded-md transition-colors bg-transparent border-none cursor-pointer"
                    title={speechState.index === index && speechState.status === "playing" ? "Pause" : "Read aloud"}
                  >
                    {speechState.index === index && speechState.status === "playing" ? (
                      <i className="fa-solid fa-square text-xs text-slate-400"></i>
                    ) : speechState.index === index && speechState.status === "paused" ? (
                      <i className="ri-volume-up-line text-base text-fuchsia-400 animate-pulse"></i>
                    ) : (
                      <i className="ri-volume-up-line text-base"></i>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCopyText(msg.content, index)}
                  className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 rounded-md transition-colors bg-transparent border-none cursor-pointer"
                  title="Copy"
                >
                  {copiedMessageIndex === index ? (
                    <i className="fa-solid fa-check text-emerald-400 text-sm"></i>
                  ) : (
                    <i className="fa-regular fa-copy text-sm"></i>
                  )}
                </button>
              </div>
            </div>
          ))}

          <div ref={chatEndRef} />

          {isAiThinking && (
            <div className="flex justify-start">
              <div className="bg-white/[0.04] border border-white/10 backdrop-blur-md px-4 py-2 rounded-xl text-slate-400 text-sm flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:-0.3s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:-0.15s]"></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce"></span>
                </span>
                AI is generating response...
              </div>
            </div>
          )}
        </div>

        {/* Question Box / Input Form */}
        <div className="border-t border-white/10 bg-white/[0.02] backdrop-blur-xl p-4">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
            <div className="relative">
              {/* Glow layer */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 rounded-3xl blur-xl opacity-50 animate-glow" />

              {/* Actual input bar */}
              <div className="relative flex items-center bg-[#0d0f16] rounded-2xl p-2 gap-2 ring-1 ring-white/10 shadow-2xl">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`flex-1 bg-transparent outline-none px-3 py-3 text-slate-100 placeholder-slate-500 ${
                    isListening ? "placeholder-red-400 font-medium" : ""
                  }`}
                  placeholder={isListening ? "Listening... Speak now..." : "Ask AstraMind anything..."}
                />

                {/* Dynamic Mic Buttons */}
                {!isListening ? (
                  <button
                    type="button"
                    onClick={startListening}
                    className="bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 w-12 h-12 rounded-xl flex items-center justify-center transition-colors"
                    title="Record audio"
                  >
                    <i className="fa-solid fa-microphone"></i>
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5">
                    {/* Cancel Speech Button */}
                    <button
                      type="button"
                      onClick={handleCancelSpeech}
                      className="bg-red-500 hover:bg-red-600 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors font-bold text-sm"
                      title="Cancel recording"
                    >
                      <i className="fa-solid fa-xmark"></i>
                    </button>
                    {/* Accept Speech Button */}
                    <button
                      type="button"
                      onClick={handleAcceptSpeech}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center transition-colors font-bold text-sm"
                      title="Accept recording"
                    >
                      <i className="fa-solid fa-check"></i>
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleImageClick}
                  disabled={isAiThinking || isListening}
                  className="bg-fuchsia-600 hover:bg-fuchsia-500 text-white px-5 py-3 rounded-xl disabled:opacity-40 font-medium transition-colors"
                >
                  Image
                </button>

                <button
                  type="submit"
                  disabled={isAiThinking || isListening}
                  className="bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 hover:brightness-110 text-white w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all"
                >
                  <i className="fa-solid fa-paper-plane"></i>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes glowPulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.015); }
        }
        .animate-glow {
          animation: glowPulse 3.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}