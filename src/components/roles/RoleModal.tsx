import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService, RoleRequest } from "../../services/roles";
import { Button } from "../ui/Button";
import { toast } from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

// CreateRoleModal Component
const CreateRoleModal: React.FC<{
    onClose: () => void;
}> = ({ onClose }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<RoleRequest>({
        name: "",
        description: "",
    });
    const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

    const createMutation = useMutation({
        mutationFn: (data: RoleRequest) => roleService.addRole(data),
        onSuccess: () => {
            toast.success("Role created successfully.");
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            onClose();
        },
        onError: (error: any) => {
            console.error("Create role error:", error);
            const message = error.response?.data?.message || error.message || "Failed to create role.";
            toast.error(message);
        },
    });

    const validateForm = () => {
        const newErrors: { name?: string; description?: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = "Role name is required";
        } else if (formData.name.length > 100) {
            newErrors.name = "Role name must be less than 100 characters";
        }

        if (formData.description && formData.description.length > 255) {
            newErrors.description = "Description must be less than 255 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            createMutation.mutate(formData);
        }
    };

    const handleInputChange = (field: keyof RoleRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <Dialog.Root open={true} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg z-50">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-xl font-semibold text-gray-900">
                            Create New Role
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <Dialog.Description className="text-sm text-gray-600 mb-6">
                        Create a new role by providing a name and description.
                    </Dialog.Description>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                className={`w-full border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                                    errors.name ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Enter role name"
                                maxLength={100}
                                disabled={createMutation.isPending}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                className={`w-full border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none ${
                                    errors.description ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Enter role description (optional)"
                                rows={3}
                                maxLength={255}
                                disabled={createMutation.isPending}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.description.length}/255 characters
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Dialog.Close asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                                    disabled={createMutation.isPending}
                                >
                                    Cancel
                                </Button>
                            </Dialog.Close>
                            <Button
                                type="submit"
                                className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? "Creating..." : "Create Role"}
                            </Button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

// EditRoleModal Component
const EditRoleModal: React.FC<{
    role: { id: string; name: string; description: string };
    onClose: () => void;
}> = ({ role, onClose }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState<RoleRequest>({
        name: role.name,
        description: role.description || "",
    });
    const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

    const updateMutation = useMutation({
        mutationFn: (data: RoleRequest) => roleService.updateRole(role.id, data),
        onSuccess: () => {
            toast.success("Role updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            onClose();
        },
        onError: (error: any) => {
            console.error("Update role error:", error);
            const message = error.response?.data?.message || error.message || "Failed to update role.";
            toast.error(message);
        },
    });

    const validateForm = () => {
        const newErrors: { name?: string; description?: string } = {};

        if (!formData.name.trim()) {
            newErrors.name = "Role name is required";
        } else if (formData.name.length > 100) {
            newErrors.name = "Role name must be less than 100 characters";
        }

        if (formData.description && formData.description.length > 255) {
            newErrors.description = "Description must be less than 255 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateForm()) {
            updateMutation.mutate(formData);
        }
    };

    const handleInputChange = (field: keyof RoleRequest, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    return (
        <Dialog.Root open={true} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg z-50">
                    <div className="flex items-center justify-between mb-4">
                        <Dialog.Title className="text-xl font-semibold text-gray-900">
                            Edit Role
                        </Dialog.Title>
                        <Dialog.Close asChild>
                            <button className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </Dialog.Close>
                    </div>

                    <Dialog.Description className="text-sm text-gray-600 mb-6">
                        Update the role information below.
                    </Dialog.Description>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Role Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                className={`w-full border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none ${
                                    errors.name ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Enter role name"
                                maxLength={100}
                                disabled={updateMutation.isPending}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500 mt-1">{errors.name}</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
                                className={`w-full border px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none resize-none ${
                                    errors.description ? "border-red-500" : "border-gray-300"
                                }`}
                                placeholder="Enter role description (optional)"
                                rows={3}
                                maxLength={255}
                                disabled={updateMutation.isPending}
                            />
                            {errors.description && (
                                <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                                {formData.description.length}/255 characters
                            </p>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Dialog.Close asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                                    disabled={updateMutation.isPending}
                                >
                                    Cancel
                                </Button>
                            </Dialog.Close>
                            <Button
                                type="submit"
                                className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? "Updating..." : "Update Role"}
                            </Button>
                        </div>
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export { CreateRoleModal, EditRoleModal };