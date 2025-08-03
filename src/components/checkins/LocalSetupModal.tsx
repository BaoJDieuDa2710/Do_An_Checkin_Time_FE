import React, { useState } from "react"
import { Modal } from "../ui/Modal"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { useMutation, useQuery } from "@tanstack/react-query"
import { userService } from "../../services/users"
import toast from "react-hot-toast"
import { checkInService, ImageProcessRequest, UpdateCheckInRequest } from "../../services/checkins"
import { Search, X } from "lucide-react"

interface LocalSetupModalProps {
  isOpen: boolean
  onClose: () => void
  selectedCount: number
  selectedCheckIns: Array<{ id: string; image?: string; recognizeUser?: { id: string }; actualUser?: { id: string } }>
  onProcessComplete: () => void
}

const LocalSetupModal: React.FC<LocalSetupModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  selectedCheckIns,
  onProcessComplete
}) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string>("")
  const [selectedUserName, setSelectedUserName] = useState<string>("")

  // Query to search users
  const { data: users, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["users", searchTerm],
    queryFn: () => userService.getAllUsers(
      0, 
      20, 
      searchTerm || undefined 
    ),
    enabled: searchTerm.length > 0
  })

  // Mutation to process images
  const processImagesMutation = useMutation({
    mutationFn: checkInService.localSetUp,
    onSuccess: (response) => {
      if (response.status === 200) {
        toast.success(response.message || "Images processed successfully")
        onProcessComplete()
        handleClose()
      } else {
        toast.error(response.message || "Failed to process images")
      }
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || error.message || "Failed to process images"
      toast.error(errorMessage)
    },
  })

  const handleUserSelect = (user: { id: string; name: string }) => {
    setSelectedUserId(user.id)
    setSelectedUserName(user.name)
    setSearchTerm("")
  }

  const handleSubmit = () => {
    if (!selectedUserId) {
      toast.error("Please select a user")
      return
    }

    // Extract check-in IDs from selected check-ins
    const checkInIds = selectedCheckIns.map(checkIn => checkIn.id)

    if (checkInIds.length === 0) {
      toast.error("No check-ins selected")
      return
    }

    const requestData: UpdateCheckInRequest = {
      userId: selectedUserId,
      checkInIds: checkInIds
    }

    processImagesMutation.mutate(requestData)
  }

  const handleClose = () => {
    setSearchTerm("")
    setSelectedUserId("")
    setSelectedUserName("")
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Local Setup">
      <div className="space-y-4">
        <div className="text-sm text-gray-600">
          Selected {selectedCount} check-in(s) for processing
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Search and Select User
          </label>
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="text"
                placeholder="Search user by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-10"
              />
              {selectedUserName && (
                <button
                  onClick={() => {
                    setSelectedUserId("")
                    setSelectedUserName("")
                  }}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {searchTerm && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                {isLoadingUsers ? (
                  <div className="px-4 py-2 text-sm text-gray-500">Searching...</div>
                ) : users?.content && users.content.length > 0 ? (
                  users.content.map((user) => (
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
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">No users found</div>
                )}
              </div>
            )}
          </div>

          {selectedUserName && (
            <div className="flex items-center space-x-3 p-3 bg-teal-50 border border-teal-200 rounded-lg">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-teal-200 rounded-full flex items-center justify-center">
                  <Search className="w-4 h-4 text-teal-600" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-teal-900">Selected: {selectedUserName}</div>
              </div>
              <button
                onClick={() => {
                  setSelectedUserId("")
                  setSelectedUserName("")
                }}
                className="text-teal-400 hover:text-teal-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500">
          {selectedCheckIns.length} check-in(s) will be processed
        </div>
      </div>

      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!selectedUserId || processImagesMutation.isPending}
        >
          {processImagesMutation.isPending ? "Processing..." : "Send"}
        </Button>
      </div>
    </Modal>
  )
}

export default LocalSetupModal
