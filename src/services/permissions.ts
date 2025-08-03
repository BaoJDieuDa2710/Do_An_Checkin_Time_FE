import { apiClient } from "../lib/axios"

export type PermissionRequest = {
    name: string
    description: string
}

export const permissionService = {
    getPermissions: async (params: {
        name?: string
        activeStatus?: "ACTIVE" | "INACTIVE"
        page: number
        size: number
    }) => {
        const response = await apiClient.get("/admin/permission", { params })
        return response.data.data
    },

    addPermission: async (data: { name: string; description: string }) => {
        const response = await apiClient.post("/admin/permission", data)
        return response.data.data
    },

    updatePermission: async (id: string, data: { name: string; description: string }) => {
        const response = await apiClient.patch(`/admin/permission/${id}`, data)
        return response.data.data
    },

    updateStatus: async (id: string) => {
        const response = await apiClient.patch(`/admin/permission/active/${id}`)
        return response.data.data
    },

    deletePermission: async (ids: string[]) => {
        const response = await apiClient.delete(`/admin/permission/${ids.join(",")}`)
        return response.data.data
    },
}