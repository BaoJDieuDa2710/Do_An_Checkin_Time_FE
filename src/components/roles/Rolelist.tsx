import React, { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { roleService } from "../../services/roles";
import { CreateRoleModal, EditRoleModal } from "./RoleModal"
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../ui/Table";
import { Button } from "../ui/Button";
import { Edit, Trash2, Plus, Search, Key } from "lucide-react";
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
        { value: "INACTIVE", label: "Inactive", color: "red" }
    ];

    const selectedOption = statusOptions.find(option => option.value === value) || statusOptions[0];

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="min-w-[140px]" ref={dropdownRef}>
            <label className="block text-sm text-gray-700 font-medium mb-1">
                Status
            </label>
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-colors hover:border-gray-400"
                >
                    <div className="flex items-center gap-2">
                        {selectedOption.color !== 'gray' && (
                            <span className={`w-2 h-2 rounded-full ${
                                selectedOption.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                            }`}></span>
                        )}
                        <span className="text-gray-700">{selectedOption.label}</span>
                    </div>
                    <svg
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
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
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 outline-none transition-colors ${
                                    option.value === value ? 'bg-cyan-50 text-cyan-700' : 'text-gray-700'
                                } ${index === 0 ? 'rounded-t-md' : ''} ${index === statusOptions.length - 1 ? 'rounded-b-md' : ''}`}
                            >
                                {option.color !== 'gray' && (
                                    <span className={`w-2 h-2 rounded-full ${
                                        option.color === 'green' ? 'bg-green-500' : 'bg-red-500'
                                    }`}></span>
                                )}
                                <span className="flex-1">{option.label}</span>
                                {option.value === value && (
                                    <svg className="w-4 h-4 text-cyan-600" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
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

const AssignPermissionsModal = ({ role, onClose }) => {
    const queryClient = useQueryClient();
    const [selectedUnassigned, setSelectedUnassigned] = useState([]);
    const [selectedAssigned, setSelectedAssigned] = useState([]);

    // Thêm state cho tìm kiếm
    const [unassignedSearch, setUnassignedSearch] = useState("");
    const [assignedSearch, setAssignedSearch] = useState("");

    // Fetch all permissions
    const { data: allPermissionsData, isLoading: isLoadingAll } = useQuery({
        queryKey: ["permissions"],
        queryFn: () => roleService.getPermissions({ page: 0, size: 1000 }),
    });

    // Fetch permissions assigned to the role
    const { data: rolePermissions = [], isLoading: isLoadingRole } = useQuery({
        queryKey: ["rolePermissions", role.id],
        queryFn: () => roleService.getRolePermissions(role.id),
    });

    // Mutation to assign permissions
    const assignMutation = useMutation({
        mutationFn: (permissionIds) => roleService.assignPermissions(role.id, permissionIds),
        onSuccess: () => {
            toast.success("Permissions assigned successfully.");
            queryClient.invalidateQueries({ queryKey: ["rolePermissions", role.id] });
            setSelectedUnassigned([]);
        },
        onError: (error) => {
            const message = error.response?.data?.message || error.message || "Failed to assign permissions.";
            toast.error(message);
        },
    });

    // Mutation to remove permissions
    const removeMutation = useMutation({
        mutationFn: (permissionIds) => roleService.removePermissions(role.id, permissionIds),
        onSuccess: () => {
            toast.success("Permissions removed successfully.");
            queryClient.invalidateQueries({ queryKey: ["rolePermissions", role.id] });
            setSelectedAssigned([]);
        },
        onError: (error) => {
            const message = error.response?.data?.message || error.message || "Failed to remove permissions.";
            toast.error(message);
        },
    });

    const allPermissions = allPermissionsData?.content ?? [];
    const unassignedPermissions = allPermissions.filter(
        (perm) => !rolePermissions.some((rp) => rp.id === perm.id)
    );

    // Lọc permissions dựa trên tìm kiếm
    const filteredUnassignedPermissions = useMemo(() => {
        if (!unassignedSearch.trim()) return unassignedPermissions;
        return unassignedPermissions.filter(perm =>
            perm.name.toLowerCase().includes(unassignedSearch.toLowerCase()) ||
            (perm.description && perm.description.toLowerCase().includes(unassignedSearch.toLowerCase()))
        );
    }, [unassignedPermissions, unassignedSearch]);

    const filteredAssignedPermissions = useMemo(() => {
        if (!assignedSearch.trim()) return rolePermissions;
        return rolePermissions.filter(perm =>
            perm.name.toLowerCase().includes(assignedSearch.toLowerCase()) ||
            (perm.description && perm.description.toLowerCase().includes(assignedSearch.toLowerCase()))
        );
    }, [rolePermissions, assignedSearch]);

    const handleSelectUnassigned = (id) => {
        setSelectedUnassigned((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const handleSelectAssigned = (id) => {
        setSelectedAssigned((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    const handleAssign = () => {
        if (selectedUnassigned.length > 0) {
            assignMutation.mutate(selectedUnassigned);
        }
    };

    const handleRemove = () => {
        if (selectedAssigned.length > 0) {
            removeMutation.mutate(selectedAssigned);
        }
    };

    if (isLoadingAll || isLoadingRole) {
        return <div className="text-center py-10 text-gray-600">Loading...</div>;
    }

    return (
        <Dialog.Root open={true} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-4xl shadow-lg z-50 max-h-[90vh] overflow-hidden outline-none">
                    <Dialog.Title className="text-xl font-bold text-gray-900 mb-4 font-['Inter',_'system-ui',_sans-serif]">
                        Assign Permissions to {role.name}
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-gray-700 mb-4 font-['Inter',_'system-ui',_sans-serif]">
                        Select permissions to assign or remove from the role.
                    </Dialog.Description>

                    <div className="flex gap-4 h-[600px]">
                        {/* Unassigned Permissions Section */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-800 font-['Inter',_'system-ui',_sans-serif]">
                                    Unassigned Permissions ({filteredUnassignedPermissions.length})
                                </h3>
                            </div>

                            {/* Search box cho Unassigned */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={unassignedSearch}
                                    onChange={(e) => setUnassignedSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                    placeholder="Search unassigned permissions..."
                                />
                            </div>

                            <div className="border border-gray-300 rounded-md flex-1 overflow-y-auto">
                                {filteredUnassignedPermissions.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8 font-['Inter',_'system-ui',_sans-serif]">
                                        {unassignedSearch.trim() ? "No permissions found" : "No unassigned permissions"}
                                    </p>
                                ) : (
                                    filteredUnassignedPermissions.map((perm) => (
                                        <div
                                            key={perm.id}
                                            className={`p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 outline-none ${
                                                selectedUnassigned.includes(perm.id) ? "bg-blue-50 border-blue-200 shadow-sm" : ""
                                            }`}
                                            onClick={() => handleSelectUnassigned(perm.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedUnassigned.includes(perm.id)}
                                                    onChange={() => {}} // Để trống vì sự kiện được xử lý bởi div cha
                                                    className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-0 focus:ring-offset-0 accent-blue-600 outline-none pointer-events-none"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate font-['Inter',_'system-ui',_sans-serif]">{perm.name}</p>
                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 font-['Inter',_'system-ui',_sans-serif]">
                                                        {perm.description || "No description"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-col justify-center gap-3 px-2">
                            <Button
                                className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg px-4 py-2 min-w-[80px] font-['Inter',_'system-ui',_sans-serif] transition-all duration-200 shadow-sm hover:shadow-md outline-none"
                                onClick={handleAssign}
                                disabled={selectedUnassigned.length === 0 || assignMutation.isPending}
                                title="Assign selected permissions"
                            >
                                <span className="text-lg">→</span>
                            </Button>
                            <Button
                                className="bg-red-500 hover:bg-red-600 text-white rounded-lg px-4 py-2 min-w-[80px] font-['Inter',_'system-ui',_sans-serif] transition-all duration-200 shadow-sm hover:shadow-md outline-none"
                                onClick={handleRemove}
                                disabled={selectedAssigned.length === 0 || removeMutation.isPending}
                                title="Remove selected permissions"
                            >
                                <span className="text-lg">←</span>
                            </Button>
                        </div>

                        {/* Assigned Permissions Section */}
                        <div className="flex-1 flex flex-col">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-bold text-gray-800 font-['Inter',_'system-ui',_sans-serif]">
                                    Assigned Permissions ({filteredAssignedPermissions.length})
                                </h3>
                            </div>

                            {/* Search box cho Assigned */}
                            <div className="relative mb-3">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    value={assignedSearch}
                                    onChange={(e) => setAssignedSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                                    placeholder="Search assigned permissions..."
                                />
                            </div>

                            <div className="border border-gray-300 rounded-md flex-1 overflow-y-auto">
                                {filteredAssignedPermissions.length === 0 ? (
                                    <p className="text-center text-gray-500 py-8 font-['Inter',_'system-ui',_sans-serif]">
                                        {assignedSearch.trim() ? "No permissions found" : "No assigned permissions"}
                                    </p>
                                ) : (
                                    filteredAssignedPermissions.map((perm) => (
                                        <div
                                            key={perm.id}
                                            className={`p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 transition-all duration-200 outline-none ${
                                                selectedAssigned.includes(perm.id) ? "bg-blue-50 border-blue-200 shadow-sm" : ""
                                            }`}
                                            onClick={() => handleSelectAssigned(perm.id)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedAssigned.includes(perm.id)}
                                                    onChange={() => {}} // Để trống vì sự kiện được xử lý bởi div cha
                                                    className="mt-1 w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-0 focus:ring-offset-0 accent-blue-600 outline-none pointer-events-none"
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-semibold text-gray-800 truncate font-['Inter',_'system-ui',_sans-serif]">{perm.name}</p>
                                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2 font-['Inter',_'system-ui',_sans-serif]">
                                                        {perm.description || "No description"}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 flex justify-between items-center">
                        <div className="text-sm text-gray-700 font-['Inter',_'system-ui',_sans-serif]">
                            Selected: <span className="font-semibold text-blue-600">{selectedUnassigned.length}</span> unassigned, <span className="font-semibold text-blue-600">{selectedAssigned.length}</span> assigned
                        </div>
                        <div className="flex gap-2">
                            <Dialog.Close asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg outline-none"
                                >
                                    Close
                                </Button>
                            </Dialog.Close>
                        </div>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export const RoleList = () => {
    const queryClient = useQueryClient();
    const size = 10;
    const [page, setPage] = useState(0);
    const [filters, setFilters] = useState({ name: "", activeStatus: "" });
    const [searchParams, setSearchParams] = useState({ name: "", activeStatus: "" });
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [createOpen, setCreateOpen] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [assignTarget, setAssignTarget] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ["roles", page, searchParams],
        queryFn: () => {
            const cleanFilters = { ...searchParams };
            if (!cleanFilters.activeStatus) delete cleanFilters.activeStatus;
            return roleService.getRoles({ page, size, ...cleanFilters });
        },
        keepPreviousData: true,
    });

    const toggleStatusMutation = useMutation({
        mutationFn: (id) => {
            console.log("Sending toggle status request:", id);
            return roleService.updateStatus(id);
        },
        onSuccess: () => {
            toast.success("Status updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["roles"] });
        },
        onError: (error) => {
            console.error("Toggle status error:", error);
            const message = error.response?.data?.message || error.message || "Failed to update status.";
            toast.error(message);
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (ids) => {
            console.log("Sending delete role request:", ids);
            return roleService.deleteRole(ids);
        },
        onSuccess: () => {
            toast.success("Role deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["roles"] });
        },
        onError: (error) => {
            console.error("Delete role error:", error);
            const message = error.response?.data?.message || error.message || "Failed to delete role.";
            toast.error(message);
        },
    });

    const roles = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;

    if (isLoading) {
        return <div className="text-center py-10 text-gray-600">Loading...</div>;
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Manage Roles</h2>
                <Button
                    type="button"
                    className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg outline-none"
                    onClick={() => setCreateOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Role
                </Button>
            </div>

            {/* Updated Search Section with Custom Status Dropdown */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-gray-700 font-medium mb-1">
                            Role Name
                        </label>
                        <input
                            type="text"
                            value={filters.name}
                            onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 outline-none transition-colors"
                            placeholder="Search by role name..."
                            maxLength={100}
                        />
                    </div>

                    {/* Custom Status Dropdown */}
                    <StatusDropdown
                        value={filters.activeStatus}
                        onChange={(value) => setFilters((prev) => ({ ...prev, activeStatus: value }))}
                    />

                    <div>
                        <Button
                            type="button"
                            size="sm"
                            className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-md transition-colors outline-none"
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
                            <TableHead className="text-center text-gray-700 font-semibold">Role Name</TableHead>
                            <TableHead className="text-center text-gray-700 font-semibold">Description</TableHead>
                            <TableHead className="text-center text-gray-700 font-semibold">Status</TableHead>
                            <TableHead className="text-center text-gray-700 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {roles.map((role) => (
                            <TableRow key={role.id}>
                                <TableCell className="text-center">{role.name}</TableCell>
                                <TableCell className="text-center">{role.description || "—"}</TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        size="sm"
                                        className={`
                      w-[100px] mx-auto rounded-full px-3 py-1 ring-1 text-xs outline-none
                      ${role.activeStatus === "ACTIVE"
                                            ? "bg-green-100 text-green-700 hover:bg-green-200 ring-green-300"
                                            : "bg-red-100 text-red-700 hover:bg-red-200 ring-red-300"
                                        } !rounded-full
                    `}
                                        onClick={() => toggleStatusMutation.mutate(role.id)}
                                        disabled={toggleStatusMutation.isPending}
                                    >
                                        {role.activeStatus === "ACTIVE" ? "Active" : "Inactive"}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button
                                            size="sm"
                                            className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg outline-none"
                                            onClick={() => setEditTarget({ id: role.id, name: role.name, description: role.description })}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg outline-none"
                                            onClick={() => setAssignTarget({ id: role.id, name: role.name })}
                                        >
                                            <Key className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            className="bg-red-500 hover:bg-red-600 text-white rounded-lg outline-none"
                                            onClick={() => setDeleteTargetId(role.id)}
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
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg outline-none"
                >
                    Previous
                </Button>
                <span className="text-gray-600">
          Page {page + 1} / {totalPages}
        </span>
                <Button
                    type="button"
                    size="sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg outline-none"
                >
                    Next
                </Button>
            </div>

            {createOpen && <CreateRoleModal onClose={() => setCreateOpen(false)} />}
            {editTarget && (
                <EditRoleModal
                    role={editTarget}
                    onClose={() => setEditTarget(null)}
                />
            )}
            {deleteTargetId !== null && (
                <ConfirmDeleteModal
                    open={true}
                    itemName="this role"
                    onCancel={() => setDeleteTargetId(null)}
                    onConfirm={() => {
                        deleteMutation.mutate([deleteTargetId]);
                        setDeleteTargetId(null);
                    }}
                />
            )}
            {assignTarget && (
                <AssignPermissionsModal
                    role={assignTarget}
                    onClose={() => setAssignTarget(null)}
                />
            )}
        </div>
    );
};