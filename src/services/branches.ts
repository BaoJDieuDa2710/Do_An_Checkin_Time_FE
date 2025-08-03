import { apiClient } from "../lib/axios"

export const branchService = {
  getBranches: async (params: { page: number; size: number; name?: string; address?: string; active?: string }) => {
    const response = await apiClient.get("/admin/branch", { params })
    return response.data.data
  },

  updateBranch: async (id: string, data: { name: string; address: string }) => {
    const response = await apiClient.patch(`/admin/branch/${id}`, data)
    return response.data.data
  },

  changeStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/admin/branch/active/${id}`, { active: status })
    return response.data.data
  },

  deleteBranches: async (ids: string[]) => {
    const response = await apiClient.delete(`/admin/branch/${ids.join(",")}`)
    return response.data.data
  },

  createBranch: async (data: { name: string; address: string }) => {
    const response = await apiClient.post("/admin/branch", data)
    return response.data.data
  },
}