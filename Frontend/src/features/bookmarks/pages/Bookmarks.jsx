import { useEffect, useMemo, useState } from 'react';
import {
  Bookmark,
  Search,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Loader2,
  Link2,
  Clock3,
} from 'lucide-react';
import { useChats } from '../../chat/hooks/useChats';


const ACCENTS = [
  { ring: 'ring-orange-500/30', bg: 'bg-orange-500/15', text: 'text-orange-400' },
  { ring: 'ring-sky-500/30', bg: 'bg-sky-500/15', text: 'text-sky-400' },
  { ring: 'ring-violet-500/30', bg: 'bg-violet-500/15', text: 'text-violet-400' },
  { ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  { ring: 'ring-rose-500/30', bg: 'bg-rose-500/15', text: 'text-rose-400' },
  { ring: 'ring-amber-500/30', bg: 'bg-amber-500/15', text: 'text-amber-400' },
];

function accentFor(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return ACCENTS[hash % ACCENTS.length];
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function initialsOf(title) {
  const words = title.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function timeAgo(dateStr) {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const day = 24 * 60 * 60 * 1000;
  const days = Math.floor(diffMs / day);
  if (days <= 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} mo ago`;
  return `${Math.floor(months / 12)} yr ago`;
}

function BookmarkCard({ bookmark, onDelete, deleting }) {
  const [copied, setCopied] = useState(false);
  const accent = accentFor(bookmark._id || bookmark.title || bookmark.url);

  const handleCopy = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(bookmark.url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable, ignore
    }
  };

  return (
    <div className="group bg-[#0a0a0f] border border-white/5 rounded-xl p-4 hover:border-orange-500/30 transition-all flex flex-col">
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${accent.bg} ${accent.text} ring-1 ${accent.ring} flex items-center justify-center text-sm font-semibold flex-shrink-0`}
        >
          {initialsOf(bookmark.title)}
        </div>

        <div className="flex-1 min-w-0">
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
          >
            <h3 className="text-white font-medium text-[15px] leading-snug truncate group-hover:text-orange-400 transition-colors">
              {bookmark.title}
            </h3>
          </a>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <Link2 size={12} className="flex-shrink-0" />
            <span className="truncate">{hostnameOf(bookmark.url)}</span>
          </div>
        </div>

        <button
          onClick={() => onDelete(bookmark._id)}
          disabled={deleting}
          className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50"
          aria-label="Delete bookmark"
        >
          {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
        </button>
      </div>

      {bookmark.description && (
        <p className="text-slate-400 text-sm mt-3 line-clamp-2 leading-relaxed">
          {bookmark.description}
        </p>
      )}

      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {bookmark.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Clock3 size={12} />
          {timeAgo(bookmark.createdAt)}
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={handleCopy}
            className="text-slate-500 hover:text-white transition-colors"
            aria-label="Copy link"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>
          <a
            href={bookmark.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:text-orange-400 transition-colors"
            aria-label="Open link"
          >
            <ExternalLink size={15} />
          </a>
        </div>
      </div>
    </div>
  );
}

export default function Bookmarks() {
  const { handleGetBookmarks, handleDeleteBookmark } = useChats();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');

  const fetchBookmarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await handleGetBookmarks();
      setBookmarks(response?.bookmarks || []);
    } catch (err) {
      setError('Failed to load bookmarks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookmarks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this bookmark?')) return;
    setDeletingId(id);
    try {
      await handleDeleteBookmark(id);
      await fetchBookmarks();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const tags = useMemo(() => {
    const set = new Set();
    bookmarks.forEach((b) => (b.tags || []).forEach((t) => set.add(t)));
    return ['All', ...Array.from(set)];
  }, [bookmarks]);

  const stats = useMemo(() => {
    const uniqueTags = new Set();
    bookmarks.forEach((b) => (b.tags || []).forEach((t) => uniqueTags.add(t)));
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const addedThisWeek = bookmarks.filter(
      (b) => new Date(b.createdAt).getTime() >= weekAgo
    ).length;
    return {
      total: bookmarks.length,
      tags: uniqueTags.size,
      thisWeek: addedThisWeek,
    };
  }, [bookmarks]);

  const filtered = useMemo(() => {
    return bookmarks.filter((b) => {
      const matchesTag = activeTag === 'All' || (b.tags || []).includes(activeTag);
      const q = query.trim().toLowerCase();
      const matchesQuery =
        !q ||
        b.title?.toLowerCase().includes(q) ||
        b.url?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
  }, [bookmarks, query, activeTag]);

  return (
    <div className="flex h-screen bg-black text-white">
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-black">
        {/* Page header */}
        <div className="flex-shrink-0 bg-black border-b border-white/5">
          <div className="px-6 pt-6 pb-5 grid grid-cols-1 lg:grid-cols-[1.4fr_1px_1fr_1px_1fr] gap-5 items-center">
            {/* Left: identity */}
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 flex items-center justify-center flex-shrink-0">
                  <Bookmark size={16} />
                </div>
                <h2 className="font-bold text-xl text-white">Bookmarks</h2>
              </div>
              <p className="text-slate-400 text-sm mt-2 max-w-md">
                Every link you save from a chat lands here. Search by title, filter by
                tag, or jump straight to the source.
              </p>
            </div>

            <div className="hidden lg:block h-12 bg-white/5" />

            {/* Middle: total + this week */}
            <div className="flex items-center gap-6">
              <div>
                <div className="text-2xl font-semibold text-white leading-none">
                  {stats.total}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">Saved links</div>
              </div>
              <div>
                <div className="text-2xl font-semibold text-white leading-none">
                  {stats.thisWeek}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">Added this week</div>
              </div>
            </div>

            <div className="hidden lg:block h-12 bg-white/5" />

            {/* Right: tags */}
            <div className="flex items-center justify-between lg:justify-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30 flex items-center justify-center flex-shrink-0">
                <Link2 size={16} />
              </div>
              <div>
                <div className="text-2xl font-semibold text-white leading-none">
                  {stats.tags}
                </div>
                <div className="text-xs text-slate-500 mt-1.5">Tags in use</div>
              </div>
            </div>
          </div>

          {/* Search + filters */}
          {bookmarks.length > 0 && (
            <div className="px-6 pb-5 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-1 max-w-sm">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bookmarks..."
                  className="w-full bg-[#0a0a0f] border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/40 transition-colors"
                />
              </div>

              {tags.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(tag)}
                      className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                        activeTag === tag
                          ? 'bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30'
                          : 'bg-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      {tag === 'All' ? 'All' : `#${tag}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-slate-400 text-center py-16 flex flex-col items-center gap-2">
              <Loader2 className="animate-spin" size={20} />
              Loading bookmarks...
            </div>
          ) : error ? (
            <div className="text-red-400 text-center py-16">{error}</div>
          ) : bookmarks.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              <Bookmark size={44} className="mx-auto mb-4 text-slate-600" />
              <p className="text-lg text-white">No bookmarks yet</p>
              <p className="text-sm mt-2 text-slate-500">
                Use the bookmark option in chat to save links
              </p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              <Search size={36} className="mx-auto mb-3 text-slate-600" />
              <p className="text-white">No matches</p>
              <p className="text-sm mt-1 text-slate-500">
                Try a different search term or tag.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((bookmark) => (
                <BookmarkCard
                  key={bookmark._id}
                  bookmark={bookmark}
                  onDelete={handleDelete}
                  deleting={deletingId === bookmark._id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}