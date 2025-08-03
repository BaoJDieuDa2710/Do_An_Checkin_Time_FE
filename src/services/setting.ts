import { apiClient } from "../lib/axios"
import type { ApiResponse } from "../types"

export interface CronjobSettingsResponse {
  id?: string
  name: string
  cronExpression: string
  description?: string
  enabled: boolean
}

export interface SettingsRequest {
  cronExpression?: string
  enabled?: boolean
}

export const settingsService = {
  // Get current settings
  getSettings: async (): Promise<CronjobSettingsResponse[]> => {
    try {
      const response = await apiClient.get<ApiResponse<CronjobSettingsResponse[]>>("/admin/settings")
      return response.data.data
    } catch (error) {
      // Return default values if API doesn't exist yet
      return [{
        id: "1",
        name: "Default Cronjob",
        description: "This is a default cronjob setting",
        cronExpression: "0 0 0 * * *", // Daily at midnight
        enabled: true,
      }]
    }
  },

  // Update settings
  updateSettings: async (settings: SettingsRequest, id: string): Promise<CronjobSettingsResponse> => {
    try {
      const response = await apiClient.put<ApiResponse<CronjobSettingsResponse>>(`/admin/settings/${id}`, settings)
      return response.data.data
    } catch (error) {
      // Simulate success for demo purposes
      console.log("Settings updated:", settings)
      return {
        id: "1",
        name: "Default Cronjob",
        description: "This is a default cronjob setting",
        cronExpression: "0 0 0 * * *", // Daily at midnight
        enabled: true,
      }
    }
  },
}
