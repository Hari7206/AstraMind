import { useState, useEffect, useCallback } from 'react';
import { bookmarkApi } from '../service/bookmark.api';

export function useBookmarks() {
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all bookmarks
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

  // Save a new bookmark
  const saveBookmark = useCallback(async (bookmarkData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookmarkApi.saveBookmark(bookmarkData);
      // Refresh the list after saving
      await fetchBookmarks();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to save bookmark');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBookmarks]);

  // Delete a bookmark
  const deleteBookmark = useCallback(async (bookmarkId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await bookmarkApi.deleteBookmark(bookmarkId);
      // Refresh the list after deletion
      await fetchBookmarks();
      return response;
    } catch (err) {
      setError(err.message || 'Failed to delete bookmark');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchBookmarks]);

  // Load bookmarks on mount
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