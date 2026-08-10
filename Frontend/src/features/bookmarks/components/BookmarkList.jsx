
import { useState, useEffect } from 'react';

export default function BookmarkList({ getBookmarks, deleteBookmark }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const fetchBookmarks = async () => {
    setLoading(true);
    try {
      const response = await getBookmarks();
      setBookmarks(response.bookmarks || []);
    } catch (err) {
      setError('Failed to load bookmarks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this bookmark?')) return;
    setDeleting(id);
    try {
      await deleteBookmark(id);
      await fetchBookmarks();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeleting(null);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-center py-8">Loading bookmarks...</div>;
  }

  if (error) {
    return <div className="text-red-400 text-center py-8">{error}</div>;
  }

  if (bookmarks.length === 0) {
    return (
      <div className="text-center text-slate-400 py-12">
        <i className="fa-regular fa-bookmark text-5xl mb-4 block"></i>
        <p className="text-lg">No bookmarks yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {bookmarks.map((bookmark) => (
        <div
          key={bookmark._id}
          className="bg-[#0a0a0f] border border-white/5 rounded-xl p-4 hover:border-orange-500/30 transition-all"
        >
          <div className="flex items-start justify-between">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1"
            >
              <h3 className="text-white font-medium text-lg hover:text-orange-400 transition-colors">
                {bookmark.title}
              </h3>
            </a>
            <button
              onClick={() => handleDelete(bookmark._id)}
              disabled={deleting === bookmark._id}
              className="text-slate-500 hover:text-red-400 transition-colors ml-2 flex-shrink-0"
            >
              {deleting === bookmark._id ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                <i className="fa-regular fa-trash-can"></i>
              )}
            </button>
          </div>
          
          {bookmark.description && (
            <p className="text-slate-400 text-sm mt-2 line-clamp-2">
              {bookmark.description}
            </p>
          )}
          
          <div className="flex flex-wrap gap-2 mt-3">
            <a
              href={bookmark.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-orange-400 hover:underline truncate max-w-full"
            >
              {bookmark.url}
            </a>
          </div>
          
          {bookmark.tags && bookmark.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {bookmark.tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="text-xs bg-white/5 text-slate-400 px-2 py-1 rounded-full"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
          
          <div className="text-xs text-slate-500 mt-3">
            {new Date(bookmark.createdAt).toLocaleDateString()}
          </div>
        </div>
      ))}
    </div>
  );
}