import axios from 'axios';
import { API_URL } from '../../../config/api';

export const bookmarkApi = {
  saveBookmark: async (bookmarkData) => {
    try {
      const response = await axios.post(
        `${API_URL}/api/agent/bookmarks`,
        bookmarkData,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getBookmarks: async () => {
    try {
      const response = await axios.get(
        `${API_URL}/api/agent/bookmarks`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteBookmark: async (bookmarkId) => {
    try {
      const response = await axios.delete(
        `${API_URL}/api/agent/bookmarks/${bookmarkId}`,
        { withCredentials: true }
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};