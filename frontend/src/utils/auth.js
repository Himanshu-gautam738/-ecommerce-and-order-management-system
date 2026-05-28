// src/utils/auth.js
export const saveTokens = (tokens) => {
  localStorage.setItem("access_token", tokens.access);
  localStorage.setItem("refresh_token", tokens.refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  localStorage.removeItem("username");
};

export const getAccessToken = () => localStorage.getItem("access_token");

export const authFetch = async (url, options = {}) => {
  const token = getAccessToken();
  const headers = options.headers ? {...options.headers} : {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  
  const res = await fetch(url, {...options, headers});
  if (res.status === 401) {
    clearTokens();
    if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
      window.location.href = '/login';
    }
  }
  return res;
};
