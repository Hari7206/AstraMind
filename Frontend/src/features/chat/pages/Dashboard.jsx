import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
// dashbaord
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
  const user = useSelector((state) => state.auth.user);

  const {
    handleSendMessage,
    handleGetChats,
    handleGetMessages,
    handleGenerateImage: generateImageFromApi,
    handleUploadDocument,
    handleChatWithDocument,
    handleWebSearch,
    handleGenerateEmail,
    handleSummarizeYouTube,
    handleSaveBookmark
  } = useChats();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");
  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);
  const [speechState, setSpeechState] = useState({ index: null, status: "stopped" });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);

  const recognitionRef = useRef(null);
  const baseMessageRef = useRef("");
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const plusMenuRef = useRef(null);

  const activeChat = currentChatId ? chats[currentChatId] : null;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (plusMenuRef.current && !plusMenuRef.current.contains(event.target)) {
        setIsPlusMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    handleGetChats();
  }, [handleGetChats]);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setIsUserScrolling(!isNearBottom);
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container && !isUserScrolling) {
      container.scrollTop = container.scrollHeight;
    }
  }, [activeChat?.messages, isUserScrolling]);

  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentChatId]);

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

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
      setMessage(baseMessageRef.current + interimTranscript);
    };

    recognition.onerror = () => stopListening();
    recognition.onend = () => setIsListening(false);

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) return;
    baseMessageRef.current = message ? message + " " : "";
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
    setMessage(baseMessageRef.current.trim());
  };

  const handleAcceptSpeech = () => stopListening();

  const handleNewChat = () => {
    dispatch(setCurrentChatId(null));
    setMessage("");
    setSelectedMode(null);
    setIsPlusMenuOpen(false);
  };

  const handleSelectChat = async (chatId) => {
    dispatch(setCurrentChatId(chatId));
    await handleGetMessages(chatId);
    setIsPlusMenuOpen(false);
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

    utterance.onend = () => setSpeechState({ index: null, status: "stopped" });
    utterance.onerror = () => setSpeechState({ index: null, status: "stopped" });

    setSpeechState({ index, status: "playing" });
    synth.speak(utterance);
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setIsPlusMenuOpen(false);
    if (mode === 'upload') {
      fileInputRef.current?.click();
    }
  };

  const handleAgentAction = async (action, data) => {
    setSelectedMode(null);
    dispatch(setAiThinking(true));

    try {
      let result;
      let displayMessage = "";

      switch (action) {
        case 'webSearch':
          result = await handleWebSearch(data);
          displayMessage = `🔍 **Web Search: ${data}**\n\n${result.summary}\n\n**Sources:**\n${result.sources.map((s, i) => `${i+1}. ${s}`).join('\n')}`;
          break;
        case 'generateEmail':
          result = await handleGenerateEmail(data);
          displayMessage = `✉️ **Generated Email**\n\n**Subject:** ${result.email.subject}\n\n${result.email.body}`;
          break;
        case 'youtubeSummarize':
          result = await handleSummarizeYouTube(data);
          displayMessage = `📺 **YouTube Summary**\n\n${result.summary}`;
          break;
        case 'saveBookmark':
          result = await handleSaveBookmark(data);
          displayMessage = `🔖 **Bookmark Saved!**\n\n**Title:** ${result.bookmark.title}\n**URL:** ${result.bookmark.url}`;
          break;
        default:
          return;
      }

      if (currentChatId) {
        dispatch(addNewMessage({
          chatId: currentChatId,
          content: displayMessage,
          role: "ai",
          messageType: "text"
        }));
      }

    } catch (error) {
      console.error("Agent action error:", error);
      dispatch(addNewMessage({
        chatId: currentChatId,
        content: `❌ Error: ${error.message}`,
        role: "ai",
        messageType: "text"
      }));
    } finally {
      dispatch(setAiThinking(false));
      setMessage("");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const allowedTypes = ["pdf", "docx", "txt"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    if (!allowedTypes.includes(fileExtension)) {
      alert("Please upload PDF, DOCX, or TXT files only");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 300);

      const data = await handleUploadDocument(file, currentChatId);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (data.success) {
        setTimeout(() => {
          setIsUploading(false);
          setUploadProgress(0);
        }, 500);
      } else {
        throw new Error(data.message || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert(`Upload failed: ${error.message}`);
      setIsUploading(false);
      setUploadProgress(0);
    }

    setSelectedMode(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

    // If a mode is selected, handle it
    if (selectedMode) {
      const modeMap = {
        'webSearch': 'webSearch',
        'email': 'generateEmail',
        'youtube': 'youtubeSummarize',
        'bookmark': 'saveBookmark'
      };
      
      if (modeMap[selectedMode]) {
        await handleAgentAction(modeMap[selectedMode], trimmedMessage);
        return;
      }
    }

    // Normal chat flow
    const currentChat = chats[currentChatId];
    const hasDocument = currentChat?.documentId;

    if (hasDocument && currentChatId) {
      dispatch(addNewMessage({
        chatId: currentChatId,
        content: trimmedMessage,
        role: "user"
      }));

      setMessage("");
      await handleChatWithDocument(hasDocument, trimmedMessage, currentChatId);
    } else {
      if (currentChatId) {
        dispatch(addNewMessage({
          chatId: currentChatId,
          content: trimmedMessage,
          role: "user"
        }));
      }

      setMessage("");
      await handleSendMessage(trimmedMessage, currentChatId, selectedModel);
    }
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

  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const getModePlaceholder = () => {
  const modes = {
    'webSearch': 'Enter your search query...',
    'email': 'Enter recipient and topic (e.g., john@email.com, project update)',
    'youtube': 'Enter YouTube URL...',
    'bookmark': 'Enter title and URL (e.g., Google, https://google.com)',
    'upload': 'Select a file to upload'
  };
  return modes[selectedMode] || "Ask anything...";
};

  const getModeColor = () => {
    const colors = {
      'webSearch': 'text-blue-400 border-blue-400/30 bg-blue-400/10',
      'email': 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
      'youtube': 'text-red-400 border-red-400/30 bg-red-400/10',
      'bookmark': 'text-purple-400 border-purple-400/30 bg-purple-400/10',
      'upload': 'text-orange-400 border-orange-400/30 bg-orange-400/10'
    };
    return colors[selectedMode] || '';
  };

  return (
    <div className="flex h-screen bg-[#0a0b10] text-slate-100 overflow-hidden">
      <div
        className={`${sidebarOpen ? "w-72" : "w-16"} flex flex-col bg-[#0d0e14] border-r border-white/5 transition-all duration-300 h-screen flex-shrink-0`}
      >
        <div className="p-4 flex justify-between items-center flex-shrink-0">
          {sidebarOpen && (
            <span className="font-semibold text-lg tracking-wide bg-gradient-to-r from-orange-400 via-fuchsia-400 to-blue-400 bg-clip-text text-transparent">
              AstraMind
            </span>
          )}
          <button
            type="button"
            onClick={() => setSidebarOpen((p) => !p)}
            className="text-slate-500 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
          >
            <i className="fa-solid fa-bars text-lg"></i>
          </button>
        </div>

        <div className="px-3 pb-3 flex flex-col gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={handleNewChat}
            className={`w-full py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 shadow-lg shadow-fuchsia-500/20 hover:shadow-fuchsia-500/30 transition-all ${!sidebarOpen && "text-center"}`}
          >
            {sidebarOpen ? "New Chat" : "+"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/gallery")}
            className={`w-full py-2.5 rounded-xl font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-all ${!sidebarOpen && "text-center"}`}
          >
            {sidebarOpen ? "Gallery" : "🖼"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-2 scrollbar-hide">
          {sidebarOpen && (
            <h2 className="text-slate-500 text-xs font-semibold uppercase tracking-wider px-2 mb-2">
              Chats
            </h2>
          )}

          <div className="space-y-1">
            {chatList.map((chat) => {
              const isActive = currentChatId === chat.id;
              return (
                <button
                  key={chat.id}
                  type="button"
                  onClick={() => handleSelectChat(chat.id)}
                  className={`relative w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${isActive ? "bg-white/10 text-white" : "text-slate-400 hover:text-slate-100 hover:bg-white/5"} ${!sidebarOpen && "flex justify-center"}`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-gradient-to-b from-orange-400 via-fuchsia-400 to-blue-400" />
                  )}
                  <span className={isActive ? "pl-2" : "pl-2"}>
                    {sidebarOpen ? (chat.title || chat.id) : <i className="fa-solid fa-message"></i>}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="border-t border-white/5 p-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 flex items-center justify-center text-white font-semibold text-sm">
              {getInitials(user?.username || user?.email || "U")}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-200 truncate">
                  {user?.username || user?.email || "User"}
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {user?.email || ""}
                </p>
              </div>
            )}
            {sidebarOpen && (
              <button
                type="button"
                onClick={() => {
                  document.cookie = "token=; path=/; max-age=0";
                  navigate("/login");
                }}
                className="text-slate-400 hover:text-white transition-colors"
                title="Logout"
              >
                <i className="fa-solid fa-sign-out-alt"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <div className="px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg text-slate-100">
              {activeChat?.title || "New Chat"}
            </h2>
            {activeChat?.documentId && (
              <span className="text-xs bg-fuchsia-500/20 text-fuchsia-400 px-2.5 py-1 rounded-full border border-fuchsia-500/20">
                📄 Document
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium text-slate-400 bg-white/5 px-3 py-1.5 rounded-lg">
              {selectedModel}
            </span>

            <select
              value={selectedModel}
              onChange={(e) => dispatch(setModel(e.target.value))}
              className="bg-white/5 text-slate-200 text-sm px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-fuchsia-500/50 font-medium transition-all"
            >
              <option className="bg-[#0d0e14]" value="mistral">Mistral</option>
              <option className="bg-[#0d0e14]" value="groq">Groq</option>
            </select>
          </div>
        </div>

        <div
          ref={messagesContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-4 scrollbar-hide"
        >
          <div className="max-w-3xl mx-auto py-4 space-y-4">
            {activeChat?.messages?.map((msg, index) => (
              <div
                key={index}
                className={`flex flex-col group ${msg.role === "user" ? "items-end" : "items-start"}`}
              >
                {msg.role === "ai" && (
                  <div className="text-xs font-medium text-slate-500 mb-1 ml-1 flex items-center gap-1.5">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_2px] shadow-emerald-400/30"></span>
                    AI • <span className="capitalize text-slate-400">{msg.model || "mistral"}</span>
                  </div>
                )}

                <div
                  className={`max-w-[80%] px-5 py-3 rounded-2xl ${msg.role === "user" ? "bg-gradient-to-br from-orange-500/90 via-fuchsia-500/90 to-blue-500/90 text-white shadow-xl shadow-fuchsia-500/10" : "bg-white/[0.04] backdrop-blur-sm text-slate-100"}`}
                >
                  {(!msg.messageType || msg.messageType === "text") && (
                    <div className="prose prose-invert max-w-none prose-sm">
                      <ReactMarkdown>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}

                  {msg.messageType === "image" && (
                    <div className="flex flex-col gap-2">
                      <img
                        src={msg.fileUrl}
                        alt={msg.content}
                        className="max-w-xs sm:max-w-md rounded-xl shadow-lg shadow-black/40"
                        loading="lazy"
                      />
                      <p className="text-xs text-slate-400">{msg.content}</p>
                    </div>
                  )}

                  {msg.messageType === "document" && (
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded-lg">
                      <i className="fa-solid fa-file-pdf text-2xl text-fuchsia-400"></i>
                      <div>
                        <p className="text-sm font-medium">{msg.content}</p>
                        {msg.fileUrl && (
                          <a
                            href={msg.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-fuchsia-400 hover:underline"
                          >
                            View Document
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-1 flex items-center gap-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {(!msg.messageType || msg.messageType === "text") && (
                    <button
                      type="button"
                      onClick={() => handleToggleSpeech(msg.content, index)}
                      className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 rounded-md transition-colors bg-transparent border-none cursor-pointer"
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

            {isUploading && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] backdrop-blur-sm px-4 py-3 rounded-xl text-slate-400 text-sm flex flex-col gap-2 min-w-[200px]">
                  <div className="flex items-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin text-fuchsia-400"></i>
                    <span>Uploading...</span>
                  </div>
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{uploadProgress}%</span>
                </div>
              </div>
            )}

            {isAiThinking && (
              <div className="flex justify-start">
                <div className="bg-white/[0.04] backdrop-blur-sm px-4 py-2 rounded-xl text-slate-400 text-sm flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-bounce"></span>
                  </span>
                  Thinking...
                </div>
              </div>
            )}
          </div>
        </div>

 <div className="p-4 flex-shrink-0 relative">
  <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
    <div className="relative">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 via-fuchsia-500/20 to-blue-500/20 rounded-2xl blur-md" />

      <div className="relative flex flex-col bg-[#0d0e14] rounded-2xl p-2 gap-1 ring-1 ring-white/5">
        <div className="flex items-center gap-1">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.txt"
            className="hidden"
          />

          <div ref={plusMenuRef} className="relative flex-shrink-0">
            <button
              type="button"
              onClick={() => setIsPlusMenuOpen(!isPlusMenuOpen)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                isPlusMenuOpen || selectedMode
                  ? 'bg-white/10 text-white' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <i className={`fa-solid ${isPlusMenuOpen || selectedMode ? 'fa-xmark' : 'fa-plus'} text-lg`}></i>
            </button>

            {isPlusMenuOpen && (
              <div className="absolute bottom-full mb-2 left-0 w-56 bg-[#1a1b24] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                <div className="py-2">
                  <button
                    type="button"
                    onClick={() => { handleModeSelect('webSearch'); setIsPlusMenuOpen(false); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <i className="fa-solid fa-earth-africa text-white/60 w-5 text-center"></i>
                    <span className="text-sm text-slate-200">Web Search</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { handleModeSelect('upload'); setIsPlusMenuOpen(false); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <i className="fa-solid fa-upload text-white/60 w-5 text-center"></i>
                    <span className="text-sm text-slate-200">Upload Document</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { handleModeSelect('email'); setIsPlusMenuOpen(false); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <i className="fa-regular fa-envelope text-white/60 w-5 text-center"></i>
                    <span className="text-sm text-slate-200">Generate Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { handleModeSelect('youtube'); setIsPlusMenuOpen(false); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <i className="fa-brands fa-youtube text-white/60 w-5 text-center"></i>
                    <span className="text-sm text-slate-200">YouTube Summarizer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => { handleModeSelect('bookmark'); setIsPlusMenuOpen(false); }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                  >
                    <i className="fa-regular fa-bookmark text-white/60 w-5 text-center"></i>
                    <span className="text-sm text-slate-200">Save Bookmark</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 relative flex items-center">
            {selectedMode && (
              <div className="absolute left-3 flex items-center gap-2 z-10">
                <span className="text-sm font-medium text-white/80">
                  {selectedMode === 'webSearch' && 'Web Search'}
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
              className={`w-full bg-transparent outline-none py-3 text-slate-100 placeholder-slate-500 text-sm ${
                selectedMode ? 'pl-[130px]' : 'pl-3'
              } ${isListening ? "placeholder-red-400" : ""}`}
              placeholder={selectedMode ? `Enter your ${selectedMode === 'webSearch' ? 'search query' : selectedMode === 'email' ? 'email details' : selectedMode === 'youtube' ? 'YouTube URL' : selectedMode === 'bookmark' ? 'bookmark' : 'details'}...` : "Ask anything..."}
            />
          </div>

          {!isListening ? (
            <button
              type="button"
              onClick={startListening}
              className="text-slate-400 hover:text-slate-200 hover:bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
              title="Voice input"
            >
              <i className="fa-solid fa-microphone"></i>
            </button>
          ) : (
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={handleCancelSpeech}
                className="bg-red-500/80 hover:bg-red-500 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-xmark text-sm"></i>
              </button>
              <button
                type="button"
                onClick={handleAcceptSpeech}
                className="bg-emerald-500/80 hover:bg-emerald-500 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
              >
                <i className="fa-solid fa-check text-sm"></i>
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={handleImageClick}
            disabled={isAiThinking || isListening || isUploading}
            className="text-slate-400 hover:text-white px-4 py-2 rounded-xl disabled:opacity-40 transition-colors flex-shrink-0 text-sm font-medium"
          >
            Image
          </button>

          <button
            type="submit"
            disabled={isAiThinking || isListening || isUploading}
            className="bg-gradient-to-r from-orange-500 via-fuchsia-500 to-blue-500 hover:brightness-110 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0"
          >
            <i className="fa-solid fa-arrow-up"></i>
          </button>
        </div>
      </div>
    </div>
  </form>
</div>
      </div>

  <style>{`
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
`}</style>
    </div>
  );
}