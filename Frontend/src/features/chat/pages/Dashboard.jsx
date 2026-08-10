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

import Sidebar from "../component/Sidebar.jsx";
import ChatInputBar from "../component/ChatInputBar.jsx";
import { useMessageHandling } from "../hooks/useMessageHandling";

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

export default function Home() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isAiThinking = useSelector((state) => state.chat.isAiThinking);
  const selectedModel = useSelector((state) => state.chat.selectedModel || "mistral");
  const user = useSelector((state) => state.auth.user);
  const [isUserLoading, setIsUserLoading] = useState(true);

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

  const chatEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

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

  const activeChat = currentChatId ? chats[currentChatId] : null;
  const hasMessages = activeChat?.messages?.length > 0;
  const showChatView = hasMessages || !!pendingUserMessage;

  const handleNewChat = () => {
    dispatch(setCurrentChatId(null));
    setMessage("");
    setSelectedMode(null);
    setIsPlusMenuOpen(false);
    setIsNewChat(true);
    setIsLoadingChat(false);
  };

  const handleSelectChat = async (chatId) => {
    setIsLoadingChat(true);
    dispatch(setCurrentChatId(chatId));
    await handleGetMessages(chatId);
    setIsPlusMenuOpen(false);
    setIsNewChat(false);
    setIsLoadingChat(false);
  };

  useEffect(() => {
    if (!activeChat?.messages || activeChat.messages.length === 0) {
      setIsNewChat(true);
    } else {
      setIsNewChat(false);
    }
  }, [activeChat]);

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

  useEffect(() => {
    if (user && (user.username || user.email)) {
      setIsUserLoading(false);
    }
  }, [user]);

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
      case 'webSearch': {
        const searchResult = await handleWebSearch(userMessage);
        // Extract the summary string from the response
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
  };

  const handleFileUpload = async (file) => {
    await handleUploadDocument(file, currentChatId);
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

  const chatList = Object.values(chats).sort(
    (a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated)
  );

  if (isUserLoading) {
    return (
      <div className="flex h-screen bg-black text-white items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
          <span className="text-slate-400 text-lg">Loading...</span>
        </div>
      </div>
    );
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
        {!showChatView && !isLoadingChat && (
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
          </div>
        </div>

        {isLoadingChat ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 border-3 border-orange-500/30 border-t-orange-500 rounded-full animate-spin"></div>
              <span className="text-slate-400 text-base">Loading chat...</span>
            </div>
          </div>
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
                  <div
                    key={index}
                    className={`flex flex-col group ${msg.role === "user" ? "items-end" : "items-start"}`}
                  >
                    {msg.role === "ai" && (
                      <div className="text-base font-medium text-slate-500 mb-2 ml-1 flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_12px_4px] shadow-orange-400/30"></span>
                        AI • <span className="capitalize text-slate-400">{msg.model || "mistral"}</span>
                      </div>
                    )}

                    <div
                      className={
                        msg.role === "user"
                          ? "max-w-[80%] px-3 py-2 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl shadow-orange-500/20"
                          : "w-full px-4 py-3 text-slate-100"
                      }
                    >
                      {(!msg.messageType || msg.messageType === "text") && (
                        <div className="prose prose-invert max-w-none prose-2xl leading-relaxed tracking-wide">
                          <ReactMarkdown components={markdownComponents}>
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )}

                      {msg.messageType === "image" && (
                        <div className="flex flex-col gap-3">
                          <img
                            src={msg.fileUrl}
                            alt={msg.content}
                            className="max-w-xs sm:max-w-md rounded-xl shadow-lg shadow-black/40"
                            loading="lazy"
                          />
                          <p className="text-base text-slate-400">{msg.content}</p>
                        </div>
                      )}

                      {msg.messageType === "document" && (
                        <div className="flex items-center gap-4 p-3 bg-white/5 rounded-lg">
                          <i className="fa-solid fa-file-pdf text-3xl text-orange-400"></i>
                          <div>
                            <p className="text-base font-medium">{msg.content}</p>
                            {msg.fileUrl && (
                              <a
                                href={msg.fileUrl}
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
                      {(!msg.messageType || msg.messageType === "text") && (
                        <button
                          type="button"
                          onClick={() => handleToggleSpeech(msg.content, index)}
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
                        onClick={() => handleCopyText(msg.content, index)}
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