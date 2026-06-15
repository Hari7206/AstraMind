import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
// --- UPDATED: IMPORTED addNewMessage HERE ---
import { setCurrentChatId, updateStreamingMessage, setAiThinking, addNewMessage } from "../chat.slice";
import { useChats } from "../hooks/useChats";
import { initializeSocketConnection } from "../service/chat.socket";

export default function Home() {
  const dispatch = useDispatch();

  const chats = useSelector((state) => state.chat.chats);
  const currentChatId = useSelector((state) => state.chat.currentChatId);
  const isAiThinking = useSelector((state) => state.chat.isAiThinking);

  const { handleSendMessage, handleGetChats, handleGetMessages } = useChats();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [message, setMessage] = useState("");

  const activeChat = currentChatId ? chats[currentChatId] : null;

  // Fetch all chats on initial mount
  useEffect(() => {
    handleGetChats();
  }, [handleGetChats]);

  const handleNewChat = () => {
    dispatch(setCurrentChatId(null));
    setMessage("");
  };

  const handleSelectChat = async (chatId) => {
    dispatch(setCurrentChatId(chatId));
    await handleGetMessages(chatId);
  };

  // --- UPDATED FOR OPTIMISTIC RENDERING ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    // 1. If it's an existing chat, dispatch the user message INSTANTLY so it shows up smoothly
    if (currentChatId) {
      dispatch(addNewMessage({
        chatId: currentChatId,
        content: trimmedMessage,
        role: "user"
      }));
    }

    // Clear input field immediately for a snappy feel
    setMessage("");

    // 2. Fire off the backend request in the background
    await handleSendMessage(trimmedMessage, currentChatId);
  };

  // Setup/Cleanup socket streaming updates whenever active chat changes
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

  // Safely format chats map into an array for rendering
  const chatList = chats ? Object.values(chats) : [];

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`bg-slate-900 text-white transition-all ${
          sidebarOpen ? "w-72" : "w-20"
        } flex flex-col`}
      >
        <div className="p-5 border-b border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <i className="fa-solid fa-brain text-blue-500 text-xl"></i>
            {sidebarOpen && <h1 className="text-xl font-bold">AstraMind</h1>}
          </div>

          <button
            type="button"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <i className="fa-solid fa-bars"></i>
          </button>
        </div>

        <div className="p-4">
          <button
            type="button"
            onClick={handleNewChat}
            className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg"
          >
            {sidebarOpen ? "New Chat" : "+"}
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
                className={`w-full text-left p-3 rounded-lg ${
                  currentChatId === chat.id ? "bg-slate-800" : "hover:bg-slate-800"
                }`}
              >
                {sidebarOpen ? (
                  chat.title || chat.id
                ) : (
                  <i className="fa-solid fa-message"></i>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-100">
        <div className="bg-white border-b px-6 py-4">
          <h2 className="font-semibold text-lg">
            {activeChat?.title || "New Chat"}
          </h2>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeChat?.messages?.map((msg, index) => (
            <div
              key={index}
              className={`flex ${
                msg.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-2xl px-5 py-3 rounded-2xl ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-white border shadow-sm"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {/* AI IS TYPING PULSE INDICATOR */}
          {isAiThinking && (
            <div className="flex justify-start">
              <div className="bg-white border px-4 py-2 rounded-xl text-gray-500 animate-pulse">
                AI is typing...
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="bg-white border-t p-4">
          <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
            <div className="flex items-center bg-slate-100 rounded-2xl p-2">
              <input
                type="text"
                placeholder="Ask AstraMind anything..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="flex-1 bg-transparent outline-none px-3 py-3"
              />

              <button
                type="submit"
                disabled={isAiThinking}
                className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-xl flex items-center justify-center disabled:opacity-50"
              >
                {isAiThinking ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-paper-plane"></i>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}