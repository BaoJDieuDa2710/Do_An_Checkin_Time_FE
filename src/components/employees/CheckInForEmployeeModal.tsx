"use client"

import React, { useState, useEffect } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { checkInService, type CheckIn4EmpRequest } from "../../services/checkins"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import type { User } from "../../types"
import { format } from "date-fns"
import { Modal } from "../ui/Modal"
import { deviceService } from "../../services/devices"
import GenericDropdown from "../ui/GenericDropdown"
import toast from 'react-hot-toast';

interface CheckInForEmployeeModalProps {
    isOpen: boolean
    onClose: () => void
    selectedEmployees: User[]
}

export const CheckInForEmployeeModal: React.FC<CheckInForEmployeeModalProps> = ({
    isOpen,
    onClose,
    selectedEmployees,
}) => {
    const queryClient = useQueryClient()

    // === State cho form ===
    const [time, setTime] = useState<string>(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
    const [error, setError] = useState<string | null>(null)
    const [fieldError, setFieldError] = useState<string | null>(null)
    const [page, setPage] = useState(0)
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
    const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)

    const {
        data: devices,
        isLoading,
        refetch,
    } = useQuery({
        queryKey: ["devices", page, debouncedSearchTerm],
        queryFn: () =>
            deviceService.getDevices({ name: debouncedSearchTerm ? debouncedSearchTerm : undefined, page, size: 10 }),
    })

    useEffect(() => {
        if (isOpen) {
            // reset time khi mở lại modal
            setTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
            setError(null)
            setFieldError(null)
            setSelectedDeviceId(null)
        }
    }, [isOpen])

    const checkInMutation = useMutation({
        mutationFn: checkInService.checkInForEmployee,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["checkins"] })
            setTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
            setError(null)
            setFieldError(null)
            onClose()
            toast.success("Employees checked in successfully")
        },
        onError: (err: any) => {
            const errorMessage = err.response?.data?.message || "Failed to check-in employees"
            setError(errorMessage)
            toast.error(errorMessage)
        },
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        // validate thủ công
        if (!time.trim()) {
            setFieldError("Check-in time is required")
            return
        }

        setFieldError(null)

        const checkInData: CheckIn4EmpRequest = {
            userIds: selectedEmployees.map((emp) => emp.id),
            time: format(new Date(time), "yyyy-MM-dd'T'HH:mm"),
            deviceId: selectedDeviceId,
        }

        checkInMutation.mutate(checkInData)
    }

    const handleClose = () => {
        setTime(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
        setError(null)
        setFieldError(null)
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Check-in for Employees" size="lg">
            <div className="space-y-4">
                {/* Selected Employees */}
                <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Selected Employees ({selectedEmployees.length})
                    </h4>
                    <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md p-3">
                        {selectedEmployees.map((employee) => (
                            <div key={employee.id} className="flex items-center space-x-3 py-2">
                                <div className="w-8 h-8 bg-teal-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                    {employee.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                                    <div className="text-xs text-gray-500">{employee.email}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="block text-sm font-medium text-gray-700 mb-0">Select Device *</div>
                    <GenericDropdown
                        items={devices?.content.map((device) => ({
                            label: device.name,
                            value: device.id
                        })) || []}
                        placeholder="Device"
                        onSelect={(value) => setSelectedDeviceId(value as string)}
                    />
                    <Input
                        label="Check-in Time *"
                        type="datetime-local"
                        name="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        error={fieldError || undefined}
                    />


                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3 pt-4">
                        <Button type="button" variant="secondary" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="bg-teal-500 hover:bg-teal-600"
                            disabled={checkInMutation.isPending || selectedEmployees.length === 0 || !selectedDeviceId || !time.trim()}
                        >
                            {checkInMutation.isPending ? "Processing..." : "Check-in Employees"}
                        </Button>
                    </div>
                </form>
            </div>
        </Modal>
    )
}
