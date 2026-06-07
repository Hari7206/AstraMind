import { useState } from "react";

const initialChats = [
  {
    title: "React Authentication Setup",
    messages: [
      {
        sender: "user",
        text: "How do I create JWT authentication in Express?",
      },
      {
        sender: "ai",
        text: "You can create JWT authentication using jsonwebtoken, bcrypt, middleware verification and protected routes.",
      },
      {
        sender: "user",
        text: "Show me a complete example.",
      },
      {
        sender: "ai",
        text: "Sure! First install jsonwebtoken and bcrypt...",
      },
    ],
  },
  {
    title: "Node.js API Project",
    messages: [],
  },
  {
    title: "Tailwind CSS Design",
    messages: [],
  },
  {
    title: "MongoDB Questions",
    messages: [],
  },
  {
    title: "AI Chatbot Ideas",
    messages: [],
  },
];

export default function Home() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [chats, setChats] = useState(initialChats);
  const [activeChatIndex, setActiveChatIndex] = useState(0);
  const [message, setMessage] = useState("");

  const activeChat = chats[activeChatIndex];

  const handleNewChat = () => {
    const newChat = {
      title: "New Chat",
      messages: [],
    };

    setChats((currentChats) => [newChat, ...currentChats]);
    setActiveChatIndex(0);
    setMessage("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedMessage = message.trim();

    if (!trimmedMessage) {
      return;
    }

    setChats((currentChats) =>
      currentChats.map((chat, index) =>
        index === activeChatIndex
          ? {
              ...chat,
              title: chat.messages.length ? chat.title : trimmedMessage,
              messages: [
                ...chat.messages,
                {
                  sender: "user",
                  text: trimmedMessage,
                },
              ],
            }
          : chat
      )
    );
    setMessage("");
  };

  return (
  <main className="h-screen flex bg-slate-100">
  {/* Sidebar */}
  <aside className={`${sidebarOpen ? "w-1/5" : "w-20"} bg-slate-900 text-white flex flex-col transition-all duration-300`}>
    
    {/* Logo */}
    <div className="p-5 border-b border-slate-700 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <i className="fa-solid fa-brain text-blue-500 text-xl"></i>
        {sidebarOpen && <h1 className="text-xl font-bold">AstraMind</h1>}
      </div>

      <button
        type="button"
        onClick={() => setSidebarOpen((isOpen) => !isOpen)}
        className="hover:text-blue-400"
        aria-label="Toggle sidebar"
      >
        <i className="fa-solid fa-bars"></i>
      </button>
    </div>

    {/* New Chat */}
    <div className="p-4">
      <button
        type="button"
        onClick={handleNewChat}
        className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg flex items-center justify-center gap-2 transition"
      >
        <i className="fa-solid fa-plus"></i>
        {sidebarOpen && "New Chat"}
      </button>
    </div>

    {/* Chats */}
    <div className="flex-1 overflow-y-auto px-4">
      {sidebarOpen && <h2 className="text-slate-400 text-sm uppercase mb-3">
        Chats
      </h2>}

      <div className="space-y-2">
        {chats.map((chat, index) => (
          <button
            key={`${chat.title}-${index}`}
            type="button"
            onClick={() => setActiveChatIndex(index)}
            className={`w-full text-left p-3 rounded-lg transition ${index === activeChatIndex ? "bg-slate-800 hover:bg-slate-700" : "hover:bg-slate-800"} ${sidebarOpen ? "" : "text-center"}`}
            title={chat.title}
          >
            {sidebarOpen ? chat.title : <i className="fa-solid fa-comment"></i>}
          </button>
        ))}
      </div>
    </div>

    {/* Bottom */}
    <div className="p-4 border-t border-slate-700">
      <button
        type="button"
        className="flex items-center gap-2 text-slate-300 hover:text-white"
      >
        <i className="fa-solid fa-gear"></i>
        {sidebarOpen && "Settings"}
      </button>
    </div>
  </aside>

  {/* Chat Area */}
  <section className="flex-1 flex flex-col">
    
    {/* Header */}
    <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
      <h2 className="font-semibold text-lg">
        {activeChat.title}
      </h2>

      <button className="text-slate-500 hover:text-slate-700">
        <i className="fa-solid fa-ellipsis"></i>
      </button>
    </div>

    {/* Messages */}
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {activeChat.messages.map((chatMessage, index) => (
        <div
          key={`${chatMessage.sender}-${index}`}
          className={`flex ${chatMessage.sender === "user" ? "justify-start" : "justify-end"}`}
        >
          <div className={`max-w-2xl px-5 py-3 rounded-2xl ${chatMessage.sender === "user" ? "bg-blue-600 text-white rounded-bl-md" : "bg-white border rounded-br-md shadow-sm"}`}>
            {chatMessage.text}
          </div>
        </div>
      ))}
    </div>

    {/* Input */}
    <div className="bg-white border-t p-4">
      <form onSubmit={handleSubmit} className="max-w-5xl mx-auto">
        <div className="flex items-center bg-slate-100 rounded-2xl p-2">
          
          <button
            type="button"
            className="px-4 text-slate-500 hover:text-blue-600"
          >
            <i className="fa-solid fa-paperclip"></i>
          </button>

          <input
            type="text"
            placeholder="Ask AstraMind anything..."
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            className="flex-1 bg-transparent outline-none px-3 py-3"
          />

          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-xl transition"
          >
            <i className="fa-solid fa-paper-plane"></i>
          </button>
        </div>
      </form>
    </div>
  </section>
</main>
  );
}
