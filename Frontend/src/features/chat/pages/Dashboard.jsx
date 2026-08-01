import { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from 'react-markdown';
import {
  setCurrentChatId,
  updateStreamingMessage,
  setAiThinking,
  addNewMessage,
  createNewChat,
  setModel,
  setPlan,
} from "../chat.slice";
import { useChats } from "../hooks/useChats";
import { initializeSocketConnection } from "../service/chat.socket";
import { getSubscription } from "../../payment/service/razorpay.service.js";
import "../style/Home.css";

function ChatInputBar({
  message, setMessage, handleSubmit, fileInputRef, handleFileUpload,
  plusMenuRef, isPlusMenuOpen, setIsPlusMenuOpen, selectedMode, setSelectedMode,
  handleModeSelect, getModePlaceholder, isListening, startListening,
  handleCancelSpeech, handleAcceptSpeech, handleImageClick,
  isAiThinking, isUploading
}) {
  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto w-full">
      <div className="relative">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-2xl blur-md" />

        <div className="relative flex flex-col bg-[#0a0a0f] rounded-2xl p-2 gap-1 ring-1 ring-white/5">
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
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${isPlusMenuOpen || selectedMode ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
              >
                <i className={`fa-solid ${isPlusMenuOpen || selectedMode ? 'fa-xmark' : 'fa-plus'} text-lg`}></i>
              </button>

              {isPlusMenuOpen && (
                <div className="absolute bottom-full mb-2 left-0 w-56 bg-[#0a0a0f] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-50">
                  <div className="py-2">
                    <button
                      type="button"
                      onClick={() => { handleModeSelect('webSearch'); setIsPlusMenuOpen(false); }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <i className="fa-solid fa-earth-africa text-orange-400 w-5 text-center"></i>
                      <span className="text-sm text-slate-200">Web Search</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { handleModeSelect('jobSearch'); setIsPlusMenuOpen(false); }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <i className="fa-solid fa-briefcase text-orange-400 w-5 text-center"></i>
                      <span className="text-sm text-slate-200">Job Search</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { handleModeSelect('upload'); setIsPlusMenuOpen(false); }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <i className="fa-solid fa-upload text-orange-400 w-5 text-center"></i>
                      <span className="text-sm text-slate-200">Upload Document</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { handleModeSelect('email'); setIsPlusMenuOpen(false); }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <i className="fa-regular fa-envelope text-orange-400 w-5 text-center"></i>
                      <span className="text-sm text-slate-200">Generate Email</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { handleModeSelect('youtube'); setIsPlusMenuOpen(false); }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <i className="fa-brands fa-youtube text-orange-400 w-5 text-center"></i>
                      <span className="text-sm text-slate-200">YouTube Summarizer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { handleModeSelect('bookmark'); setIsPlusMenuOpen(false); }}
                      className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
                    >
                      <i className="fa-regular fa-bookmark text-orange-400 w-5 text-center"></i>
                      <span className="text-sm text-slate-200">Save Bookmark</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

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
                className={`w-full bg-transparent outline-none py-3 text-slate-100 placeholder-slate-500 text-sm ${selectedMode ? 'pl-[130px]' : 'pl-3'} ${isListening ? "placeholder-red-400" : ""}`}
                placeholder={getModePlaceholder()}
              />
            </div>

            {!isListening ? (
              <button
                type="button"
                onClick={startListening}
                className="text-slate-400 hover:text-orange-400 hover:bg-white/5 w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0"
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
                  className="bg-orange-500/80 hover:bg-orange-500 text-white w-8 h-8 rounded-lg flex items-center justify-center transition-colors"
                >
                  <i className="fa-solid fa-check text-sm"></i>
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleImageClick}
              disabled={isAiThinking || isListening || isUploading}
              className="text-slate-400 hover:text-orange-400 px-4 py-2 rounded-xl disabled:opacity-40 transition-colors flex-shrink-0 text-sm font-medium"
            >
              Image
            </button>

            <button
              type="submit"
              disabled={isAiThinking || isListening || isUploading}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-110 text-white w-10 h-10 rounded-xl flex items-center justify-center disabled:opacity-40 transition-all flex-shrink-0 shadow-lg shadow-orange-500/30"
            >
              <i className="fa-solid fa-arrow-up"></i>
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

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
    handleSaveBookmark,
    handleSearchJobs
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
  const [plan, setPlanState] = useState("free");
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [searchesLimit, setSearchesLimit] = useState(2);
  const [showUpgradeCard, setShowUpgradeCard] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState(null);

  const recognitionRef = useRef(null);
  const baseMessageRef = useRef("");
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const plusMenuRef = useRef(null);

  const activeChat = currentChatId ? chats[currentChatId] : null;
  const hasMessages = activeChat?.messages?.length > 0;
  const showChatView = hasMessages || !!pendingUserMessage;





  const typeMessage = async (text) => {
    setIsTyping(true);
    setTypingMessage("");

    let currentText = "";
    const chars = text.split("");
    const delay = 8;

    for (let i = 0; i < chars.length; i++) {
      currentText += chars[i];
      setTypingMessage(currentText);
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    setIsTyping(false);
    const container = messagesContainerRef.current;
    if (container && !isUserScrolling) {
      container.scrollTop = container.scrollHeight;
    }
  };

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

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const data = await getSubscription();
        setPlanState(data.plan);
        setSearchesUsed(data.searchesUsed || 0);
        setSearchesLimit(data.limit === "Unlimited" ? Infinity : data.limit);
        dispatch(setPlan(data.plan));
        if (data.plan === "free" && data.searchesUsed >= 2) {
          setShowUpgradeCard(true);
        }
      } catch (error) {
        console.error("Failed to fetch subscription:", error);
      }
    };
    fetchSubscription();
  }, []);

  const handleScroll = () => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setIsUserScrolling(!isNearBottom);
      if (isNearBottom) {
        setShouldScrollToBottom(false);
      }
    }
  };

  useEffect(() => {
    if (activeChat?.messages?.length > 0) {
      setShouldScrollToBottom(true);
    }
  }, [activeChat?.messages?.length]);

  useEffect(() => {
    if (shouldScrollToBottom) {
      const container = messagesContainerRef.current;
      if (container) {
        container.scrollTop = container.scrollHeight;
        setShouldScrollToBottom(false);
      }
    }
  }, [activeChat?.messages, shouldScrollToBottom]);

  useEffect(() => {
    if (isAiThinking) {
      const container = messagesContainerRef.current;
      if (container && !isUserScrolling) {
        setTimeout(() => {
          container.scrollTop = container.scrollHeight;
        }, 50);
      }
    }
  }, [isAiThinking]);

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
    setMessage("");

    const userMessage = data;
    const hasActiveChat = !!currentChatId;

    if (hasActiveChat) {
      dispatch(addNewMessage({
        chatId: currentChatId,
        content: userMessage,
        role: "user",
        messageType: "text"
      }));
      setShouldScrollToBottom(true);
    } else {
      setPendingUserMessage(userMessage);
      setShouldScrollToBottom(true);
    }

    dispatch(setAiThinking(true));

    let displayMessage = "";

    try {
      switch (action) {
        // ...unchanged switch cases...
      }

      dispatch(setAiThinking(false));
      await typeMessage(displayMessage);

      if (hasActiveChat) {
        dispatch(addNewMessage({
          chatId: currentChatId,
          content: displayMessage,
          role: "ai",
          messageType: "text"
        }));
      } else {
        // saveAgentMessages returns the new chat id — use it here
        const saveResult = await handleSaveAgentResult?.(userMessage, displayMessage);
        // (see note below if you don't already have a call like this)
      }

      setIsTyping(false);
      setTypingMessage("");
      setPendingUserMessage(null);

    } catch (error) {
      console.error("Agent action error:", error);
      setIsTyping(false);
      setTypingMessage("");
      setPendingUserMessage(null);
      if (currentChatId) {
        dispatch(addNewMessage({
          chatId: currentChatId,
          content: `Error: ${error.message}`,
          role: "ai",
          messageType: "text"
        }));
      }
    } finally {
      dispatch(setAiThinking(false));
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

    setMessage("");

    if (selectedMode) {
      const modeMap = {
        'webSearch': 'webSearch',
        'jobSearch': 'jobSearch',
        'email': 'generateEmail',
        'youtube': 'youtubeSummarize',
        'bookmark': 'saveBookmark'
      };
      if (modeMap[selectedMode]) {
        await handleAgentAction(modeMap[selectedMode], trimmedMessage);
        return;
      }
    }

    const currentChat = chats[currentChatId];
    const hasDocument = currentChat?.documentId;

    if (currentChatId) {
      // Existing chat — show instantly against the real id
      dispatch(addNewMessage({
        chatId: currentChatId,
        content: trimmedMessage,
        role: "user"
      }));
      setShouldScrollToBottom(true);

      if (hasDocument) {
        await handleChatWithDocument(hasDocument, trimmedMessage, currentChatId);
      } else {
        await handleSendMessage(trimmedMessage, currentChatId, selectedModel);
      }
    } 
   else {
      setPendingUserMessage(trimmedMessage);
      setShouldScrollToBottom(true);
      dispatch(setAiThinking(true));

      try {
        await handleSendMessage(trimmedMessage, null, selectedModel);
      } finally {
        dispatch(setAiThinking(false));
        setPendingUserMessage(null);
      }
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
      'jobSearch': 'Enter job title and location (e.g., React Developer, Bangalore)',
      'email': 'Enter recipient and topic (e.g., john@email.com, project update)',
      'youtube': 'Enter YouTube URL...',
      'bookmark': 'Enter title and URL (e.g., Google, https://google.com)',
      'upload': 'Select a file to upload'
    };
    return modes[selectedMode] || "Ask anything...";
  };

  const inputBarProps = {
    message, setMessage, handleSubmit, fileInputRef, handleFileUpload,
    plusMenuRef, isPlusMenuOpen, setIsPlusMenuOpen, selectedMode, setSelectedMode,
    handleModeSelect, getModePlaceholder, isListening, startListening,
    handleCancelSpeech, handleAcceptSpeech, handleImageClick,
    isAiThinking, isUploading
  };

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <div
        className={`${sidebarOpen ? "w-72" : "w-16"} flex flex-col bg-[#0a0a0f] border-r border-white/5 transition-all duration-300 h-screen flex-shrink-0`}
      >
        <div className="p-4 flex justify-between items-center flex-shrink-0">
          {sidebarOpen && (
            <span className="font-semibold text-lg tracking-wide">
              ASTRA<span className="text-orange-400">MIND</span>
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
            className={`w-full py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all ${!sidebarOpen && "text-center"}`}
          >
            {sidebarOpen ? "New Chat" : "+"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/gallery")}
            className={`w-full py-2.5 rounded-xl font-medium text-slate-300 bg-white/5 hover:bg-white/10 transition-all ${!sidebarOpen && "text-center"}`}
          >
            {sidebarOpen ? "Gallery" : <i className="fa-regular fa-images"></i>}
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
                  className={`relative w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${isActive ? "bg-orange-500/10 text-white border border-orange-500/20" : "text-slate-400 hover:text-slate-100 hover:bg-white/5"} ${!sidebarOpen && "flex justify-center"}`}
                >
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-full bg-orange-500" />
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
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-semibold text-sm">
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

      <div className="flex-1 flex flex-col min-w-0 h-screen bg-black">
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0 bg-black">
          <div className="flex items-center gap-3">
            <h2 className="font-semibold text-lg text-white">
              {activeChat?.title || "New Chat"}
            </h2>
            {activeChat?.documentId && (
              <span className="text-xs bg-orange-500/15 text-orange-400 px-2.5 py-1 rounded-full">
                Document
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`text-xs px-3 py-1.5 rounded-full font-medium tracking-wide ${plan === 'pro'
                ? 'bg-orange-500/15 text-orange-400'
                : 'bg-white/[0.06] text-slate-400'
                }`}
            >
              {plan === 'pro' ? 'PRO' : 'FREE'}
            </span>

            {plan === 'free' && (
              <span className="text-xs text-slate-400 bg-white/[0.06] px-3 py-1.5 rounded-full font-medium tabular-nums">
                {searchesUsed}/{searchesLimit} searches today
              </span>
            )}

            {plan === 'free' && (
              <button
                onClick={() => navigate("/pricing")}
                className="text-xs px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:brightness-110 transition-all"
              >
                Upgrade
              </button>
            )}

            <span className="text-[11px] font-medium text-slate-400 bg-white/[0.06] px-3 py-1.5 rounded-lg">
              {selectedModel}
            </span>

            <select
              value={selectedModel}
              onChange={(e) => dispatch(setModel(e.target.value))}
              className="bg-white/[0.06] text-slate-200 text-sm px-3 py-1.5 rounded-lg outline-none focus:ring-1 focus:ring-orange-500/50 font-medium transition-all"
            >
              <option className="bg-[#0a0a0f]" value="mistral">Mistral</option>
              <option className="bg-[#0a0a0f]" value="groq">Groq</option>
            </select>
          </div>
        </div>

        {showChatView ? (
          <>
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 scrollbar-hide"
            >
              <div className="max-w-3xl mx-auto py-4 space-y-4">
                {!currentChatId && pendingUserMessage && (
                  <div className="flex flex-col items-end">
                    <div className="max-w-[80%] px-5 py-3 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/20">
                      {pendingUserMessage}
                    </div>
                  </div>
                )}

                {activeChat?.messages?.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex flex-col group ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div className="text-xs font-medium text-slate-500 mb-1 ml-1 flex items-center gap-1.5">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_2px] shadow-orange-400/30"></span>
                        AI • <span className="capitalize text-slate-400">{msg.model || "mistral"}</span>
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] px-5 py-3 rounded-2xl ${msg.role === "user" ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/20" : "bg-white/[0.04] backdrop-blur-sm text-slate-100 border border-white/5"}`}
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
                          <i className="fa-solid fa-file-pdf text-2xl text-orange-400"></i>
                          <div>
                            <p className="text-sm font-medium">{msg.content}</p>
                            {msg.fileUrl && (
                              <a
                                href={msg.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-orange-400 hover:underline"
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
                            <i className="ri-volume-up-line text-base text-orange-400 animate-pulse"></i>
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
                          <i className="fa-solid fa-check text-orange-400 text-sm"></i>
                        ) : (
                          <i className="fa-regular fa-copy text-sm"></i>
                        )}
                      </button>
                    </div>
                  </div>
                ))}

                <div ref={chatEndRef} />

                {isTyping && typingMessage && (
                  <div className="flex justify-start">
                    <div className="max-w-[80%] px-5 py-3 rounded-2xl bg-white/[0.04] backdrop-blur-sm text-slate-100 border border-white/5">
                      <div className="prose prose-invert max-w-none prose-sm">
                        <ReactMarkdown>
                          {typingMessage}
                        </ReactMarkdown>
                      </div>
                      <div className="flex gap-1 mt-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] backdrop-blur-sm px-4 py-3 rounded-xl text-slate-400 text-sm flex flex-col gap-2 min-w-[200px] border border-white/5">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-spinner fa-spin text-orange-400"></i>
                        <span>Uploading...</span>
                      </div>
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500">{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {isAiThinking && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] backdrop-blur-sm px-4 py-2 rounded-xl text-slate-400 text-sm flex items-center gap-2 border border-white/5">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce"></span>
                      </span>
                      Thinking...
                    </div>
                  </div>
                )}

                {showUpgradeCard && plan === 'free' && (
                  <div className="max-w-3xl mx-auto mt-4 p-6 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <div className="text-center">
                      <h3 className="text-lg font-semibold text-white">You've used all free searches</h3>
                      <p className="text-slate-400 text-sm mt-1">
                        Upgrade to Pro for unlimited job searches
                      </p>
                      <p className="text-orange-400 font-medium text-sm mt-1">
                        ₹50/month
                      </p>
                      <div className="mt-4 flex items-center justify-center gap-3">
                        <button
                          onClick={() => navigate("/pricing")}
                          className="px-6 py-2.5 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-110 transition-all shadow-lg shadow-orange-500/30"
                        >
                          Upgrade Now
                        </button>
                        <button
                          onClick={() => setShowUpgradeCard(false)}
                          className="px-4 py-2.5 rounded-xl font-medium text-slate-400 hover:text-white transition-all"
                        >
                          Maybe Later
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 flex-shrink-0 relative">
              <ChatInputBar {...inputBarProps} />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-3xl -mt-16">
              <h1 className="text-3xl font-semibold text-white text-center mb-8">
                What can I help you with?
              </h1>
              <ChatInputBar {...inputBarProps} />
            </div>
          </div>
        )}
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