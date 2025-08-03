import { apiClient } from "../lib/axios"
import type { User, ApiResponse, PaginatedResponse, JobResponse } from "../types"

export interface UserRequest {
  email: string
  phone?: string
  name: string
  address?: string
  dateOfBirth?: string
  gender?: "MALE" | "FEMALE"
  activeStatus?: "ACTIVE" | "INACTIVE"
  roleIds?: string[]
}

export interface UpdateUserRequest extends UserRequest {
  password?: string
}

export const userService = {
  getAllUsers: async (
    page = 0, 
    size = 10, 
    name?: string, 
    sortBy?: string, 
    sortDir?: 'asc' | 'desc'
  ): Promise<PaginatedResponse<User>> => {
    const params: any = { page, size }
    if (name) params.name = name
    if (sortBy) params.sortBy = sortBy
    if (sortDir) params.sortDir = sortDir
    
    const response = await apiClient.get<ApiResponse<PaginatedResponse<User>>>("/admin/user/get-all", {
      params
    })
    return response.data.data
  },

  getUserById: async (id: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/admin/user/${id}`)
    return response.data.data
  },

  getUserByEmail: async (email: string): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>(`/admin/user/email/${email}`)
    return response.data.data
  },

  getMyself: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>("/admin/user/me")
    return response.data.data
  },

  createUser: async (userData: UserRequest): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>("/admin/user", userData)
    return response.data.data
  },

  updateUser: async (id: string, userData: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.post<ApiResponse<User>>(`/admin/user/update/${id}`, userData)
    return response.data.data
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete(`/admin/user/${id}`)
  },

  syncFromHRM: async (): Promise<JobResponse> => {
    const response = await apiClient.post<ApiResponse<JobResponse>>("/admin/user/sync-from-hrm")
    return response.data.data
  },

  searchUsers: async (params: { name?: string;}): Promise<User[]> => {
    const response = await apiClient.get<ApiResponse<User[]>>("/admin/user/search", { params })
    return response.data.data
  },

  getJobStatus: async (jobId: string): Promise<JobResponse> => {
    const response = await apiClient.get<ApiResponse<JobResponse>>(`/admin/job/${jobId}`)
    return response.data.data
  },
}
