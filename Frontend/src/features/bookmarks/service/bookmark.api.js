import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const bookmarkApi = {
  // Save a bookmark
  saveBookmark: async (bookmarkData) => {
    try {
      const response = await axios.post(
        `${API_URL}/agent/bookmarks`,
        bookmarkData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get all bookmarks
  getBookmarks: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/agent/bookmarks`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete a bookmark
  deleteBookmark: async (bookmarkId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/agent/bookmarks/${bookmarkId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};