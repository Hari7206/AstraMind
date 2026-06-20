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
    <div className="flex h-screen">

      <div className={`bg-slate-900 text-white transition-all ${sidebarOpen ? "w-72" : "w-20"} flex flex-col`}>
        <div className="p-4 flex justify-between items-center">
          {sidebarOpen && <span>AstraMind</span>}
          <button type="button" onClick={() => setSidebarOpen((p) => !p)}>
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        <div className="p-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors"
          >
            {sidebarOpen ? "New Chat" : "+"}
          </button>
          
          <button
            type="button"
            onClick={() => navigate("/gallery")}
            className="w-full bg-purple-600 hover:bg-purple-700 py-2 rounded-lg transition-colors"
          >
            {sidebarOpen ? "Gallery" : "🖼"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4">
          {sidebarOpen && (
            <h2 className="text-slate-400 text-sm uppercase mb-3">Chats</h2>
          )}

          <div className="space-y-2">
            {chatList.map((chat) => (
              <button
                key={chat.id}
                type="button"
                onClick={() => handleSelectChat(chat.id)}
                className={`w-full text-left p-3 rounded-lg ${currentChatId === chat.id ? "bg-slate-800" : "hover:bg-slate-800"
                  }`}
              >
                {sidebarOpen ? chat.title || chat.id : <i className="fa-solid fa-message"></i>}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-slate-100">

        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-lg text-slate-800">
              {activeChat?.title || "New Chat"}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold bg-slate-200 text-slate-700 px-2.5 py-1 rounded-md uppercase tracking-wider">
              Selected: {selectedModel}
            </span>

            <select
              value={selectedModel}
              onChange={(e) => dispatch(setModel(e.target.value))}
              className="bg-slate-100 border border-slate-200 text-black text-sm px-3 py-1 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            >
              <option value="mistral">Mistral</option>
              <option value="groq">Groq (LLaMA 3)</option>
            </select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeChat?.messages?.map((msg, index) => (
            <div
              key={index}
              className={`flex flex-col group ${msg.role === "user" ? "items-end" : "items-start"}`}
            >
              {msg.role === "ai" && (
                <div className="text-xs font-medium text-gray-500 mb-1 ml-2 flex items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                  AI • <span className="capitalize font-semibold text-slate-700">{msg.model || "mistral"}</span>
                </div>
              )}

              <div
                className={`max-w-2xl px-5 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border shadow-sm text-slate-800"
                }`}
              >
                {(!msg.messageType || msg.messageType === "text") && (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}

                {msg.messageType === "image" && (
                  <div className="flex flex-col gap-2 p-1">
                    <img
                      src={msg.fileUrl}
                      alt={msg.content}
                      className="max-w-xs sm:max-w-md rounded-xl shadow-sm border border-slate-200"
                      loading="lazy"
                    />
                    <p className="text-xs text-slate-400 italic mt-1">
                      {msg.content}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-1 flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                {(!msg.messageType || msg.messageType === "text") && (
                  <button
                    type="button"
                    onClick={() => handleToggleSpeech(msg.content, index)}
                    className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors bg-transparent border-none cursor-pointer"
                    title={
                      speechState.index === index && speechState.status === "playing"
                        ? "Pause"
                        : "Read aloud"
                    }
                  >
                    {speechState.index === index && speechState.status === "playing" ? (
                      <i className="fa-solid fa-square text-xs text-slate-400"></i>
                    ) : speechState.index === index && speechState.status === "paused" ? (
                      <i className="ri-volume-up-line text-base text-blue-500 animate-pulse"></i>
                    ) : (
                      <i className="ri-volume-up-line text-base"></i>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleCopyText(msg.content, index)}
                  className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-md transition-colors bg-transparent border-none cursor-pointer"
                  title="Copy"
                >
                  {copiedMessageIndex === index ? (
                    <i className="fa-solid fa-check text-emerald-500 text-sm"></i>
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
              <div className="bg-white border px-4 py-2 rounded-xl text-gray-500 animate-pulse text-sm">
                AI is generating response...
              </div>
            </div>
          )}
        </div>

        <div className="bg-white border-t p-4">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
            <div className="flex items-center bg-slate-100 rounded-2xl p-2 gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-transparent outline-none px-3 py-3 text-slate-800"
                placeholder="Ask AstraMind anything..."
              />

              <button
                type="button"
                onClick={handleImageClick}
                disabled={isAiThinking}
                className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl disabled:opacity-50 font-medium transition-colors"
              >
                Image
              </button>

              <button
                type="submit"
                disabled={isAiThinking}
                className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors"
              >
                <i className="fa-solid fa-paper-plane"></i>
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}