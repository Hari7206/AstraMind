import { useState, useEffect, useCallback } from 'react';
import { bookmarkApi } from '../service/bookmark.api';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookmarkApi.getBookmarks();
      setBookmarks(response.bookmarks || []);
      return response;
    } catch (err) {
      setError(err.message || 'Failed to fetch bookmarks');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveBookmark = useCallback(async (bookmarkData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookmarkApi.saveBookmark(bookmarkData);
      await fetchBookmarks();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to save bookmark');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBookmarks]);

  const deleteBookmark = useCallback(async (bookmarkId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookmarkApi.deleteBookmark(bookmarkId);
      await fetchBookmarks();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to delete bookmark');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBookmarks]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  return {
    bookmarks,
    loading,
    error,
    fetchBookmarks,
    saveBookmark,
    deleteBookmark
  };
}