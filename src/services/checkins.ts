import { apiClient } from "../lib/axios"
import type { CheckIn, ApiResponse, PaginatedResponse } from "../types"

export interface CheckInRequest {
  userId: string
  deviceId: string
  time?: string
  confident: number
  image: File
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "FAKE"
}

export interface CheckIn4EmpRequest {
  userIds: string[]
  time: string
  deviceId: string | null
}

export interface UpdateCheckInRequest {
  checkInIds: string[]
  userId?: string
  verificationStatus?: "PENDING" | "APPROVED" | "REJECTED" | "FAKE"
}

export interface CheckInFilters {
  name?: string
  confidentLowerBound?: number
  confidentUpperBound?: number
  verificationStatus?: string
  startTime?: string
  endTime?: string
  branchId?: string
  me?: boolean
  page?: number
  total?: number
  sortBy?: string
  sortDir?: 'asc' | 'desc'
}

export interface ImageProcessRequest {
  userId: string
  checkInIds: string[]
}

export const checkInService = {
  getAllCheckIns: async (): Promise<CheckIn[]> => {
    const response = await apiClient.get<ApiResponse<CheckIn[]>>("/user/check-in/get-all")
    return response.data.data
  },

  getCheckInsByStatus: async (status?: string): Promise<CheckIn[]> => {
    const response = await apiClient.get<ApiResponse<CheckIn[]>>("/user/check-in", {
      params: { status },
    })
    return response.data.data
  },

  getCheckInsBySpec: async (filters: CheckInFilters): Promise<PaginatedResponse<CheckIn>> => {
    const response = await apiClient.get<ApiResponse<PaginatedResponse<CheckIn>>>("/user/check-in/spec", {
      params: filters,
    })
    return response.data.data
  },

  getMyCheckIns: async (): Promise<CheckIn[]> => {
    const response = await apiClient.get<ApiResponse<CheckIn[]>>("/user/check-in/me")
    return response.data.data
  },

  getCheckInById: async (id: string): Promise<CheckIn> => {
    const response = await apiClient.get<ApiResponse<CheckIn>>(`/user/check-in/${id}`)
    return response.data.data
  },

  createCheckIn: async (checkInData: CheckInRequest): Promise<CheckIn> => {
    const formData = new FormData()
    formData.append("userId", checkInData.userId.toString())
    formData.append("deviceId", checkInData.deviceId.toString())
    formData.append("confident", checkInData.confident.toString())
    formData.append("image", checkInData.image)
    formData.append("verificationStatus", checkInData.verificationStatus)
    if (checkInData.time) {
      formData.append("time", checkInData.time)
    }

    const response = await apiClient.post<ApiResponse<CheckIn>>("/user/check-in", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    return response.data.data
  },

  checkInForEmployee: async (data: CheckIn4EmpRequest): Promise<void> => {
    await apiClient.post("/user/check-in/for-employee", data)
  },

  updateCheckIn: async (id: string, data: UpdateCheckInRequest): Promise<CheckIn> => {
    const response = await apiClient.put<ApiResponse<CheckIn>>(`/user/check-in/${id}`, data)
    return response.data.data
  },

  updateCheckIns: async (data: UpdateCheckInRequest): Promise<void> => {
    await apiClient.put("/user/check-in/update", data)
  },

  deleteCheckIn: async (id: string): Promise<void> => {
    await apiClient.delete(`/user/check-in/${id}`)
  },

  localSetUp: async (data: UpdateCheckInRequest): Promise<ApiResponse<string>> => {
    const response = await apiClient.post<ApiResponse<string>>('/user/check-in/train', data)
    return response.data
  }
}
