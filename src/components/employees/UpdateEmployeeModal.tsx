"use client"

import React, { useState, useEffect } from "react"
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query"
import { userService, type UpdateUserRequest } from "../../services/users"
import { roleService } from "../../services/roles"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { Modal } from "../ui/Modal"
import { Select } from "../ui/Select"
import toast from 'react-hot-toast'
import type { User, Role } from "../../types"
import { ChevronDown, X, Search } from "lucide-react"

interface UpdateEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  employee: User | null
}

export const UpdateEmployeeModal: React.FC<UpdateEmployeeModalProps> = ({ 
  isOpen, 
  onClose, 
  employee 
}) => {
  const queryClient = useQueryClient()

  const [form, setForm] = useState<UpdateUserRequest>({
    name: "",
    email: "",
    phone: "",
    gender: undefined,
    dateOfBirth: "",
    address: "",
    activeStatus: "ACTIVE",
    password: "",
    roleIds: [],
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [rootError, setRootError] = useState<string | null>(null)
  const [rolesDropdownOpen, setRolesDropdownOpen] = useState(false)
  const [roleSearchTerm, setRoleSearchTerm] = useState("")

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

  const roles = rolesData?.content || []
  
  // Filter roles based on search term
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(roleSearchTerm.toLowerCase())
  )

  // Populate form when employee data changes
  useEffect(() => {
    if (employee) {
      // Extract role IDs from employee roles (roles are stored as strings - role names)
      const roleIds = employee.roles ? employee.roles.map(roleName => {
        // Find matching role by name to get the ID
        const matchingRole = roles.find(r => r.name === roleName)
        return matchingRole?.id
      }).filter(id => id !== undefined) as string[] : []

      setForm({
        name: employee.name || "",
        email: employee.email || "",
        phone: employee.phone || "",
        gender: employee.gender,
        dateOfBirth: employee.dateOfBirth || "",
        address: employee.address || "",
        activeStatus: employee.activeStatus || "ACTIVE",
        password: "", // Always reset password field for security
        roleIds: roleIds,
      })
    }
  }, [employee, roles])

  const updateUserMutation = useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: UpdateUserRequest }) =>
      userService.updateUser(id, userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] })
      setErrors({})
      setRootError(null)
      // Reset password field for security
      setForm(prev => ({ ...prev, password: "" }))
      onClose()
      toast.success("Employee updated successfully")
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to update employee"
      setRootError(errorMessage)
      toast.error(errorMessage)
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleRoleToggle = (roleId: string) => {
    const currentRoleIds = form.roleIds || []
    const isSelected = currentRoleIds.includes(roleId)
    
    if (isSelected) {
      setForm(prev => ({ 
        ...prev, 
        roleIds: currentRoleIds.filter(id => id !== roleId) 
      }))
    } else {
      setForm(prev => ({ 
        ...prev, 
        roleIds: [...currentRoleIds, roleId] 
      }))
    }
  }

  const removeRole = (roleId: string) => {
    setForm(prev => ({ 
      ...prev, 
      roleIds: (prev.roleIds || []).filter(id => id !== roleId) 
    }))
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!form.name.trim()) newErrors.name = "Name is required"
    if (!form.email.trim()) newErrors.email = "Email is required"
    else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)) {
      newErrors.email = "Invalid email address"
    }

    // Validate password only if it's provided
    if (form.password && form.password.trim() !== "") {
      if (form.password.length < 6) {
        newErrors.password = "Password must be at least 6 characters long"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !employee) return

    // Prepare form data, exclude password if empty
    const updateData = { ...form }
    if (!form.password || form.password.trim() === "") {
      delete updateData.password
    }

    updateUserMutation.mutate({
      id: employee.id,
      userData: updateData,
    })
  }

  const handleClose = () => {
    setErrors({})
    setRootError(null)
    // Reset password field for security
    setForm(prev => ({ ...prev, password: "" }))
    setRolesDropdownOpen(false)
    setRoleSearchTerm("")
    onClose()
  }

  const getSelectedRoles = () => {
    return (form.roleIds || []).map(roleId => roles.find(role => role.id === roleId)).filter(Boolean) as Role[]
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Update Employee" size="lg">
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
            value={form.gender || ""}
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

        {/* Compact Roles Selection */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Roles
          </label>
          
          {/* Selected Roles Display */}
          {getSelectedRoles().length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {getSelectedRoles().map((role) => (
                <span
                  key={role.id}
                  className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800"
                >
                  {role.name}
                  <button
                    type="button"
                    onClick={() => removeRole(role.id)}
                    className="ml-1 text-teal-600 hover:text-teal-800"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Dropdown Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRolesDropdownOpen(!rolesDropdownOpen)}
              className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            >
              <span className="text-gray-500">
                {getSelectedRoles().length === 0 
                  ? "Select roles..." 
                  : `${getSelectedRoles().length} role(s) selected`
                }
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${rolesDropdownOpen ? 'transform rotate-180' : ''}`} />
            </button>

            {/* Dropdown Content */}
            {rolesDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                {/* Search Input */}
                <div className="p-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search roles..."
                      value={roleSearchTerm}
                      onChange={(e) => setRoleSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Roles List */}
                <div className="max-h-48 overflow-y-auto">
                  {filteredRoles.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      {roleSearchTerm ? "No roles found" : "No roles available"}
                    </div>
                  ) : (
                    filteredRoles.map((role) => (
                      <label
                        key={role.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={form.roleIds?.includes(role.id) || false}
                          onChange={() => handleRoleToggle(role.id)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 mr-3"
                        />
                        <span className="text-sm text-gray-700">{role.name}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="New Password"
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Leave blank to keep current password"
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
          <Button 
            type="submit" 
            className="bg-teal-500 hover:bg-teal-600" 
            disabled={updateUserMutation.isPending}
          >
            {updateUserMutation.isPending ? "Updating..." : "Update Employee"}
          </Button>
        </div>
      </form>
    </Modal>
  )
} 