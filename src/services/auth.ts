import { apiClient } from "../lib/axios"
import type { AuthResponse, ApiResponse } from "../types"

export interface LoginRequest {
  email: string
  password: string
}

export const authService = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/admin/auth/login", credentials)
    return response.data.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post("/admin/auth/logout")
  },

  refresh: async (): Promise<AuthResponse> => {
    const response = await apiClient.post<ApiResponse<AuthResponse>>("/admin/auth/refresh")
    return response.data.data
  },
}
