"use client"

import React from "react"
import { useEffect, useState, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { userService } from "../../services/users"
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "../ui/Table"
import { Button } from "../ui/Button"
import { Input } from "../ui/Input"
import { Select } from "../ui/Select"

import { Plus, RefreshCw, Users, Check, Trash2, Edit, AlertCircle, CheckCircle, XCircle, ArrowUpDown } from "lucide-react"
import { format } from "date-fns"
import type { User, JobResponse, JobStatus } from "../../types"
import { CreateEmployeeModal } from "./CreateEmployeeModal"
import { UpdateEmployeeModal } from "./UpdateEmployeeModal"
import { CheckInForEmployeeModal } from "./CheckInForEmployeeModal"
// import SockJS from 'sockjs-client/dist/sockjs'
// import { Client } from '@stomp/stompjs'
// import { WS_BASE_URL } from "../../lib/axios"
import toast from 'react-hot-toast'

export const EmployeeList: React.FC = () => {
  const [page, setPage] = useState(0)
  const [searchTerm, setSearchTerm] = useState("")
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("")
  const [sortBy, setSortBy] = useState<string>("")
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [selectedEmployees, setSelectedEmployees] = useState<User[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false)
  const [employeeToEdit, setEmployeeToEdit] = useState<User | null>(null)
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false)
  
  // Job tracking states
  const [currentJob, setCurrentJob] = useState<JobResponse | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)
  // const [wsClient, setWsClient] = useState<Client | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  const sortOptions = [
    { value: "", label: "Default Order" },
    { value: "name", label: "Name" },
    { value: "email", label: "Email" },
    { value: "createdDate", label: "Created Date" },
    { value: "modifiedDate", label: "Modified Date" },
    { value: "activeStatus", label: "Status" },
  ]

  const {
    data: usersData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["users", page, debouncedSearchTerm, sortBy, sortDir],
    queryFn: () =>
      userService.getAllUsers(
        page, 
        10, 
        debouncedSearchTerm ? debouncedSearchTerm : undefined,
        sortBy ? sortBy : undefined,
        sortBy ? sortDir : undefined
      ),
  })

  // Handle sort change
  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      // If same field, toggle direction
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      // If different field, set new field with asc direction
      setSortBy(field)
      setSortDir('asc')
    }
    setPage(0) // Reset to first page when sorting changes
  }

  // Handle job updates from polling
  const handleJobUpdate = useCallback((jobUpdate: JobResponse) => {
    setCurrentJob(jobUpdate)
    
    if (jobUpdate.jobStatus === 'COMPLETED') {
      toast.remove('sync-job')
      toast.success('HRM sync completed successfully!')
      setIsSyncing(false)
      refetch() // Refresh the employee list
      // Clear job after a delay
      setTimeout(() => setCurrentJob(null), 3000)
    } else if (jobUpdate.jobStatus === 'FAILED') {
      toast.remove('sync-job')
      toast.error('HRM sync failed!')
      setIsSyncing(false)
      // Clear job after a delay
      setTimeout(() => setCurrentJob(null), 3000)
    }
  }, [refetch])

  // WebSocket connection for job monitoring (COMMENTED)
  /*
  useEffect(() => {
    console.log(currentJob?.id);
    
    if (!currentJob?.id) return

    const socket = new SockJS(WS_BASE_URL)
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        console.log('Connected to WebSocket')
        setIsConnected(true)
        stompClient.subscribe(`/topic/job/${currentJob.id}`, (message) => {
          try {
            const jobUpdate: JobResponse = JSON.parse(message.body)
            console.log('Job update received:', jobUpdate)
            handleJobUpdate(jobUpdate)
            
            // Disconnect if job is completed or failed
            if (jobUpdate.jobStatus === 'COMPLETED' || jobUpdate.jobStatus === 'FAILED') {
              setTimeout(() => {
                stompClient.deactivate()
              }, 1000) // Small delay to ensure UI updates
            }
          } catch (error) {
            console.error('Error parsing job update:', error)
          }
        })
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message'])
        console.error('Additional details: ' + frame.body)
        setIsConnected(false)
      },
      onDisconnect: () => {
        console.log('Disconnected from WebSocket')
        setIsConnected(false)
      }
    })

    stompClient.activate()
    setWsClient(stompClient)

    return () => {
      if (stompClient) {
        stompClient.deactivate()
      }
      setIsConnected(false)
    }
  }, [currentJob?.id])

  // Manual disconnect function
  const disconnectWebSocket = () => {
    if (wsClient) {
      wsClient.deactivate()
    }
  }
  */

  // Polling for job status
  useEffect(() => {
    console.log('Job polling started for:', currentJob?.id);
    
    if (!currentJob?.id) return

    setIsConnected(true) // Mark as "connected" for polling
    
    const pollJobStatus = async () => {
      try {
        const jobUpdate = await userService.getJobStatus(currentJob.id)
        console.log('Job status polled:', jobUpdate)
        handleJobUpdate(jobUpdate)
        
        // Stop polling if job is completed or failed
        if (jobUpdate.jobStatus === 'COMPLETED' || jobUpdate.jobStatus === 'FAILED') {
          clearInterval(pollingInterval)
          setIsConnected(false)
          toast.remove('sync-job')
        }
      } catch (error) {
        console.error('Error polling job status:', error)
        // Continue polling even on error
      }
    }

    // Poll every 2 seconds
    const pollingInterval = setInterval(pollJobStatus, 2000)
    
    // Poll immediately
    pollJobStatus()

    return () => {
      clearInterval(pollingInterval)
      setIsConnected(false)
    }
  }, [currentJob?.id, handleJobUpdate])

  // Manual stop polling function
  const stopPolling = () => {
    setCurrentJob(null)
    setIsConnected(false)
    setIsSyncing(false)
  }

  // Debounce search term
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setPage(0) // Reset to first page when searching
    }, 500)

    return () => {
      clearTimeout(handler)
    }
  }, [searchTerm])

  // Reset page when sort changes
  useEffect(() => {
    setPage(0)
  }, [sortBy, sortDir])

  const handleSyncFromHRM = async () => {
    try {
      setIsSyncing(true)
      const jobResponse = await userService.syncFromHRM()
      setCurrentJob(jobResponse)
      toast.loading(`HRM sync started (Job ID: ${jobResponse.id})`, {
        id: 'sync-job'
      })
    } catch (error) {
      toast.remove('sync-job')
      console.error("Failed to sync from HRM:", error)
      setIsSyncing(false)
      toast.error("Failed to start HRM sync")
    }
  }

  const handleSelectEmployee = (employee: User) => {
    setSelectedEmployees((prev) => {
      const isSelected = prev.some((emp) => emp.id === employee.id)
      if (isSelected) {
        return prev.filter((emp) => emp.id !== employee.id)
      } else {
        return [...prev, employee]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedEmployees.length === usersData?.content?.length) {
      setSelectedEmployees([])
    } else {
      setSelectedEmployees(usersData?.content || [])
    }
  }

  const isEmployeeSelected = (employeeId: string) => {
    return selectedEmployees.some((emp) => emp.id === employeeId)
  }

  const handleCheckInForEmployees = () => {
    if (selectedEmployees.length > 0) {
      setIsCheckInModalOpen(true)
    }
  }

  const handleEditEmployee = (employee: User) => {
    setEmployeeToEdit(employee)
    setIsUpdateModalOpen(true)
  }

  const getJobStatusIcon = (status: JobStatus) => {
    switch (status) {
      case 'PENDING':
      case 'IN_PROGRESS':
        return <AlertCircle className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'COMPLETED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return null
    }
  }

  const getJobStatusText = (status: JobStatus) => {
    switch (status) {
      case 'PENDING':
        return 'Pending'
      case 'IN_PROGRESS':
        return 'In Progress'
      case 'COMPLETED':
        return 'Completed'
      case 'FAILED':
        return 'Failed'
      default:
        return ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Job Status Banner */}
      {currentJob && (
        <div className={`p-4 rounded-lg border ${
          currentJob.jobStatus === 'COMPLETED' ? 'bg-green-50 border-green-200' :
          currentJob.jobStatus === 'FAILED' ? 'bg-red-50 border-red-200' :
          'bg-blue-50 border-blue-200'
        }`}>
          <div className="flex items-center space-x-3">
            {getJobStatusIcon(currentJob.jobStatus)}
            <div className="flex-1">
              <h3 className="text-sm font-medium">
                HRM Sync Job #{currentJob.id}
              </h3>
                             <p className="text-sm text-gray-600">
                 Status: {getJobStatusText(currentJob.jobStatus)}: {currentJob.description}
                 {isConnected && currentJob.jobStatus !== 'COMPLETED' && currentJob.jobStatus !== 'FAILED' && (
                   <span className="ml-2 text-blue-600">• Polling for updates every 2s</span>
                 )}
               </p>
            </div>
            <div className="text-xs text-gray-500">
              Started: {format(new Date(currentJob.createdDate), "HH:mm:ss")}
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            className="bg-teal-500 hover:bg-teal-600"
            onClick={handleCheckInForEmployees}
            disabled={selectedEmployees.length === 0}
          >
            <Users className="w-4 h-4 mr-2" />
            Check-in for employees ({selectedEmployees.length})
          </Button>
        </div>

        <div className="flex items-center space-x-4">
          <Button 
            variant="secondary" 
            onClick={handleSyncFromHRM}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Employees From HRM'}
          </Button>
          <Button className="bg-teal-500 hover:bg-teal-600" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Employee
          </Button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">EMPLOYEES ({usersData?.totalElements || 0})</h2>
            <div className="flex items-center space-x-4">
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              
              {/* Sort Dropdown */}
              <div className="flex items-center space-x-2">
                <Select
                  value={sortBy}
                  onChange={(e) => {
                    const newSortBy = e.target.value
                    setSortBy(newSortBy)
                    if (newSortBy) {
                      setSortDir('asc')
                    }
                    setPage(0)
                  }}
                  options={sortOptions}
                  className="w-48"
                />
                
                {sortBy && (
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={() => handleSortChange(sortBy)}
                    className="px-2"
                    title={`Sort ${sortDir === 'asc' ? 'Descending' : 'Ascending'}`}
                  >
                    <ArrowUpDown className={`w-4 h-4 ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
                  </Button>
                )}
              </div>
              
              <Button variant="secondary" size="sm" onClick={handleSelectAll}>
                {selectedEmployees.length === usersData?.content?.length ? "Deselect All" : "Select All"}
              </Button>
            </div>
          </div>
          
          {/* Sort indicator */}
          {sortBy && (
            <div className="mt-2 text-sm text-gray-600">
              <span className="inline-flex items-center">
                Sorted by: <strong className="mx-1">{sortOptions.find(opt => opt.value === sortBy)?.label}</strong>
                ({sortDir === 'asc' ? 'Ascending' : 'Descending'})
              </span>
            </div>
          )}
        </div>
        {isLoading ? <div className="flex justify-center items-center h-64">Loading...</div> : null}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <input
                  type="checkbox"
                  checked={selectedEmployees.length === usersData?.content?.length && usersData?.content?.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 hidden"
                />
              </TableHead>
              <TableHead>
                <div 
                  className="cursor-pointer hover:bg-gray-50 select-none p-2 -m-2 rounded flex items-center space-x-1"
                  onClick={() => handleSortChange('name')}
                >
                  <span>Employee</span>
                  {sortBy === 'name' && (
                    <ArrowUpDown className={`w-3 h-3 text-teal-600 ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="cursor-pointer hover:bg-gray-50 select-none p-2 -m-2 rounded flex items-center space-x-1"
                  onClick={() => handleSortChange('activeStatus')}
                >
                  <span>Account Access</span>
                  {sortBy === 'activeStatus' && (
                    <ArrowUpDown className={`w-3 h-3 text-teal-600 ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="cursor-pointer hover:bg-gray-50 select-none p-2 -m-2 rounded flex items-center space-x-1"
                  onClick={() => handleSortChange('email')}
                >
                  <span>Email</span>
                  {sortBy === 'email' && (
                    <ArrowUpDown className={`w-3 h-3 text-teal-600 ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="cursor-pointer hover:bg-gray-50 select-none p-2 -m-2 rounded flex items-center space-x-1"
                  onClick={() => handleSortChange('createdDate')}
                >
                  <span>Created Date</span>
                  {sortBy === 'createdDate' && (
                    <ArrowUpDown className={`w-3 h-3 text-teal-600 ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>
                <div 
                  className="cursor-pointer hover:bg-gray-50 select-none p-2 -m-2 rounded flex items-center space-x-1"
                  onClick={() => handleSortChange('modifiedDate')}
                >
                  <span>Last Updated</span>
                  {sortBy === 'modifiedDate' && (
                    <ArrowUpDown className={`w-3 h-3 text-teal-600 ${sortDir === 'desc' ? 'rotate-180' : ''}`} />
                  )}
                </div>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersData?.content?.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={isEmployeeSelected(user.id)}
                    onChange={() => handleSelectEmployee(user)}
                    className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 hidden"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-medium">
                      {user?.name?.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {user?.roles?.map((role) => (
                      <span
                        key={role}
                        className={`px-2 py-1 text-xs rounded-full ${
                          user.activeStatus !== "ACTIVE"
                            ? "bg-gray-100 text-gray-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {role}
                      </span>
                    )) || <span className="text-gray-500">No Roles</span>}
                  </div>
                </TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {user.createdDate ? format(new Date(user.createdDate), "yyyy-MM-dd HH:mm:ss") : "N/A"}
                </TableCell>
                <TableCell>
                  {user.modifiedDate ? format(new Date(user.modifiedDate), "yyyy-MM-dd HH:mm:ss") : "N/A"}
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      className="bg-teal-500 hover:bg-teal-600"
                      onClick={() => handleEditEmployee(user)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {/* <Button size="sm" variant="danger" onClick={() => deletesMutation.mutate([branch.id])}>
                      <Trash2 className="w-4 h-4" />
                    </Button> */}
                    <Button
                      size="sm"
                      className={`${isEmployeeSelected(user.id)
                          ? "bg-green-500 hover:bg-green-600"
                          : "bg-gray-500 hover:bg-gray-600"
                        }`}
                      onClick={() => handleSelectEmployee(user)}
                    >
                      {isEmployeeSelected(user.id) ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Selected
                        </>
                      ) : (
                        "Select"
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {page * 10 + 1} to {Math.min((page + 1) * 10, usersData?.totalElements || 0)} of{" "}
              {usersData?.totalElements || 0} results
              {debouncedSearchTerm && <span className="ml-2 text-teal-600">(filtered by "{debouncedSearchTerm}")</span>}
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-700">
                Page {page + 1} of {usersData?.totalPages || 1}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= (usersData?.totalPages || 1) - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <CreateEmployeeModal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} />

      <UpdateEmployeeModal 
        isOpen={isUpdateModalOpen} 
        onClose={() => {
          setIsUpdateModalOpen(false)
          setEmployeeToEdit(null)
        }} 
        employee={employeeToEdit}
      />

      <CheckInForEmployeeModal
        isOpen={isCheckInModalOpen}
        onClose={() => {
          setIsCheckInModalOpen(false)
          setSelectedEmployees([]) // Clear selection after check-in
        }}
        selectedEmployees={selectedEmployees}
      />
    </div>
  )
}
