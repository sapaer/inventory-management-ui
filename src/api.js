const TOKEN_KEY = "pn_access";
const REFRESH_KEY = "pn_refresh";
export const UNAUTH_EVENT = "pn:unauthorized";

export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken, refreshToken) {
  if (accessToken) localStorage.setItem(TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export class ApiError extends Error {
  constructor(status, code, message, field) {
    super(message);
    this.status = status;
    this.code = code;
    this.field = field;
  }
}

export function formatApiError(err) {
  if (!err) return "Please try after some time.";
  if (err instanceof ApiError) {
    if (err.field && err.message) return err.message;
    return err.message || err.code || "Please try after some time.";
  }
  return err.message || "Please try after some time.";
}

async function parseBody(res) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function expireSession() {
  clearTokens();
  window.dispatchEvent(new Event(UNAUTH_EVENT));
}

async function refreshAccess() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;
  const res = await fetch("/api/v1/auth/token/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const body = await parseBody(res);
  if (!res.ok || !body.success) {
    expireSession();
    return null;
  }
  const data = body.data || {};
  setTokens(data.accessToken, data.refreshToken);
  return data.accessToken;
}

export async function api(path, { method = "GET", body, auth = true, retry = true } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    const token = getAccessToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await parseBody(res);

  if (res.status === 401 && auth && retry) {
    const next = await refreshAccess();
    if (next) return api(path, { method, body, auth, retry: false });
    throw new ApiError(401, "UNAUTHORIZED", "Session expired. Please sign in again.");
  }

  if (!res.ok || payload.success === false) {
    const err = payload.error || {};
    const code = err.code || (res.status === 401 ? "UNAUTHORIZED" : "SERVER_ERROR");
    if (code === "UNAUTHORIZED" && auth) expireSession();
    throw new ApiError(res.status, code, err.message || "Please try after some time.", err.field);
  }

  return payload.data;
}

export const healthApi = {
  check: () => api("/health", { auth: false }),
};

export const authApi = {
  requestOtp: (phone) => api("/api/v1/auth/otp/request", { method: "POST", body: { phone }, auth: false }),
  verifyOtp: (phone, otp) =>
    api("/api/v1/auth/otp/verify", { method: "POST", body: { phone, otp }, auth: false }),
  refresh: (refresh_token) =>
    api("/api/v1/auth/token/refresh", { method: "POST", body: { refresh_token }, auth: false }),
  profile: () => api("/api/v1/auth/profile"),
  updateProfile: (body) => api("/api/v1/auth/profile", { method: "PUT", body }),
  logout: () => api("/api/v1/auth/logout", { method: "DELETE" }),
};

export const inventoryApi = {
  list: (params = {}) => {
    const q = new URLSearchParams();
    if (params.q) q.set("q", params.q);
    const vehicles = Array.isArray(params.vehicles)
      ? params.vehicles
      : params.vehicle
        ? [params.vehicle]
        : [];
    for (const v of vehicles) q.append("vehicle", v);
    if (params.status) q.set("status", params.status);
    const qs = q.toString();
    return api(`/api/v1/inventory${qs ? `?${qs}` : ""}`);
  },
  get: (id) => api(`/api/v1/inventory/${id}`),
  add: (body) => api("/api/v1/inventory", { method: "POST", body }),
  update: (id, body) => api(`/api/v1/inventory/${id}`, { method: "PUT", body }),
  remove: (id) => api(`/api/v1/inventory/${id}`, { method: "DELETE" }),
  quantity: (id, body) => api(`/api/v1/inventory/${id}/quantity`, { method: "PATCH", body }),
  lowStock: () => api("/api/v1/inventory/low-stock"),
  history: (id, page = 1, limit = 20) =>
    api(`/api/v1/inventory/history/${id}?page=${page}&limit=${limit}`),
};

export const notificationApi = {
  list: (page = 1, limit = 20) => api(`/api/v1/notifications?page=${page}&limit=${limit}`),
  markRead: (id) => api(`/api/v1/notifications/${id}/read`, { method: "PATCH" }),
};

export const placesApi = {
  autocomplete: (q) => api(`/api/v1/places/autocomplete?q=${encodeURIComponent(q || "")}`),
  details: (placeId) => api(`/api/v1/places/details?placeId=${encodeURIComponent(placeId || "")}`),
  reverse: (lat, lng) => api(`/api/v1/places/reverse?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}`),
};

export const uploadApi = {
  presign: (filename, contentType) =>
    api("/api/v1/uploads/presign", { method: "POST", body: { filename, contentType } }),
  async uploadFile(file) {
    const contentType = file.type === "image/png" ? "image/png" : file.type === "image/jpeg" ? "image/jpeg" : null;
    if (!contentType) {
      throw new ApiError(400, "INVALID_FILE_TYPE", "Only JPEG or PNG images are allowed");
    }
    const signed = await uploadApi.presign(file.name || "part.jpg", contentType);
    const put = await fetch(signed.upload_url, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!put.ok) {
      throw new ApiError(put.status, "SERVER_ERROR", "Could not upload image to storage");
    }
    return signed.public_url;
  },
};
