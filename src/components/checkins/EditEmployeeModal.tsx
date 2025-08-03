"use client"
import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { X, Search } from "lucide-react"
import { useQuery } from "@tanstack/react-query"
import { userService } from "../../services/users"
import GenericDropdown from "../ui/GenericDropdown"
import { User } from "../../types"

interface EditEmployeeModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  onStatusUpdate: (status: string, userId?: string) => void
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, onClose, selectedCount, onStatusUpdate }) => {
  const [selectedStatus, setSelectedStatus] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserDropdown, setShowUserDropdown] = useState(false)

  const statusOptions = [
    { label: "Approved", value: "APPROVED", color: "bg-green-100 text-green-800" },
    { label: "Pending", value: "PENDING", color: "bg-yellow-100 text-yellow-800" },
    { label: "Rejected", value: "REJECTED", color: "bg-red-100 text-red-800" },
    { label: "Fake", value: "FAKE", color: "bg-red-100 text-red-800" },
  ]

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  // Query users based on debounced search term
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", debouncedSearchTerm],
    queryFn: () => userService.searchUsers({ name: debouncedSearchTerm }),
    enabled: debouncedSearchTerm.length > 0,
  })

  const handleSubmit = () => {
    if (selectedStatus) {
      onStatusUpdate(selectedStatus, selectedUser?.id)
      setSelectedStatus("")
      setSelectedUser(null)
      setSearchTerm("")
    }
  }

  const handleClose = () => {
    setSelectedStatus("")
    setSelectedUser(null)
    setSearchTerm("")
    setShowUserDropdown(false)
    onClose()
  }

  const handleUserSelect = (user: User) => {
    setSelectedUser(user)
    setSearchTerm(user.name)
    setShowUserDropdown(false)
  }

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchTerm(value)
    setShowUserDropdown(value.length > 0)

    // Clear selected user if search term changes
    if (selectedUser && value !== selectedUser.name) {
      setSelectedUser(null)
    }
  }

  const clearUserSelection = () => {
    setSelectedUser(null)
    setSearchTerm("")
    setShowUserDropdown(false)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Edit Employee Status</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6 space-y-4">
          <p className="text-gray-600">You are about to update the status for {selectedCount} selected item(s).</p>

          {/* User Search Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Assign to User (Optional)</label>
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Search user by name..."
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                  className="pl-10 pr-10"
                />
                {selectedUser && (
                  <button
                    onClick={clearUserSelection}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* User Dropdown */}
              {showUserDropdown && searchTerm && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                  {isLoadingUsers ? (
                    <div className="px-4 py-2 text-sm text-gray-500">Searching...</div>
                  ) : users && users.length > 0 ? (
                    users.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => handleUserSelect(user)}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                              <Search className="w-4 h-4 text-gray-500" />
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">{user.name}</div>
                          {user.email && <div className="text-sm text-gray-500 truncate">{user.email}</div>}
                        </div>
                      </button>
                    ))
                  ) : debouncedSearchTerm && !isLoadingUsers ? (
                    <div className="px-4 py-2 text-sm text-gray-500">No users found</div>
                  ) : null}
                </div>
              )}
            </div>

            {/* Selected User Display */}
            {selectedUser && (
              <div className="flex items-center space-x-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-teal-200 rounded-full flex items-center justify-center">
                      <Search className="w-4 h-4 text-teal-600" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-teal-900">Selected: {selectedUser.name}</div>
                  {selectedUser.email && <div className="text-sm text-teal-600">{selectedUser.email}</div>}
                </div>
                <button onClick={clearUserSelection} className="text-teal-400 hover:text-teal-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Status Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Select new status:</label>
            <GenericDropdown
              items={statusOptions}
              onSelect={(value) => setSelectedStatus(value)}
              placeholder="Select status"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <Button variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            disabled={!selectedStatus}
            className="flex-1 bg-teal-500 hover:bg-teal-600"
          >
            Update Status
          </Button>
        </div>
      </div>
    </div>
  )
}

export default EditEmployeeModal
