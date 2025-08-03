"use client"

import React, { useState } from "react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { userService, type UserRequest } from "../../services/users"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"
import { Select } from "../ui/Select"
import toast from 'react-hot-toast';
import { useQuery } from "@tanstack/react-query"
import { roleService } from "../../services/roles"

interface CreateEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
}

export const CreateEmployeeModal: React.FC<CreateEmployeeModalProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient()

  const [form, setForm] = useState<UserRequest>({
    name: "",
    email: "",
    phone: "",
    gender: undefined,
    dateOfBirth: "",
    address: "",
    activeStatus: "ACTIVE",
    roleIds: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [rootError, setRootError] = useState<string | null>(null)

  const createUserMutation = useMutation({
    mutationFn: (userData: UserRequest) => {
      return userService.createUser(userData)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setForm({
        name: "",
        email: "",
        phone: undefined,
        gender: undefined,
        dateOfBirth: undefined,
        address: undefined,
        activeStatus: "ACTIVE",
        roleIds: [],
      })
      setErrors({})
      setRootError(null)
      onClose()
      toast.success("Employee created successfully")
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to create employee"
      setRootError(errorMessage)
      toast.error(errorMessage)
    },
  })

  // Fetch roles when modal is open
  const { data: rolesData } = useQuery({
    queryKey: ["roles", "all"],
    queryFn: () => roleService.getRoles({ 
      page: 0, 
      size: 100, 
      activeStatus: "ACTIVE" 
    }),
    enabled: isOpen,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value && value.trim() != "" ? value.trim() : undefined }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.email.trim()) newErrors.email = "Email is required"
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)) {
      newErrors.email = "Invalid email address"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    createUserMutation.mutate({
      ...form,
      activeStatus: "ACTIVE",
    })
  }

  const handleClose = () => {
    setForm({
      name: "",
      email: "",
      phone: undefined,
      gender: undefined,
      dateOfBirth: undefined,
      address: undefined,
      activeStatus: "ACTIVE",
      roleIds: [],
    })
    setErrors({})
    setRootError(null)
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Employee" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Full Name *"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Enter full name"
          />

          <Input
            label="Email Address *"
            name="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="Enter email address"
          />

          <Input
            label="Phone Number"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            error={errors.phone}
            placeholder="Enter phone number"
          />

          <Select
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            options={[
              { value: "", label: "Select gender" },
              { value: "MALE", label: "Male" },
              { value: "FEMALE", label: "Female" },
            ]}
            error={errors.gender}
          />

          <Input
            label="Date of Birth"
            type="date"
            name="dateOfBirth"
            value={form.dateOfBirth}
            onChange={handleChange}
            error={errors.dateOfBirth}
          />

          <Select
            label="Status"
            name="activeStatus"
            value={form.activeStatus}
            onChange={handleChange}
            options={[
              { value: "ACTIVE", label: "Active" },
              { value: "INACTIVE", label: "Inactive" },
            ]}
            error={errors.activeStatus}
          />
        </div>

        <Input
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          error={errors.address}
          placeholder="Enter address"
        />

        {rootError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{rootError}</p>
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-teal-500 hover:bg-teal-600" disabled={createUserMutation.isPending}>
            {createUserMutation.isPending ? "Creating..." : "Create Employee"}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
