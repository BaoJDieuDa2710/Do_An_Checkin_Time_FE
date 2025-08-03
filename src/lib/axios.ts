import axios from "axios"

// ==================== CẤU HÌNH ====================
export const API_BASE_URL = "http://localhost:8088/api/v1"
export const WS_BASE_URL = "http://localhost:8088/ws"

// ==================== QUẢN LÝ TOKEN ====================
export const tokenManager = {
  getAccessToken: () => localStorage.getItem("access_token"),
  getRefreshToken: () => localStorage.getItem("refresh_token"),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem("access_token", accessToken)
    localStorage.setItem("refresh_token", refreshToken)
  },
  clearTokens: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
  },
}

// ==================== TẠO INSTANCE ====================
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
})

// ==================== INTERCEPTOR: ADD TOKEN ====================
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenManager.getAccessToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    config.withCredentials = true
    return config
  },
  (error) => Promise.reject(error),
)

// ==================== INTERCEPTOR: REFRESH TOKEN ====================
let isRefreshing = false
// array callback func for retry after token refresh
let refreshSubscribers: ((token: string) => void)[] = []

function onRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token))
  refreshSubscribers = []
}

function addRefreshSubscriber(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      if (isRefreshing) {
        // Nếu đang refresh thì chờ token mới
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(apiClient(originalRequest))
          })
        })
      }

      isRefreshing = true

      try {
        const refreshToken = tokenManager.getRefreshToken()
        if (!refreshToken) {
          throw new Error("No refresh token")
        }

        const response = await axios.post(
          `${API_BASE_URL}/admin/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
            withCredentials: true,
          },
        )

        const { access_token, refresh_token } = response.data.data
        tokenManager.setTokens(access_token, refresh_token)

        onRefreshed(access_token)

        // Gửi lại request cũ
        originalRequest.headers.Authorization = `Bearer ${access_token}`
        return apiClient(originalRequest)
      } catch (refreshError) {
        tokenManager.clearTokens()
        window.location.href = "/login"
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  },
)
