import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { permissionService } from "../../services/permissions";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../ui/Table";
import { Button } from "../ui/Button";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { ConfirmDeleteModal } from "../common/ConfirmDeleteModal";
import { toast } from "react-hot-toast";
import * as Dialog from "@radix-ui/react-dialog";

// Custom Status Dropdown Component
const StatusDropdown = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const statusOptions = [
        { value: "", label: "All Status", color: "gray" },
        { value: "ACTIVE", label: "Active", color: "green" },
        { value: "INACTIVE", label: "Inactive", color: "red" },
    ];

    const selectedOption = statusOptions.find((option) => option.value === value) || statusOptions[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="min-w-[140px]" ref={dropdownRef}>
            <label className="block text-sm text-gray-700 font-medium mb-1">Status</label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-colors hover:border-gray-400"
                    aria-label={`Select permission status, current: ${selectedOption.label}`}
                    aria-expanded={isOpen}
                >
                    <div className="flex items-center gap-2">
                        {selectedOption.color !== "gray" && (
                            <span
                                className={`w-2 h-2 rounded-full ${
                                    selectedOption.color === "green" ? "bg-green-500" : "bg-red-500"
                                }`}
                            ></span>
                        )}
                        <span className="text-gray-700">{selectedOption.label}</span>
                    </div>
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {isOpen && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {statusOptions.map((option, index) => (
                            <button
                                key={option.value}
                                type="button"
                                onClick={() => {
                                    onChange(option.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                                    option.value === value ? "bg-cyan-50 text-cyan-700" : "text-gray-700"
                                } ${index === 0 ? "rounded-t-md" : ""} ${index === statusOptions.length - 1 ? "rounded-b-md" : ""}`}
                            >
                                {option.color !== "gray" && (
                                    <span
                                        className={`w-2 h-2 rounded-full ${
                                            option.color === "green" ? "bg-green-500" : "bg-red-500"
                                        }`}
                                    ></span>
                                )}
                                <span className="flex-1">{option.label}</span>
                                {option.value === value && (
                                    <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export const CreatePermissionModal = ({ onClose }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ name: "", description: "" });

    const createMutation = useMutation({
        mutationFn: (data) => {
            console.log("Sending create permission request:", data);
            return permissionService.addPermission(data);
        },
        onSuccess: () => {
            toast.success("Permission created successfully.");
            queryClient.invalidateQueries({ queryKey: ["permissions"] });
            onClose();
        },
        onError: (error) => {
            console.error("Create permission error:", error);
            const message = error.response?.data?.message || error.message || "Failed to create permission.";
            toast.error(message);
        },
    });

    const handleCreate = () => {
        if (!formData.name.trim()) {
            toast.error("Permission name is required.");
            return;
        }
        const trimmedData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
        };
        createMutation.mutate(trimmedData);
    };

    return (
        <Dialog.Root open={true} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg z-50">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
                        Create New Permission
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-600 mb-4">
                        Enter details to create a new permission.
                    </Dialog.Description>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-700 font-medium mb-1">Permission Name</label>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                placeholder="Enter permission name"
                                maxLength={100}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 font-medium mb-1">Description</label>
                            <input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                placeholder="Enter description"
                                maxLength={255}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Dialog.Close asChild>
                            <Button
                                type="button"
                                variant="secondary"
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                            >
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button
                            type="button"
                            className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                            onClick={handleCreate}
                            disabled={createMutation.isPending}
                        >
                            Create
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export const EditPermissionModal = ({ permission, onClose }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        name: permission.name,
        description: permission.description,
    });

    const updateMutation = useMutation({
        mutationFn: (data) => {
            console.log("Sending update permission request:", data);
            return permissionService.updatePermission(permission.id, data);
        },
        onSuccess: () => {
            toast.success("Permission updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["permissions"] });
            onClose();
        },
        onError: (error) => {
            console.error("Update permission error:", error);
            const message = error.response?.data?.message || error.message || "Failed to update permission.";
            toast.error(message);
        },
    });

    const handleUpdate = () => {
        if (!formData.name.trim()) {
            toast.error("Permission name is required.");
            return;
        }
        const trimmedData = {
            name: formData.name.trim(),
            description: formData.description.trim(),
        };
        updateMutation.mutate(trimmedData);
    };

    return (
        <Dialog.Root open={true} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg z-50">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
                        Edit Permission
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-600 mb-4">
                        Edit the details of the existing permission.
                    </Dialog.Description>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-700 font-medium mb-1">Permission Name</label>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                placeholder="Enter permission name"
                                maxLength={100}
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 font-medium mb-1">Description</label>
                            <input
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                placeholder="Enter description"
                                maxLength={255}
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Dialog.Close asChild>
                            <Button
                                type="button"
                                variant="secondary"
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                            >
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button
                            type="button"
                            className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                            onClick={handleUpdate}
                            disabled={updateMutation.isPending}
                        >
                            Save
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export const PermissionList = () => {
    const queryClient = useQueryClient();
    const size = 10;
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState({ name: "", activeStatus: "" });
    const [searchParams, setSearchParams] = useState({ name: "", activeStatus: "" });
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ["permissions", page, searchParams],
        queryFn: () => {
            const cleanParams = {
                page,
                size,
                name: searchParams.name.trim(),
            };
            if (searchParams.activeStatus) cleanParams.activeStatus = searchParams.activeStatus;
            return permissionService.getPermissions(cleanParams);
        },
        keepPreviousData: true,
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (id) => permissionService.updateStatus(id),
        onSuccess: () => {
            toast.success("Status updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["permissions"] });
        },
        onError: (error) => {
            console.error("Toggle status error:", error);
            const message = error.response?.data?.message || error.message || "Failed to update status.";
            toast.error(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (ids) => permissionService.deletePermission(ids),
        onSuccess: () => {
            toast.success("Permission deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["permissions"] });
        },
        onError: (error) => {
            console.error("Delete permission error:", error);
            const message = error.response?.data?.message || error.message || "Failed to delete permission.";
            toast.error(message);
        },
    });

    const permissions = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;

    if (isLoading) {
        return <div className="text-center py-10 text-gray-600">Loading...</div>;
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Permission Management</h2>
                <Button
                    type="button"
                    className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Permission
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-gray-700 font-medium mb-1">
                            Permission Name
                        </label>
                        <input
                            type="text"
                            value={filters.name}
                            onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                            placeholder="Search by permission name..."
                            maxLength={100}
                        />
                    </div>

                    <StatusDropdown
                        value={filters.activeStatus}
                        onChange={(value) => setFilters((prev) => ({ ...prev, activeStatus: value }))}
                    />

                    <div>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-md transition-colors"
                            onClick={() => {
                                setPage(0);
                                setSearchParams({ ...filters });
                            }}
                        >
                            <Search className="w-4 h-4 mr-1" />
                            Search
                        </Button>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-x-auto">
                <Table className="w-full">
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center text-gray-700 font-semibold">Permission Name</TableHead>
                            <TableHead className="text-center text-gray-700 font-semibold">Description</TableHead>
                            <TableHead className="text-center text-gray-700 font-semibold">Status</TableHead>
                            <TableHead className="text-center text-gray-700 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {permissions.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="text-center">{item.name}</TableCell>
                                <TableCell className="text-center">{item.description || "—"}</TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        size="sm"
                                        className={`
                                            w-[100px] mx-auto rounded-full px-3 py-1 ring-1 text-xs
                                            ${item.activeStatus === "ACTIVE"
                                            ? "bg-green-100 text-green-700 hover:bg-green-200 ring-green-300"
                                            : "bg-red-100 text-red-700 hover:bg-red-200 ring-red-300"
                                        } !rounded-full
                                        `}
                                        onClick={() => toggleStatusMutation.mutate(item.id)}
                                        disabled={toggleStatusMutation.isPending}
                                    >
                                        {item.activeStatus === "ACTIVE" ? "Active" : "Inactive"}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button
                                            size="sm"
                                            className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
                                            onClick={() => setEditTarget(item)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                            onClick={() => setDeleteTargetId(item.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="flex justify-end items-center gap-2">
                <Button
                    type="button"
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((prev) => prev - 1)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                >
                    Previous
                </Button>
                <span className="text-gray-600">Page {page + 1} / {totalPages}</span>
                <Button
                    type="button"
                    size="sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                >
                    Next
                </Button>
            </div>

            {createOpen && <CreatePermissionModal onClose={() => setCreateOpen(false)} />}
            {editTarget && (
                <EditPermissionModal
                    permission={editTarget}
                    onClose={() => setEditTarget(null)}
                />
            )}
            {deleteTargetId !== null && (
                <ConfirmDeleteModal
                    open={true}
                    itemName="this permission"
                    onCancel={() => setDeleteTargetId(null)}
                    onConfirm={() => {
                        deleteMutation.mutate([deleteTargetId]);
                        setDeleteTargetId(null);
                    }}
                />
            )}
        </div>
    );
};