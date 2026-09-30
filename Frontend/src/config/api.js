const removeTrailingSlashes = (value) => value.replace(/\/+$/, "");

export const API_URL = removeTrailingSlashes(
  import.meta.env.VITE_API_URL || "http://localhost:3000"
);

export const SOCKET_URL = removeTrailingSlashes(
  import.meta.env.VITE_SOCKET_URL || API_URL
);