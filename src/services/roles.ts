import { apiClient } from "../lib/axios";

export type RoleQuery = {
    name?: string;
    activeStatus?: "ACTIVE" | "INACTIVE";
    page: number;
    size: number;
};

export type RoleRequest = {
    name: string;
    description: string;
};

export const roleService = {
    getRoles: async (params: RoleQuery) => {
        const response = await apiClient.get("/admin/role", { params });
        return response.data.data;
    },

    addRole: async (data: RoleRequest) => {
        const response = await apiClient.post("/admin/role", data);
        return response.data.data;
    },

    updateRole: async (id: string, data: RoleRequest) => {
        const response = await apiClient.patch(`/admin/role/${id}`, data);
        return response.data.data;
    },

    updateStatus: async (id: string) => {
        const response = await apiClient.patch(`/admin/role/active/${id}`);
        return response.data.data;
    },

    deleteRole: async (ids: string[]) => {
        const response = await apiClient.delete(`/admin/role/${ids.join(",")}`);
        return response.data.data;
    },

    // Get all permissions
    getPermissions: async (params: { name?: string; activeStatus?: "ACTIVE" | "INACTIVE"; page?: number; size?: number }) => {
        const response = await apiClient.get("/admin/permission", { params });
        return response.data.data;
    },

    // Get permissions for a specific role
    getRolePermissions: async (roleId: string) => {
        const response = await apiClient.get(`/admin/permission/role/${roleId}`);
        return response.data.data;
    },

    // Assign permissions to a role
    assignPermissions: async (roleId: string, permissionIds: string[]) => {
        const response = await apiClient.put(`/admin/role-perrmission/assignment/${permissionIds.join(",")}`, null, {
            params: { roleId },
        });
        return response.data.data;
    },

    // Remove permissions from a role
    removePermissions: async (roleId: string, permissionIds: string[]) => {
        const response = await apiClient.put(`/admin/role-perrmission/unassignment/${permissionIds.join(",")}`, null, {
            params: { roleId },
        });
        return response.data.data;
    },
};