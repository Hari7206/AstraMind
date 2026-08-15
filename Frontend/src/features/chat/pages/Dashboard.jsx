import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import React from "react";
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

import Sidebar from "../component/Sidebar.jsx";
import ChatInputBar from "../component/ChatInputBar.jsx";
import { useMessageHandling } from "../hooks/useMessageHandling";

// Memoized Markdown Components
const markdownComponents = {
  code({ inline, className, children, ...props }) {
    if (inline) {
      return (
        <code
          className="bg-white/10 text-orange-300 px-2 py-0.5 rounded text-[0.9em]"
          {...props}
        >
          {children}
        </code>
      );
    }
    return (
      <pre className="bg-[#0d0d12] border border-white/10 rounded-xl p-6 overflow-x-auto my-4">
        <code className={`${className || ""} text-slate-200 text-lg leading-relaxed`} {...props}>
          {children}
        </code>
      </pre>
    );
  },
};

// Memoized Message Component
const MessageItem = React.memo(({ message, index, onToggleSpeech, onCopyText, speechState, copiedMessageIndex }) => {
  const isUser = message.role === "user";
  
  return (
    <div className={`flex flex-col group ${isUser ? "items-end" : "items-start"}`}>
      {!isUser && (
        <div className="text-base font-medium text-slate-500 mb-2 ml-1 flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_12px_4px] shadow-orange-400/30"></span>
          AI • <span className="capitalize text-slate-400">{message.model || "mistral"}</span>
        </div>
      )}

      <div className={
        isUser
          ? "max-w-[80%] px-3 py-2 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/20"
          : "w-full px-4 py-3 text-slate-100"
      }>
        {(!message.messageType || message.messageType === "text") && (
          <div className="prose prose-invert max-w-none prose-2xl leading-relaxed tracking-wide">
            <ReactMarkdown components={markdownComponents}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {message.messageType === "image" && (
          <div className="flex flex-col gap-3">
            <img
              src={message.fileUrl}
              alt={message.content}
              className="max-w-xs sm:max-w-md rounded-xl shadow-lg shadow-black/40"
              loading="lazy"
            />
            <p className="text-base text-slate-400">{message.content}</p>
          </div>
        )}

        {message.messageType === "document" && (
          <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
            <i className="fa-solid fa-file-pdf text-3xl text-orange-400"></i>
            <div>
              <p className="text-base font-medium">{message.content}</p>
              {message.fileUrl && (
                <a
                  href={message.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-base text-orange-400 hover:underline"
                >
                  View Document
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center gap-2 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {(!message.messageType || message.messageType === "text") && (
          <button
            type="button"
            onClick={() => onToggleSpeech(message.content, index)}
            className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 rounded-md transition-colors bg-transparent border-none cursor-pointer"
          >
            {speechState.index === index && speechState.status === "playing" ? (
              <i className="fa-solid fa-square text-sm text-slate-400"></i>
            ) : speechState.index === index && speechState.status === "paused" ? (
              <i className="ri-volume-up-line text-lg text-orange-400 animate-pulse"></i>
            ) : (
              <i className="ri-volume-up-line text-lg"></i>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={() => onCopyText(message.content, index)}
          className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-slate-200 hover:bg-white/10 rounded-md transition-colors bg-transparent border-none cursor-pointer"
        >
          {copiedMessageIndex === index ? (
            <i className="fa-solid fa-check text-orange-400 text-base"></i>
          ) : (
            <i className="fa-regular fa-copy text-base"></i>
          )}
        </button>
      </div>
    </div>
  );
});

// Skeleton Loading Component
const ChatSkeleton = () => (
  <div className="flex-1 overflow-y-auto px-4 pt-20">
    <div className="max-w-3xl mx-auto py-6 space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'items-end' : 'items-start'}`}>
          <div className={`max-w-[80%] rounded-2xl p-4 ${
            i % 2 === 0 
              ? 'bg-gradient-to-br from-orange-500/50 to-orange-600/50' 
              : 'bg-white/5'
          } animate-pulse`}>
            <div className="h-4 bg-white/20 rounded w-32"></div>
            <div className="space-y-2 mt-2">
              <div className="h-3 bg-white/20 rounded w-48"></div>
              <div className="h-3 bg-white/20 rounded w-40"></div>
              <div className="h-3 bg-white/20 rounded w-36"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Smooth Loading Spinner Component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex h-screen bg-black text-white items-center justify-center">
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-full bg-gradient-to-br from-orange-400 to-orange-600"
            style={{
              animation: `dotPulse 1.4s ease-in-out ${i * 0.2}s infinite`
            }}
          />
        ))}
      </div>
      <span className="text-slate-400 text-lg animate-pulse">{message}</span>
    </div>
  </div>
);

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Redux Selectors
  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isAiThinking = useSelector((state) => state.chat.isAiThinking);
  const selectedModel = useSelector((state) => state.chat.selectedModel || "mistral");
  const user = useSelector((state) => state.auth.user);
  const [isUserLoading, setIsUserLoading] = useState(true);

  // Hooks
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
    handleSearchJobs,
    handleLogout, // NEW: Import logout handler
  } = useChats();

  // Local State
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [plan, setPlanState] = useState("free");
  const [searchesUsed, setSearchesUsed] = useState(0);
  const [searchesLimit, setSearchesLimit] = useState(2);
  const [showUpgradeCard, setShowUpgradeCard] = useState(false);
  const [typingMessage, setTypingMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [pendingUserMessage, setPendingUserMessage] = useState(null);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [isNewChat, setIsNewChat] = useState(true);
  const [isLoadingChat, setIsLoadingChat] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false); // NEW: Logout confirm state

  // Refs
  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const loadTimeoutRef = useRef(null);

  const {
    message,
    setMessage,
    isListening,
    selectedMode,
    setSelectedMode,
    isPlusMenuOpen,
    setIsPlusMenuOpen,
    isUploading,
    uploadProgress,
    copiedMessageIndex,
    speechState,
    fileInputRef,
    plusMenuRef,
    startListening,
    handleCancelSpeech,
    handleAcceptSpeech,
    handleCopyText,
    handleToggleSpeech,
    handleModeSelect,
    handleFileUpload: handleFileUploadHook,
  } = useMessageHandling();

  // Memoized values
  const activeChat = useMemo(() => currentChatId ? chats[currentChatId] : null, [chats, currentChatId]);
  const hasMessages = useMemo(() => activeChat?.messages?.length > 0, [activeChat]);
  const showChatView = useMemo(() => hasMessages || !!pendingUserMessage, [hasMessages, pendingUserMessage]);
  const chatList = useMemo(() => Object.values(chats).sort(
    (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
  ), [chats]);

  // CSS Animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes dotPulse {
        0%, 100% {
          transform: scale(0.5);
          opacity: 0.3;
        }
        50% {
          transform: scale(1);
          opacity: 1;
        }
      }
      .scrollbar-hide::-webkit-scrollbar {
        display: none;
      }
      .scrollbar-hide {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Type message effect
  const typeMessage = useCallback(async (text) => {
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
  }, [isUserScrolling]);

  // Scroll handlers
  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      setIsUserScrolling(!isNearBottom);
      if (isNearBottom) {
        setShouldScrollToBottom(false);
      }
    }
  }, []);

  // Scroll to bottom effect
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
  }, [isAiThinking, isUserScrolling]);

  // Load initial data in parallel
  useEffect(() => {
    const loadInitialData = async () => {
      setIsUserLoading(true);
      try {
        const [chatsData, subscriptionData] = await Promise.all([
          handleGetChats(),
          getSubscription()
        ]);

        if (subscriptionData) {
          setPlanState(subscriptionData.plan);
          setSearchesUsed(subscriptionData.searchesUsed || 0);
          setSearchesLimit(subscriptionData.limit === "Unlimited" ? Infinity : subscriptionData.limit);
          dispatch(setPlan(subscriptionData.plan));
          if (subscriptionData.plan === "free" && subscriptionData.searchesUsed >= 2) {
            setShowUpgradeCard(true);
          }
        }

        setInitialLoadComplete(true);
      } catch (error) {
        console.error("Failed to load initial data:", error);
        if (loadTimeoutRef.current) {
          clearTimeout(loadTimeoutRef.current);
        }
        loadTimeoutRef.current = setTimeout(loadInitialData, 3000);
      } finally {
        setIsUserLoading(false);
      }
    };

    loadInitialData();

    return () => {
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, [dispatch, handleGetChats]);

  // Update new chat status
  useEffect(() => {
    if (!activeChat?.messages || activeChat.messages.length === 0) {
      setIsNewChat(true);
    } else {
      setIsNewChat(false);
    }
  }, [activeChat]);

  // User loading state
  useEffect(() => {
    if (user && (user.username || user.email)) {
      setIsUserLoading(false);
    }
  }, [user]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, [currentChatId]);

  // Socket connection
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

  // Handlers
  const handleNewChat = useCallback(() => {
    dispatch(setCurrentChatId(null));
    setMessage("");
    setSelectedMode(null);
    setIsPlusMenuOpen(false);
    setIsNewChat(true);
    setIsLoadingChat(false);
    setShowSkeleton(false);
  }, [dispatch, setMessage, setSelectedMode, setIsPlusMenuOpen]);

  const handleSelectChat = useCallback(async (chatId) => {
    setIsLoadingChat(true);
    setShowSkeleton(true);
    
    try {
      dispatch(setCurrentChatId(chatId));
      
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout loading messages')), 10000)
      );
      
      const messagesPromise = handleGetMessages(chatId);
      await Promise.race([messagesPromise, timeoutPromise]);
      
      setIsPlusMenuOpen(false);
      setIsNewChat(false);
    } catch (error) {
      console.error("Failed to load chat:", error);
      setShowSkeleton(false);
    } finally {
      setIsLoadingChat(false);
      setShowSkeleton(false);
    }
  }, [dispatch, handleGetMessages, setIsPlusMenuOpen]);


  const handleLogoutClick = useCallback(async () => {
    try {
      await handleLogout();

      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);

      alert("Failed to logout. Please try again.");
    } finally {
      setShowLogoutConfirm(false);
    }
  }, [handleLogout, navigate]);

  const handleImageClick = useCallback(async () => {
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
          await handleGetChats();
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
  }, [message, currentChatId, dispatch, generateImageFromApi, handleGetChats, handleGetMessages, setMessage]);

  const handleAgentAction = useCallback(async (action, data) => {
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
        case 'webSearch': {
          const searchResult = await handleWebSearch(userMessage);
          displayMessage = typeof searchResult === 'string' 
            ? searchResult 
            : searchResult?.summary || searchResult?.message || JSON.stringify(searchResult);
          break;
        }
        case 'jobSearch': {
          const jobResult = await handleSearchJobs(userMessage);
          displayMessage = typeof jobResult === 'string'
            ? jobResult
            : jobResult?.message || jobResult?.summary || JSON.stringify(jobResult);
          break;
        }
        case 'generateEmail': {
          const emailResult = await handleGenerateEmail(userMessage);
          displayMessage = typeof emailResult === 'string'
            ? emailResult
            : emailResult?.email?.body || emailResult?.message || JSON.stringify(emailResult);
          break;
        }
        case 'youtubeSummarize': {
          const youtubeResult = await handleSummarizeYouTube(userMessage);
          displayMessage = typeof youtubeResult === 'string'
            ? youtubeResult
            : youtubeResult?.summary || youtubeResult?.message || JSON.stringify(youtubeResult);
          break;
        }
        case 'saveBookmark': {
          const bookmarkResult = await handleSaveBookmark(userMessage);
          if (bookmarkResult.success) {
            displayMessage = bookmarkResult.message;
          } else {
            displayMessage = bookmarkResult.message || "Failed to save bookmark. Please use format: Title, URL (e.g., Google, https://google.com)";
          }
          break;
        }
        default:
          throw new Error('Unknown action');
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
        const newChatId = Date.now().toString();
        dispatch(createNewChat({
          chatId: newChatId,
          title: userMessage.slice(0, 30) + (userMessage.length > 30 ? "..." : "")
        }));
        dispatch(setCurrentChatId(newChatId));

        dispatch(addNewMessage({
          chatId: newChatId,
          content: userMessage,
          role: "user",
          messageType: "text"
        }));
        dispatch(addNewMessage({
          chatId: newChatId,
          content: displayMessage,
          role: "ai",
          messageType: "text"
        }));
        await handleGetChats();
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
  }, [currentChatId, dispatch, handleWebSearch, handleSearchJobs, handleGenerateEmail, handleSummarizeYouTube, handleSaveBookmark, setSelectedMode, setMessage, typeMessage, handleGetChats]);

  const handleSubmit = useCallback(async (e) => {
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
    } else {
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
  }, [message, selectedMode, currentChatId, chats, dispatch, setMessage, handleAgentAction, handleChatWithDocument, handleSendMessage]);

  const handleFileUpload = useCallback(async (file) => {
    await handleUploadDocument(file, currentChatId);
  }, [handleUploadDocument, currentChatId]);

  const getModePlaceholder = useCallback(() => {
    const modes = {
      'webSearch': 'Enter your search query...',
      'jobSearch': 'Enter job title and location (e.g., React Developer, Bangalore)',
      'email': 'Enter recipient and topic (e.g., john@email.com, project update)',
      'youtube': 'Enter YouTube URL...',
      'bookmark': 'Enter title and URL (e.g., Google, https://google.com)',
      'upload': 'Select a file to upload'
    };
    return modes[selectedMode] || "Ask anything...";
  }, [selectedMode]);

  // Loading States
  if (isUserLoading || !initialLoadComplete) {
    return <LoadingSpinner message="Setting up your workspace..." />;
  }

  return (
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        chatList={chatList}
        currentChatId={currentChatId}
        handleNewChat={handleNewChat}
        handleSelectChat={handleSelectChat}
        user={user}
        plan={plan}
        searchesUsed={searchesUsed}
        searchesLimit={searchesLimit}
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen bg-black relative overflow-hidden">
        {!showChatView && !isLoadingChat && !showSkeleton && (
          <div
            className="pointer-events-none absolute inset-0 z-0 blur-3xl"
            aria-hidden="true"
            style={{
              background: `
                radial-gradient(ellipse 70% 60% at 50% 30%, rgba(249,115,22,0.3) 0%, rgba(249,115,22,0.1) 50%, transparent 80%),
                radial-gradient(ellipse 50% 50% at 50% 50%, rgba(249,115,22,0.15) 0%, transparent 70%)
              `,
            }}
          />
        )}

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-20 px-6 py-4 flex items-center justify-between bg-black/30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-xl text-white">
              {activeChat?.title || "New Chat"}
            </h2>
            {activeChat?.documentId && (
              <span className="text-sm bg-orange-500/15 text-orange-400 px-3 py-1 rounded-full">
                Document
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* User Name Display */}
            <span className="text-sm text-slate-300 bg-white/[0.06] px-3 py-1.5 rounded-lg">
              👤 {user?.username || "User"}
            </span>

            <span
              className={`text-sm px-3 py-1.5 rounded-full font-medium tracking-wide ${plan === 'pro'
                ? 'bg-orange-500/15 text-orange-400'
                : 'bg-white/[0.06] text-slate-400'
              }`}
            >
              {plan === 'pro' ? 'PRO' : 'FREE'}
            </span>

            {plan === 'free' && (
              <span className="text-sm text-slate-400 bg-white/[0.06] px-3 py-1.5 rounded-full font-medium tabular-nums">
                {searchesUsed}/{searchesLimit} searches today
              </span>
            )}

            {plan === 'free' && (
              <button
                onClick={() => navigate("/pricing")}
                className="text-sm px-3.5 py-1.5 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium hover:brightness-110 transition-all"
              >
                Upgrade
              </button>
            )}

            <span className="text-sm font-medium text-slate-400 bg-white/[0.06] px-3 py-1.5 rounded-lg">
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

            {/* Logout Button */}
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="text-sm px-3.5 py-1.5 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all font-medium"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
            <div className="bg-[#0a0a0f] border border-white/10 rounded-2xl p-8 max-w-md w-full">
              <h3 className="text-xl font-semibold text-white mb-2">Confirm Logout</h3>
              <p className="text-slate-400 mb-6">Are you sure you want to logout from AstraMind?</p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-6 py-2 rounded-xl bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="px-6 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {isLoadingChat || showSkeleton ? (
          <ChatSkeleton />
        ) : showChatView ? (
          <>
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto px-4 pt-20 scrollbar-hide"
            >
              <div className="max-w-3xl mx-auto py-6 space-y-6">
                {!currentChatId && pendingUserMessage && (
                  <div className="flex flex-col items-end">
                    <div className="max-w-[80%] px-3 py-2 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/20">
                      <p className="text-2xl leading-loose tracking-wide">{pendingUserMessage}</p>
                    </div>
                  </div>
                )}

                {activeChat?.messages?.map((msg, index) => (
                  <MessageItem
                    key={msg.id || index}
                    message={msg}
                    index={index}
                    onToggleSpeech={handleToggleSpeech}
                    onCopyText={handleCopyText}
                    speechState={speechState}
                    copiedMessageIndex={copiedMessageIndex}
                  />
                ))}

                <div ref={chatEndRef} />

                {isTyping && typingMessage && (
                  <div className="flex justify-start">
                    <div className="w-full px-4 py-3 text-slate-100">
                      <div className="prose prose-invert max-w-none prose-2xl leading-relaxed tracking-wide">
                        <ReactMarkdown components={markdownComponents}>
                          {typingMessage}
                        </ReactMarkdown>
                      </div>
                      <div className="flex gap-1.5 mt-2">
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"></span>
                      </div>
                    </div>
                  </div>
                )}

                {isUploading && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] backdrop-blur-sm px-6 py-4 rounded-xl text-slate-400 text-base flex flex-col gap-3 min-w-[200px] border border-white/5">
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-spinner fa-spin text-orange-400 text-lg"></i>
                        <span>Uploading...</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <span className="text-sm text-slate-500">{uploadProgress}%</span>
                    </div>
                  </div>
                )}

                {isAiThinking && !isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white/[0.04] backdrop-blur-sm px-5 py-3 rounded-xl text-slate-400 text-base flex items-center gap-3 border border-white/5">
                      <span className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-2 h-2 rounded-full bg-orange-400 animate-bounce"></span>
                      </span>
                      Thinking...
                    </div>
                  </div>
                )}

                {showUpgradeCard && plan === 'free' && (
                  <div className="max-w-3xl mx-auto mt-6 p-8 bg-white/[0.03] border border-white/5 rounded-2xl">
                    <div className="text-center">
                      <h3 className="text-xl font-semibold text-white">You've used all free searches</h3>
                      <p className="text-slate-400 text-base mt-2">
                        Upgrade to Pro for unlimited job searches
                      </p>
                      <p className="text-orange-400 font-medium text-base mt-2">
                        ₹50/month
                      </p>
                      <div className="mt-6 flex items-center justify-center gap-4">
                        <button
                          onClick={() => navigate("/pricing")}
                          className="px-8 py-3 rounded-xl font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:brightness-110 transition-all shadow-lg shadow-orange-500/30"
                        >
                          Upgrade Now
                        </button>
                        <button
                          onClick={() => setShowUpgradeCard(false)}
                          className="px-6 py-3 rounded-xl font-medium text-slate-400 hover:text-white transition-all"
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
              <ChatInputBar
                message={message}
                setMessage={setMessage}
                handleSubmit={handleSubmit}
                fileInputRef={fileInputRef}
                handleFileUpload={(e) => handleFileUploadHook(e, handleFileUpload)}
                plusMenuRef={plusMenuRef}
                isPlusMenuOpen={isPlusMenuOpen}
                setIsPlusMenuOpen={setIsPlusMenuOpen}
                selectedMode={selectedMode}
                setSelectedMode={setSelectedMode}
                handleModeSelect={handleModeSelect}
                getModePlaceholder={getModePlaceholder}
                isListening={isListening}
                startListening={startListening}
                handleCancelSpeech={handleCancelSpeech}
                handleAcceptSpeech={handleAcceptSpeech}
                handleImageClick={handleImageClick}
                isAiThinking={isAiThinking}
                isUploading={isUploading}
                isNewChat={isNewChat && !activeChat?.messages?.length}
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-4 relative z-10">
            <div className="w-full max-w-3xl -mt-8">
              <h1 className="text-3xl font-semibold text-white text-center mb-8">
                What can I help you with?
              </h1>
              <ChatInputBar
                message={message}
                setMessage={setMessage}
                handleSubmit={handleSubmit}
                fileInputRef={fileInputRef}
                handleFileUpload={(e) => handleFileUploadHook(e, handleFileUpload)}
                plusMenuRef={plusMenuRef}
                isPlusMenuOpen={isPlusMenuOpen}
                setIsPlusMenuOpen={setIsPlusMenuOpen}
                selectedMode={selectedMode}
                setSelectedMode={setSelectedMode}
                handleModeSelect={handleModeSelect}
                getModePlaceholder={getModePlaceholder}
                isListening={isListening}
                startListening={startListening}
                handleCancelSpeech={handleCancelSpeech}
                handleAcceptSpeech={handleAcceptSpeech}
                handleImageClick={handleImageClick}
                isAiThinking={isAiThinking}
                isUploading={isUploading}
              />
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