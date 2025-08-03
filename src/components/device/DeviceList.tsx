import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { deviceService, DeviceQuery, DeviceRequest } from "../../services/devices";
import { branchService } from "../../services/branches";
import {
    Table,
    TableHeader,
    TableBody,
    TableRow,
    TableHead,
    TableCell,
} from "../ui/Table";
import { Button } from "../ui/Button";
import { Edit, Trash2, Plus, Search, ChevronDown } from "lucide-react";
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
                    aria-label={`Select device status, current: ${selectedOption.label}`}
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
                    <ChevronDown
                        className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                    />
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

// Custom Branch Dropdown Component
const BranchDropdown = ({ value, onChange, branches, isLoading, placeholder = "Select a branch" }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedBranch = branches?.find((branch) => branch.id === value);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (isLoading) {
        return (
            <div className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-500 bg-gray-50">
                Loading branches...
            </div>
        );
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full flex items-center justify-between border border-gray-300 bg-white px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 focus:outline-none transition-colors hover:border-gray-400 ${
                    !selectedBranch ? "text-gray-400" : "text-gray-700"
                }`}
                aria-expanded={isOpen}
            >
                <span className="truncate">
                    {selectedBranch ? selectedBranch.name : placeholder}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {branches && branches.length > 0 ? (
                        branches.map((branch) => (
                            <button
                                key={branch.id}
                                type="button"
                                onClick={() => {
                                    onChange(branch.id);
                                    setIsOpen(false);
                                }}
                                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors ${
                                    branch.id === value ? "bg-cyan-50 text-cyan-700" : "text-gray-700"
                                }`}
                            >
                                <span className="truncate">{branch.name}</span>
                                {branch.id === value && (
                                    <svg className="w-4 h-4 text-cyan-600 flex-shrink-0 ml-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path
                                            fillRule="evenodd"
                                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                            clipRule="evenodd"
                                        />
                                    </svg>
                                )}
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-sm text-gray-500 text-center">
                            No branches available
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export const CreateDeviceModal = ({ onClose }) => {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({ name: "", branchId: null });

    const { data: branches, isLoading: isBranchesLoading } = useQuery({
        queryKey: ["branches"],
        queryFn: () => branchService.getBranches({ page: 0, size: 100 }),
    });

    const createMutation = useMutation({
        mutationFn: (data) => deviceService.createDevice(data),
        onSuccess: () => {
            toast.success("Device created successfully.");
            queryClient.invalidateQueries({ queryKey: ["devices"] });
            onClose();
        },
        onError: (error) => {
            console.error("Create device error:", error);
            toast.error("Failed to create device.");
        },
    });

    const handleCreate = () => {
        if (!formData.name.trim()) {
            toast.error("Device name is required.");
            return;
        }
        if (!formData.branchId) {
            toast.error("Please select a branch.");
            return;
        }
        createMutation.mutate(formData);
    };

    return (
        <Dialog.Root open={true} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg z-50">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
                        Create New Device
                    </Dialog.Title>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-700 font-medium mb-1">
                                Device Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                placeholder="Enter device name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 font-medium mb-1">
                                Branch <span className="text-red-500">*</span>
                            </label>
                            <BranchDropdown
                                value={formData.branchId}
                                onChange={(branchId) => setFormData({ ...formData, branchId })}
                                branches={branches?.content || []}
                                isLoading={isBranchesLoading}
                                placeholder="Select a branch"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Dialog.Close asChild>
                            <Button variant="secondary" className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button
                            className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                            onClick={handleCreate}
                            disabled={!formData.branchId || !formData.name.trim() || createMutation.isLoading}
                        >
                            {createMutation.isLoading ? "Creating..." : "Create"}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export const EditDeviceModal = ({ device, onClose }) => {
    const queryClient = useQueryClient();

    // Khởi tạo formData với giá trị mặc định
    const [formData, setFormData] = useState({
        name: "",
        branchId: null as string | null,
    });

    const { data: branches, isLoading: isBranchesLoading } = useQuery({
        queryKey: ["branches"],
        queryFn: () => branchService.getBranches({ page: 0, size: 100 }),
    });

    // Cập nhật formData khi device hoặc branches thay đổi
    useEffect(() => {
        if (device && branches?.content) {
            // Tìm branch tương ứng với tên branch của device
            const matchingBranch = branches.content.find(branch => branch.name === device.branch);

            setFormData({
                name: device.name || "",
                branchId: matchingBranch ? matchingBranch.id : device.branchId || null,
            });

            console.log("Updated formData:", {
                name: device.name,
                branchId: matchingBranch ? matchingBranch.id : device.branchId,
                matchingBranch: matchingBranch
            });
        }
    }, [device, branches]);

    const updateMutation = useMutation({
        mutationFn: async (data) => {
            console.log("Sending update device request:", data);
            const response = await deviceService.updateDevice(device.id, data);

            // Lấy thông tin branch mới
            const branchResponse = await branchService.getBranches({ page: 0, size: 1, id: data.branchId });
            const branchName = branchResponse.content[0]?.name || "Unknown Branch";

            return { ...response, branch: branchName };
        },
        onSuccess: (updatedDevice) => {
            toast.success("Device updated successfully.");

            // Cập nhật cache
            queryClient.setQueryData(["devices", 0, {}], (oldData) => {
                if (!oldData?.content) return oldData;
                return {
                    ...oldData,
                    content: oldData.content.map((d) =>
                        d.id === device.id
                            ? {
                                ...d,
                                name: formData.name,
                                branchId: formData.branchId,
                                branch: updatedDevice.branch
                            }
                            : d
                    ),
                };
            });

            queryClient.invalidateQueries({ queryKey: ["devices"] });
            onClose();
        },
        onError: (error) => {
            console.error("Update device error:", error);
            toast.error("Failed to update device.");
        },
    });

    const handleUpdate = () => {
        if (!formData.name.trim()) {
            toast.error("Device name is required.");
            return;
        }
        if (!formData.branchId) {
            toast.error("Please select a valid branch.");
            return;
        }

        console.log("Updating device with formData:", formData);
        updateMutation.mutate(formData);
    };

    // Đảm bảo device tồn tại trước khi render
    if (!device) {
        return null;
    }

    return (
        <Dialog.Root open={true} onOpenChange={onClose}>
            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-black/50 z-50" />
                <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-lg p-6 w-full max-w-md shadow-lg z-50">
                    <Dialog.Title className="text-xl font-semibold text-gray-900 mb-4">
                        Edit Device
                    </Dialog.Title>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm text-gray-700 font-medium mb-1">
                                Device Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                                placeholder="Enter device name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm text-gray-700 font-medium mb-1">
                                Branch <span className="text-red-500">*</span>
                            </label>
                            <BranchDropdown
                                value={formData.branchId}
                                onChange={(branchId) => {
                                    console.log("Selected Branch ID:", branchId);
                                    setFormData({ ...formData, branchId });
                                }}
                                branches={branches?.content || []}
                                isLoading={isBranchesLoading}
                                placeholder="Select a branch"
                            />
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end gap-2">
                        <Dialog.Close asChild>
                            <Button variant="secondary" className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg">
                                Cancel
                            </Button>
                        </Dialog.Close>
                        <Button
                            className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                            onClick={handleUpdate}
                            disabled={!formData.branchId || !formData.name.trim() || updateMutation.isLoading}
                        >
                            {updateMutation.isLoading ? "Saving..." : "Save"}
                        </Button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export const DeviceList = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(0);
    const size = 10;
    const [filters, setFilters] = useState({ name: "", activeStatus: "" });
    const [searchParams, setSearchParams] = useState({ name: "", activeStatus: "" });
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editingDevice, setEditingDevice] = useState(null);

    const { data, isLoading } = useQuery({
        queryKey: ["devices", page, searchParams],
        queryFn: () => {
            const cleanParams = { ...searchParams, page, size };
            if (!cleanParams.activeStatus) delete cleanParams.activeStatus;
            return deviceService.getDevices(cleanParams);
        },
        keepPreviousData: true,
    });

    useEffect(() => {
        console.log("Devices from API:", data?.content);
    }, [data]);

    const toggleStatusMutation = useMutation({
        mutationFn: ({ id, status }) => deviceService.changeStatus(id, status),
        onSuccess: () => {
            toast.success("Status updated successfully.");
            queryClient.invalidateQueries({ queryKey: ["devices"] });
        },
        onError: () => {
            toast.error("Failed to update status.");
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (ids) => deviceService.deleteDevices(ids),
        onSuccess: () => {
            toast.success("Device deleted successfully.");
            queryClient.invalidateQueries({ queryKey: ["devices"] });
        },
        onError: () => {
            toast.error("Failed to delete device.");
        },
    });

    const devices = data?.content ?? [];
    const totalPages = data?.totalPages ?? 0;

    if (isLoading) {
        return <div className="text-center py-10 text-gray-600">Loading...</div>;
    }

    return (
        <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-900">Device Management</h2>
                <Button
                    className="bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg"
                    onClick={() => setCreateModalOpen(true)}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Device
                </Button>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-sm text-gray-700 font-medium mb-1">Device Name</label>
                        <input
                            type="text"
                            value={filters.name}
                            onChange={(e) => setFilters((prev) => ({ ...prev, name: e.target.value }))}
                            className="w-full border border-gray-300 px-3 py-2 rounded-md text-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-colors"
                            placeholder="Search by device name..."
                        />
                    </div>

                    <StatusDropdown
                        value={filters.activeStatus}
                        onChange={(value) => setFilters((prev) => ({ ...prev, activeStatus: value }))}
                    />

                    <div>
                        <Button
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
                            <TableHead className="text-center text-gray-700 font-semibold">Device Name</TableHead>
                            <TableHead className="text-center text-gray-700 font-semibold">Branch</TableHead>
                            <TableHead className="text-center text-gray-700 font-semibold">Status</TableHead>
                            <TableHead className="text-center text-gray-700 font-semibold">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {devices.map((device) => (
                            <TableRow key={device.id}>
                                <TableCell className="text-center">{device.name}</TableCell>
                                <TableCell className="text-center">{device.branch}</TableCell>
                                <TableCell className="text-center">
                                    <Button
                                        size="sm"
                                        className={`
                                            w-[100px] mx-auto rounded-full px-3 py-1 ring-1 text-xs
                                            ${device.activeStatus === "ACTIVE"
                                            ? "bg-green-100 text-green-700 hover:bg-green-200 ring-green-300"
                                            : "bg-red-100 text-red-700 hover:bg-red-200 ring-red-300"
                                        } !rounded-full
                                        `}
                                        onClick={() =>
                                            toggleStatusMutation.mutate({
                                                id: device.id,
                                                status: device.activeStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                                            })
                                        }
                                    >
                                        {device.activeStatus === "ACTIVE" ? "Active" : "Inactive"}
                                    </Button>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex gap-2 justify-center">
                                        <Button
                                            size="sm"
                                            className="bg-teal-500 hover:bg-teal-600 text-white rounded-lg"
                                            onClick={() => {
                                                console.log("Opening EditDeviceModal for device:", device);
                                                // Truyền đầy đủ thông tin thiết bị để modal có thể hiển thị
                                                setEditingDevice({
                                                    id: device.id,
                                                    name: device.name,
                                                    branchId: device.branchId, // Có thể null nếu API không trả về
                                                    branch: device.branch, // Tên branch để so sánh
                                                    activeStatus: device.activeStatus
                                                });
                                            }}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="danger"
                                            className="bg-red-500 hover:bg-red-600 text-white rounded-lg"
                                            onClick={() => setDeleteTargetId(device.id)}
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
                    size="sm"
                    disabled={page === 0}
                    onClick={() => setPage((prev) => prev - 1)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                >
                    Previous
                </Button>
                <span className="text-gray-600">Page {page + 1} / {totalPages}</span>
                <Button
                    size="sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((prev) => prev + 1)}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg"
                >
                    Next
                </Button>
            </div>

            {createModalOpen && <CreateDeviceModal onClose={() => setCreateModalOpen(false)} />}
            {editingDevice && (
                <EditDeviceModal
                    device={editingDevice}
                    onClose={() => setEditingDevice(null)}
                />
            )}
            {deleteTargetId !== null && (
                <ConfirmDeleteModal
                    open={true}
                    itemName="this device"
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