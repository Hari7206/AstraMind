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
  Sparkles,
  Plus,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
    <div className="group relative bg-gradient-to-b from-[#0d0d14] to-[#0a0a0f] border border-white/5 rounded-2xl p-5 hover:border-orange-500/40 hover:shadow-[0_0_0_1px_rgba(249,115,22,0.08),0_8px_30px_-12px_rgba(249,115,22,0.25)] transition-all duration-300 flex flex-col">
      <div className="flex items-start gap-3">
        <div
          className={`w-11 h-11 rounded-xl ${accent.bg} ${accent.text} ring-1 ${accent.ring} flex items-center justify-center text-sm font-semibold flex-shrink-0`}
        >
          {initialsOf(bookmark.title)}
        </div>

        <div className="flex-1 min-w-0">
          <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="block">
            <h3 className="text-white font-semibold text-[15px] leading-snug truncate group-hover:text-orange-400 transition-colors">
              {bookmark.title}
            </h3>
          </a>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
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
        <p className="text-slate-400 text-sm mt-4 line-clamp-2 leading-relaxed">
          {bookmark.description}
        </p>
      )}

      {bookmark.tags && bookmark.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-4">
          {bookmark.tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] bg-white/5 text-slate-400 px-2.5 py-1 rounded-full border border-white/5"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-5 pt-4 border-t border-white/5">
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
  const navigate = useNavigate();
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
    <div className="flex h-screen bg-black text-white overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 h-screen bg-black">

        {/* HERO HEADER */}
        <div className="relative flex-shrink-0 overflow-hidden border-b border-white/5">
          {/* gradient glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute -top-32 -left-24 w-[380px] h-[380px] bg-orange-500/15 blur-[120px] rounded-full" />
            <div className="absolute -top-24 right-1/4 w-[300px] h-[300px] bg-sky-500/10 blur-[120px] rounded-full" />
            <div className="absolute top-0 right-0 w-[260px] h-[260px] bg-violet-500/10 blur-[120px] rounded-full" />
          </div>

          {/* BACK BUTTON */}
          <div className="relative px-6 lg:px-8 pt-5">
            <button
              onClick={() => navigate(-1)}
              className="group inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10 rounded-lg px-3 py-1.5 transition-all"
              aria-label="Go back"
            >
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-0.5" />
              Back
            </button>
          </div>

          <div className="relative px-8 pt-4 pb-8">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 mb-5">
                <Sparkles size={12} className="text-orange-400" />
                Your saved links, one place
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.05]">
                <span className="inline-flex items-center gap-3">
                  <span className="w-12 h-12 rounded-2xl bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 flex items-center justify-center">
                    <Bookmark size={24} />
                  </span>
                  Bookmarks
                </span>
              </h1>

              <p className="text-slate-400 text-sm sm:text-base mt-4 max-w-xl">
                Every link you save from a chat lands here. Search by title, filter by tag,
                or jump straight to the source.
              </p>

              {/* CENTERED SEARCH */}
              <div className="relative w-full max-w-2xl mt-7">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search bookmarks by title, URL, or description..."
                  className="w-full bg-white/[0.03] backdrop-blur border border-white/10 rounded-2xl pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-orange-500/50 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(249,115,22,0.08)] transition-all"
                />
              </div>

              {/* STATS STRIP */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-2xl mt-7">
                <div className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3.5 flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-lg bg-orange-500/15 text-orange-400 ring-1 ring-orange-500/30 flex items-center justify-center flex-shrink-0">
                    <Bookmark size={16} />
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-white leading-none">
                      {stats.total}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Saved links</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3.5 flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-lg bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <Plus size={16} />
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-white leading-none">
                      {stats.thisWeek}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Added this week</div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/[0.03] border border-white/5 px-4 py-3.5 flex items-center gap-3 text-left">
                  <div className="w-9 h-9 rounded-lg bg-sky-500/15 text-sky-400 ring-1 ring-sky-500/30 flex items-center justify-center flex-shrink-0">
                    <Link2 size={16} />
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-white leading-none">
                      {stats.tags}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">Tags in use</div>
                  </div>
                </div>
              </div>

              {/* TAG FILTERS */}
              {bookmarks.length > 0 && tags.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mt-6 max-w-full pb-1">
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(tag)}
                      className={`text-xs px-3.5 py-1.5 rounded-full whitespace-nowrap transition-all border ${
                        activeTag === tag
                          ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                          : 'bg-white/[0.03] text-slate-400 border-white/5 hover:text-white hover:bg-white/[0.06]'
                      }`}
                    >
                      {tag === 'All' ? 'All' : `#${tag}`}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 lg:px-8 py-6">
            {loading ? (
              <div className="text-slate-400 text-center py-24 flex flex-col items-center gap-3">
                <Loader2 className="animate-spin" size={22} />
                Loading bookmarks...
              </div>
            ) : error ? (
              <div className="text-red-400 text-center py-24">{error}</div>
            ) : bookmarks.length === 0 ? (
              /* EMPTY STATE WITH ILLUSTRATION */
              <div className="max-w-md mx-auto text-center py-16">
                <div className="relative mx-auto w-40 h-40 mb-6">
                  <div className="absolute inset-0 bg-orange-500/10 blur-3xl rounded-full" />
                  <svg viewBox="0 0 160 160" className="relative w-full h-full">
                    <defs>
                      <linearGradient id="bk-grad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.9" />
                        <stop offset="100%" stopColor="#fb923c" stopOpacity="0.5" />
                      </linearGradient>
                    </defs>
                    <rect x="26" y="22" width="108" height="118" rx="14" fill="#0d0d14" stroke="rgba(255,255,255,0.06)" />
                    <rect x="42" y="42" width="76" height="8" rx="4" fill="rgba(255,255,255,0.08)" />
                    <rect x="42" y="60" width="56" height="8" rx="4" fill="rgba(255,255,255,0.06)" />
                    <rect x="42" y="78" width="66" height="8" rx="4" fill="rgba(255,255,255,0.05)" />
                    <path
                      d="M118 40 L138 40 L138 96 L128 88 L118 96 Z"
                      fill="url(#bk-grad)"
                      stroke="rgba(249,115,22,0.4)"
                      strokeWidth="1.5"
                    />
                    <circle cx="128" cy="60" r="3" fill="#0a0a0f" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white">No bookmarks yet</h3>
                <p className="text-sm text-slate-500 mt-2 max-w-xs mx-auto">
                  Use the bookmark option in any chat to save links. They'll show up
                  right here, ready to search and filter.
                </p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center text-slate-400 py-24">
                <Search size={36} className="mx-auto mb-3 text-slate-600" />
                <p className="text-white text-lg font-medium">No matches</p>
                <p className="text-sm mt-1 text-slate-500">
                  Try a different search term or tag.
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-medium text-slate-300">
                    {activeTag === 'All' ? 'All bookmarks' : `#${activeTag}`}
                    <span className="text-slate-500 ml-2">({filtered.length})</span>
                  </h2>
                </div>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}