import { apiClient } from "../lib/axios"

export type DeviceQuery = {
    name?: string
    activeStatus?: "ACTIVE" | "INACTIVE"
    page: number
    size: number
}

export type DeviceRequest = {
    name: string
    branchId: string // Changed from number to string for UUID support
}

export const deviceService = {
    getDevices: async (params: DeviceQuery) => {
        const cleanParams = { ...params }
        if (!cleanParams.activeStatus) delete cleanParams.activeStatus // Remove empty activeStatus filter
        const response = await apiClient.get("/admin/device", { params: cleanParams })
        return response.data.data
    },

    createDevice: async (data: DeviceRequest) => {
        const response = await apiClient.post("/admin/device", data)
        return response.data.data // Returns the ID of the created device
    },

    updateDevice: async (id: string, data: DeviceRequest) => {
        const response = await apiClient.patch(`/admin/device/${id}`, data)
        return response.data.data // Returns the message from the backend
    },

    changeStatus: async (id: string, status: "ACTIVE" | "INACTIVE") => {
        const response = await apiClient.patch(`/admin/device/active/${id}`, { activeStatus: status })
        return response.data.data // Returns the message from the backend
    },

    deleteDevices: async (ids: string[]) => {
        const response = await apiClient.delete(`/admin/device/${ids.join(",")}`)
        return response.data.data // Returns the message from the backend
    },
}