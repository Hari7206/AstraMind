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

  const getChatGroups = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const groups = {
      today: [],
      week: [],
      month: [],
      older: []
    };

    chatList.forEach(chat => {
      const chatDate = new Date(chat.lastUpdated);
      if (chatDate >= today) {
        groups.today.push(chat);
      } else if (chatDate >= weekAgo) {
        groups.week.push(chat);
      } else if (chatDate >= monthAgo) {
        groups.month.push(chat);
      } else {
        groups.older.push(chat);
      }
    });

    return groups;
  };

  const groups = getChatGroups();
  const groupLabels = {
    today: 'Today',
    week: '7 Days',
    month: '30 Days',
    older: '2026-07'
  };

  return (
    <div
      className={`${sidebarOpen ? "w-80" : "w-16"} flex flex-col bg-[#0a0a0f] border-r border-white/5 transition-all duration-300 h-screen flex-shrink-0`}
    >
      {/* Header */}
      <div className={`p-4 flex ${sidebarOpen ? "justify-between" : "justify-center"} items-center flex-shrink-0 border-b border-white/5`}>
        {sidebarOpen && (
          <span className="font-bold text-xl tracking-wide text-white">
            ASTRA<span className="text-orange-400">MIND</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => setSidebarOpen((p) => !p)}
          className="text-slate-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer p-1"
        >
          <i className="fa-solid fa-bars text-xl"></i>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="px-3 py-3 flex flex-col gap-2 flex-shrink-0">
        <button
          type="button"
          onClick={handleNewChat}
          className={`w-full py-3 rounded-xl font-semibold text-base text-white bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 transition-all flex items-center justify-center gap-2 ${!sidebarOpen && "px-0"}`}
        >
          <i className="fa-solid fa-plus text-base"></i>
          {sidebarOpen && "New Chat"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/gallery")}
          className={`w-full py-3 rounded-xl font-semibold text-base text-slate-300 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 ${!sidebarOpen && "px-0"}`}
        >
          <i className="fa-regular fa-images text-base"></i>
          {sidebarOpen && "Gallery"}
        </button>

        <button
          type="button"
          onClick={() => navigate("/bookmarks")}
          className={`w-full py-3 rounded-xl font-semibold text-base text-slate-300 bg-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2 ${!sidebarOpen && "px-0"}`}
        >
          <i className="fa-regular fa-bookmark text-base"></i>
          {sidebarOpen && "Bookmarks"}
        </button>
      </div>

      {/* Chat List - Only show when sidebar is open */}
      {sidebarOpen && (
        <div className="flex-1 overflow-y-auto px-3 pb-2 scrollbar-hide">
          {Object.entries(groups).map(([key, chats]) => {
            if (chats.length === 0) return null;
            return (
              <div key={key} className="mb-4">
                <h3 className="text-sm font-semibold text-slate-400 px-1 py-2">
                  {groupLabels[key]}
                </h3>
                <div className="space-y-1">
                  {chats.map((chat) => {
                    const isActive = currentChatId === chat.id;
                    return (
                      <button
                        key={chat.id}
                        type="button"
                        onClick={() => handleSelectChat(chat.id)}
                        className={`w-full text-left px-3 py-2.5 rounded-lg text-base transition-all ${
                          isActive 
                            ? "bg-orange-500/10 text-white font-medium" 
                            : "text-slate-300 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        <span className="block whitespace-normal break-words">
                          {chat.title || chat.id}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Spacer to push user profile to bottom */}
      {!sidebarOpen && <div className="flex-1"></div>}

      {/* User Profile */}
      <div className="border-t border-white/5 p-3 flex-shrink-0">
        <div className={`flex items-center ${sidebarOpen ? "gap-3" : "justify-center"}`}>
          <div className="w-9 h-9 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            {getInitials(user?.username || user?.email || "U")}
          </div>
          {sidebarOpen && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-slate-200 truncate">
                  {user?.username || user?.email || "User"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white transition-colors text-base"
                title="Logout"
              >
                <i className="fa-solid fa-sign-out-alt"></i>
              </button>
            </>
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