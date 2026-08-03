
import { useNavigate } from "react-router-dom";

export default function Sidebar({
  sidebarOpen,
  setSidebarOpen,
  chatList,
  currentChatId,
  handleNewChat,
  handleSelectChat,
  user,
  plan,
  searchesUsed,
  searchesLimit
}) {
  const navigate = useNavigate();

  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const handleLogout = () => {
    document.cookie = "token=; path=/; max-age=0";
    navigate("/login");
  };

  return (
    <div
      className={`${sidebarOpen ? "w-72" : "w-16"} flex flex-col bg-[#0a0a0f] border-r border-white/5 transition-all duration-300 h-screen flex-shrink-0`}
    >
      {/* Header */}
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

      {/* Action Buttons */}
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

      {/* Chat List */}
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
                className={`relative w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive 
                    ? "bg-orange-500/10 text-white border border-orange-500/20" 
                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                } ${!sidebarOpen && "flex justify-center"}`}
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

      {/* User Profile */}
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
              onClick={handleLogout}
              className="text-slate-400 hover:text-white transition-colors"
              title="Logout"
            >
              <i className="fa-solid fa-sign-out-alt"></i>
            </button>
          )}
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