"use client"
import React from "react"
import { useEffect, useRef, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { checkInService, UpdateCheckInRequest, type CheckInFilters } from "../../services/checkins"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Check, ArrowUpDown, ArrowRight } from "lucide-react"
import GenericDropdown from "../ui/GenericDropdown"
import MultiSelectDropdown from "../ui/MultiSelectDropdown"
import { format } from "date-fns"
import { DateRangePicker } from "rsuite"
import "rsuite/dist/rsuite.min.css"
import type { DateRange } from "rsuite/esm/DateRangePicker"
import EditEmployeeModal from "./EditEmployeeModal"
import LocalSetupModal from "./LocalSetupModal"
import { branchService } from "../../services/branches"
import { useCheckInsInfinite } from "../../hooks/useCheckInsInfinite"
import toast from "react-hot-toast"
import { useAuthStore } from "../../hooks/useAuth"

export const CheckInGallery: React.FC = () => {
  const [activeTab, setActiveTab] = useState("SHOW ALL")
  const [filters, setFilters] = useState<CheckInFilters>({})
  const [dateRange, setDateRange] = useState<[Date, Date] | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [probabilityRange, setProbabilityRange] = useState({ min: 0, max: 100 })
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc') // Default to desc for most recent first
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]) // Add state for multi-select statuses
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isLocalSetupModalOpen, setIsLocalSetupModalOpen] = useState(false)
  const queryClient = useQueryClient();
  const {user} = useAuthStore();

  // Always sort by time
  const sortBy = "time"

  // Merge filters with sort parameters and selected statuses
  const filtersWithSort = {
    ...filters,
    sortBy: sortBy,
    sortDir: sortDir,
    verificationStatus: selectedStatuses.length > 0 ? selectedStatuses.join(',') : undefined,
  }

  // Handle sort direction toggle
  const handleSortToggle = () => {
    setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
  }

  // Handle status multi-select change
  const handleStatusChange = (values: string[]) => {
    setSelectedStatuses(values)
  }

  const updateEmployeeCheckIn = useMutation({
    mutationFn: async (data: UpdateCheckInRequest) => {
      return checkInService.updateCheckIns(data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checkins'] });
      toast.success("Check-in status updated successfully")
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to update check-in status"
      toast.error(errorMessage)
    },
  })

  const { data: branches, isLoading: isLoadingBranches} = useQuery({
    queryKey: ["branches"],
    queryFn: () => branchService.getBranches({ page: 0, size: 999 }),
  })

  const tabs = [
    { label: "SHOW ALL", value: "SHOW ALL" },
    { label: "ONLY ME", value: "ONLY ME" },
  ]

  const status = [
    { label: "ALL STATUS", value: undefined },
    { label: "APPROVED", value: "APPROVED" },
    { label: "PENDING/REJECT", value: "PENDING,REJECTED" },
    { label: "PENDING", value: "PENDING" },
    { label: "REJECTED", value: "REJECTED" },
    { label: "FAKE", value: "FAKE" },
  ]

  const {
    data: checkInsPages,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useCheckInsInfinite(filtersWithSort, activeTab)

  const allCheckIns = checkInsPages?.pages.flatMap(page => page.content) || []

  const handleFilterChange = (key: keyof CheckInFilters, value: string | number | boolean | undefined) => {
    setFilters((prev) => ({
      ...prev,
      [key]: key === "verificationStatus" ? (value === "ALL" ? undefined : value) : value,
    }))
  }

  const toggleSelection = (id: string) => {
    setSelectedItems((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const selectAll = () => {
    if (allCheckIns) {
      if (selectedItems.size > 1) {
        // If all are selected, deselect all
        setSelectedItems(new Set())
      } else {
        // Select all
        setSelectedItems(new Set(allCheckIns.map((item) => item.id)))
      }
    }
  }

  const handleEditEmployee = () => {
    if (selectedItems.size > 0) {
      setIsEditModalOpen(true)
    }
  }

  const handleLocalSetup = () => {
    if (selectedItems.size > 0) {
      setIsLocalSetupModalOpen(true)
    }
  }

  const handleStatusUpdate = async (newStatus: string, userId?: string) => {
    // Here you would implement the API call to update the status
    console.log("Updating status for items:", Array.from(selectedItems), "to:", newStatus)

    // After successful update, clear selection and close modal
    setSelectedItems(new Set())
    setIsEditModalOpen(false)

    updateEmployeeCheckIn.mutate({
      checkInIds: Array.from(selectedItems),
      userId: userId ? userId : undefined,
      verificationStatus: newStatus as UpdateCheckInRequest["verificationStatus"],
    })
  }

  const handleProcessComplete = () => {
    // Clear selection and refresh data
    setSelectedItems(new Set())
    refetch()
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      APPROVED: "bg-green-100 text-green-800",
      PENDING: "bg-yellow-100 text-yellow-800",
      REJECTED: "bg-red-100 text-red-800",
      FAKE: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const renderUserInfo = (checkIn: typeof allCheckIns[0]) => {
    const { recognizeUser, actualUser } = checkIn
    
    // If actualUser is null or same as recognizeUser, show as before
    if (!actualUser || (recognizeUser?.id === actualUser?.id)) {
      return (
        <div className="text-sm font-medium text-gray-900 truncate">
          {recognizeUser?.name || actualUser?.name || "Unknown User"}
        </div>
      )
    }
    
    // If different, show recognizeUser -> actualUser
    return (
      <div className="space-y-1">
        <div className="flex items-center text-xs text-gray-600">
          <span className="truncate max-w-[60px]">{recognizeUser?.name || "Unknown"}</span>
          <ArrowRight className="w-3 h-3 mx-1 flex-shrink-0" />
          <span className="truncate max-w-[60px]">{actualUser?.name || "Unknown"}</span>
        </div>
        <div className="text-sm font-medium text-gray-900 truncate">
          {actualUser?.name || "Unknown User"}
        </div>
      </div>
    )
  }

  useEffect(() => {
      const handler = setTimeout(() => {
        handleFilterChange("name", searchTerm)
      }, 500)
      return () => {
        clearTimeout(handler)
      }
  }, [searchTerm])

  const handleProbabilityChange = (min: number, max: number) => {
    setProbabilityRange({ min, max })
    handleFilterChange("confidentLowerBound", min / 100)
    handleFilterChange("confidentUpperBound", max / 100)
  }

  const formatLocalDateTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
  }

  const formatLocalDate = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0")
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  const handleDateRangeChange = (value: DateRange | null) => {
    setDateRange(value)
    handleFilterChange("startTime", value ? formatLocalDate(value[0]) : undefined)
    handleFilterChange("endTime", value ? formatLocalDate(value[1]) : undefined)
  }

  const loadMoreRef = useRef<HTMLDivElement | null>(null)

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage()
      }
    },
    { threshold: 1.0 }
  )
  if (loadMoreRef.current) observer.observe(loadMoreRef.current)
  return () => observer.disconnect()
}, [hasNextPage, isFetchingNextPage])

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex items-center space-x-4 flex-wrap gap-2">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        
        {/* Sort Controls - Time Direction Toggle */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by Time:</span>
          <Button
            variant="secondary"
            size="md"
            onClick={handleSortToggle}
            className="px-3"
            title={`Sort by Time ${sortDir === 'asc' ? 'Descending (Newest First)' : 'Ascending (Oldest First)'}`}
          >
            <ArrowUpDown className={`w-4 h-4 mr-1 ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
            {sortDir === 'desc' ? 'Newest First' : 'Oldest First'}
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Probability(%)</span>
          <Input
            placeholder="Min"
            value={probabilityRange.min}
            onChange={(e) => handleProbabilityChange(Number.parseFloat(e.target.value) || 0, probabilityRange.max)}
            className="w-20"
          />
          <span>-</span>
          <Input
            placeholder="Max"
            value={probabilityRange.max}
            onChange={(e) => handleProbabilityChange(probabilityRange.min, Number.parseFloat(e.target.value) || 0)}
            className="w-20"
          />
        </div>
        <div className="flex items-center space-x-2">
          <DateRangePicker
            value={dateRange}
            onChange={(val) => handleDateRangeChange(val)}
            placeholder="Select Date Range"
            appearance="subtle"
            format="dd/MM/yyyy"
            cleanable
            size="md"
            className="block w-full bg-white border border-gray-300 shadow-sm placeholder-gray-400 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <GenericDropdown
          items={[
            { label: 'ALL BRANCH', value: undefined },
            ...(branches?.content?.map((branch) => ({
              label: branch.name,
              value: branch.id
            })) || [])
          ]} placeholder="BRANCH"
          onSelect={(value) => handleFilterChange("branchId", value as string | undefined)}
        />
        <MultiSelectDropdown
          items={status.filter(item => item.value !== undefined) as { label: string; value: string }[]}
          placeholder="SELECT STATUS"
          selectedValues={selectedStatuses}
          onSelectionChange={handleStatusChange}
        />
      </div>

      {/* Sort indicator */}
      <div className="text-sm text-gray-600">
        <span className="inline-flex items-center">
          Sorted by: <strong className="mx-1">Check-in Time</strong>
          ({sortDir === 'asc' ? 'Oldest First' : 'Newest First'})
        </span>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-1">
        {tabs.map((tab) => (
          <Button
            key={tab.value}
            variant={activeTab === tab.value ? "primary" : "ghost"}
            onClick={() => setActiveTab(tab.value)}
            className={activeTab === tab.value ? "bg-teal-500 text-white" : ""}
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className={` items-center justify-between ${user?.roles?.includes("ADMIN") ? "flex" : "hidden"}`}>
        <div className="text-sm text-gray-600">
          {selectedItems.size > 0 && `${selectedItems.size} item(s) selected`}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="secondary"
            className="border-dashed"
            onClick={handleEditEmployee}
            disabled={selectedItems.size === 0}
          >
            EDIT EMPLOYEE ({selectedItems.size})
          </Button>
          <Button
            variant="secondary"
            className="border-dashed"
            onClick={handleLocalSetup}
            disabled={selectedItems.size === 0}
          >
            LOCAL SETUP ({selectedItems.size})
          </Button>
          <Button variant="secondary" className="border-dashed" onClick={selectAll}>
            {selectedItems.size > 1 && allCheckIns?.length > 0
              ? "DESELECT ALL"
              : "SELECT ALL"}
          </Button>
          <Button variant="secondary" className="border-dashed" onClick={() => refetch()}>
            REFRESH
          </Button>

        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">Loading...</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
          {allCheckIns?.map((checkIn) => (
            <div
              key={checkIn.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 ${selectedItems.has(checkIn.id)
                ? "ring-4 ring-teal-500 ring-opacity-50 border-teal-500"
                : "hover:shadow-lg"
                }`}
              onClick={() => toggleSelection(checkIn.id)}
            >
              <div className="aspect-square bg-gray-200 relative">
                {checkIn.image && (
                  <img
                    src={checkIn.image || "/placeholder.svg"}
                    alt={`Check-in ${checkIn.id}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadge(checkIn.verificationStatus)}`}>
                    {checkIn.verificationStatus}
                  </span>
                </div>
                {selectedItems.has(checkIn.id) && (
                  <div className="absolute top-2 left-2 bg-teal-500 rounded-full p-1">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>
              <div className="p-3 space-y-1">
                <div className="text-xs text-gray-500">{format(new Date(checkIn.time), "HH:mm dd/MM/yyyy")}</div>
                <div className={`text-sm font-medium ${getConfidenceColor(checkIn.confident)}`}>
                  {(checkIn.confident * 100).toFixed(2)}%
                </div>
                {renderUserInfo(checkIn)}
              </div>
            </div>
          ))}
        </div>
      )}

      <div ref={loadMoreRef} />

      {/* Edit Modal */}
      <EditEmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        selectedCount={selectedItems.size}
        onStatusUpdate={handleStatusUpdate}
      />

      {/* Local Setup Modal */}
      <LocalSetupModal
        isOpen={isLocalSetupModalOpen}
        onClose={() => setIsLocalSetupModalOpen(false)}
        selectedCount={selectedItems.size}
        selectedCheckIns={allCheckIns.filter(checkIn => selectedItems.has(checkIn.id))}
        onProcessComplete={handleProcessComplete}
      />
    </div>
  )
}
