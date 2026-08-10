import { useEffect , useState } from 'react';

import { useChats } from '../../chat/hooks/useChats';

export default function Bookmarks() {
  const { handleGetBookmarks } = useChats();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const response = await handleGetBookmarks();
        setBookmarks(response.bookmarks || []);
      } catch (error) {
        console.error('Failed to fetch bookmarks:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [handleGetBookmarks]);

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-black">
        <div className="px-6 py-4 flex items-center justify-between flex-shrink-0 bg-black border-b border-white/5">
          <h2 className="font-bold text-xl text-white">Bookmarks</h2>
          <span className="text-sm text-slate-400">
            <i className="fa-regular fa-bookmark mr-2"></i>
            Saved links
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-slate-400 text-center py-8">Loading bookmarks...</div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              <i className="fa-regular fa-bookmark text-5xl mb-4 block"></i>
              <p className="text-lg">No bookmarks yet</p>
              <p className="text-sm mt-2">Use the bookmark option in chat to save links</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bookmarks.map((bookmark) => (
                <div
                  key={bookmark._id}
                  className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 hover:border-orange-500/30 transition-all"
                >
                  <a
                    href={bookmark.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <h3 className="text-white font-medium text-lg hover:text-orange-400 transition-colors">
                      {bookmark.title}
                    </h3>
                    <p className="text-slate-400 text-sm mt-1 truncate">{bookmark.url}</p>
                    {bookmark.description && (
                      <p className="text-slate-500 text-sm mt-2">{bookmark.description}</p>
                    )}
                    <div className="text-xs text-slate-500 mt-3">
                      {new Date(bookmark.createdAt).toLocaleDateString()}
                    </div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}