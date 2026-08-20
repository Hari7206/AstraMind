import { useState, useEffect, useMemo } from 'react';
import {
  Bookmark,
  ExternalLink,
  Trash2,
  Copy,
  Check,
  Loader2,
  Link2,
  Clock3,
  TrendingUp,
  Tag,
  Search,
} from 'lucide-react';

const ACCENTS = [
  { ring: 'ring-orange-500/30', bg: 'bg-orange-500/15', text: 'text-orange-400', glow: 'glow-orange' },
  { ring: 'ring-sky-500/30', bg: 'bg-sky-500/15', text: 'text-sky-400', glow: 'glow-sky' },
  { ring: 'ring-violet-500/30', bg: 'bg-violet-500/15', text: 'text-violet-400', glow: 'glow-violet' },
  { ring: 'ring-emerald-500/30', bg: 'bg-emerald-500/15', text: 'text-emerald-400', glow: 'glow-emerald' },
  { ring: 'ring-rose-500/30', bg: 'bg-rose-500/15', text: 'text-rose-400', glow: 'glow-rose' },
  { ring: 'ring-amber-500/30', bg: 'bg-amber-500/15', text: 'text-amber-400', glow: 'glow-amber' },
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
  const words = (title || '').trim().split(/\s+/).filter(Boolean);
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

function StatCard({ label, value, icon: Icon, accent }) {
  const accentClass = accent === 'orange' ? 'glow-orange' :
                      accent === 'sky' ? 'glow-sky' :
                      'glow-violet';
  const accentBg = accent === 'orange' ? 'bg-orange-500/10 text-orange-400' :
                   accent === 'sky' ? 'bg-sky-500/10 text-sky-400' :
                   'bg-violet-500/10 text-violet-400';

  return (
    <div className={`glass-card rounded-xl p-4 flex items-center justify-between ${accentClass} bg-[#1a1a1a] border border-white/5 backdrop-blur-sm`}>
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider font-mono">{label}</p>
        <p className="text-2xl font-bold text-white mt-1">{value}</p>
      </div>
      <div className={`w-12 h-12 rounded-full ${accentBg} flex items-center justify-center`}>
        <Icon size={24} />
      </div>
    </div>
  );
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
    <div className={`group bg-[#1a1a1a] backdrop-blur-sm border border-white/5 rounded-xl p-4 hover:border-white/20 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col ${accent.glow}`}>
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
            <h3 className="text-white font-semibold text-[15px] leading-snug truncate group-hover:text-orange-400 transition-colors">
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
          className="text-slate-600 hover:text-red-400 transition-colors flex-shrink-0 disabled:opacity-50 opacity-0 group-hover:opacity-100"
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
              className="text-xs bg-white/5 text-slate-400 px-2 py-0.5 rounded-full border border-white/5"
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

export default function Bookmarks({ getBookmarks, deleteBookmark }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('All');

  const fetchBookmarks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getBookmarks();
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
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this bookmark?')) return;
    setDeletingId(id);
    try {
      await deleteBookmark(id);
      await fetchBookmarks();
    } catch (err) {
      console.error('Delete failed:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const allTags = useMemo(() => {
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
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        b.title?.toLowerCase().includes(q) ||
        b.url?.toLowerCase().includes(q) ||
        b.description?.toLowerCase().includes(q);
      return matchesTag && matchesQuery;
    });
  }, [bookmarks, searchQuery, activeTag]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#131313]">
      {/* Header */}
      <div className="flex-shrink-0 bg-[#131313] border-b border-white/5 px-6 py-4">
        <h2 className="text-xl font-bold text-white">Bookmarks</h2>
        <p className="text-sm text-slate-400 mt-1">
          Every link you save from a chat lands here. Search by title, filter by tag, or jump straight to the source.
        </p>
      </div>

      {/* Stats Bar */}
      <div className="flex-shrink-0 px-6 pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <StatCard label="Total Bookmarks" value={stats.total} icon={Bookmark} accent="orange" />
          <StatCard label="Added This Week" value={stats.thisWeek} icon={TrendingUp} accent="sky" />
          <StatCard label="Active Tags" value={stats.tags} icon={Tag} accent="violet" />
        </div>
      </div>

      {/* Search and Filters */}
      {bookmarks.length > 0 && (
        <div className="flex-shrink-0 px-6 pt-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full bg-[#0a0a0f] border border-white/5 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/40 transition-colors"
              />
            </div>
            {allTags.length > 1 && (
              <div className="flex items-center gap-2 overflow-x-auto">
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className={`text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-colors ${
                      activeTag === tag
                        ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                        : 'bg-white/5 text-slate-400 hover:text-white border border-white/5'
                    }`}
                  >
                    {tag === 'All' ? 'All' : `#${tag}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 pt-4">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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

      <style>{`
        .glass-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(20px);
        }
        .glow-orange {
          box-shadow: inset 0 0 40px rgba(255, 107, 0, 0.1);
          border-color: rgba(255, 107, 0, 0.2);
        }
        .glow-sky {
          box-shadow: inset 0 0 40px rgba(0, 162, 230, 0.1);
          border-color: rgba(0, 162, 230, 0.2);
        }
        .glow-violet {
          box-shadow: inset 0 0 40px rgba(167, 131, 255, 0.1);
          border-color: rgba(167, 131, 255, 0.2);
        }
        .glow-emerald {
          box-shadow: inset 0 0 40px rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.2);
        }
        .glow-rose {
          box-shadow: inset 0 0 40px rgba(244, 63, 94, 0.1);
          border-color: rgba(244, 63, 94, 0.2);
        }
        .glow-amber {
          box-shadow: inset 0 0 40px rgba(245, 158, 11, 0.1);
          border-color: rgba(245, 158, 11, 0.2);
        }
      `}</style>
    </div>
  );
}