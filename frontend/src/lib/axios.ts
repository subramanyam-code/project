import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  headers: { "Content-Type": "application/json" },
  timeout: 30_000,
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = Cookies.get("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let waitQueue: Array<(t: string) => void> = [];

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const orig = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !orig._retry) {
      orig._retry = true;
      if (refreshing) {
        return new Promise((res) => waitQueue.push((t) => { orig.headers.Authorization = `Bearer ${t}`; res(api(orig)); }));
      }
      refreshing = true;
      const refresh = Cookies.get("refresh_token");
      if (!refresh) { clearTokens(); if (typeof window !== "undefined") window.location.href = "/login"; return Promise.reject(error); }
      try {
        const { data } = await axios.post(`${BASE}/api/v1/auth/refresh`, { refresh_token: refresh });
        setTokens(data.access_token, data.refresh_token);
        waitQueue.forEach((cb) => cb(data.access_token));
        waitQueue = [];
        orig.headers.Authorization = `Bearer ${data.access_token}`;
        return api(orig);
      } catch {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
        return Promise.reject(error);
      } finally { refreshing = false; }
    }
    return Promise.reject(error);
  }
);

export const setTokens = (access: string, refresh: string) => {
  Cookies.set("access_token", access, { expires: 1 / 48, sameSite: "strict" });
  Cookies.set("refresh_token", refresh, { expires: 7, sameSite: "strict" });
};
export const clearTokens = () => { Cookies.remove("access_token"); Cookies.remove("refresh_token"); };
export const getAccessToken = () => Cookies.get("access_token");
