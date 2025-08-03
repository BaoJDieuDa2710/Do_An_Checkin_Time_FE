export interface User {
  id: string
  email: string
  phone?: string
  name: string
  address?: string
  dateOfBirth?: string
  gender?: "MALE" | "FEMALE"
  activeStatus: "ACTIVE" | "INACTIVE"
  createdDate: string
  modifiedDate: string
  roles?: string[]
}

export interface Role {
  id: string
  name: string
  permissions?: Permission[]
}

export interface Permission {
  id: string
  name: string
  description?: string
  activeStatus: "ACTIVE" | "INACTIVE"
}

export interface Branch {
  id: string
  name: string
  address: string
  activeStatus: "ACTIVE" | "INACTIVE"
}

export interface Device {
  id: string
  name: string
  branchId: string
  branch?: Branch
  activeStatus: "ACTIVE" | "INACTIVE"
}

export interface CheckIn {
  id: string
  userId: string
  actualUser?: User
  recognizeUser?: User
  deviceId: string
  device?: Device
  time: string
  confident: number
  image: string
  verificationStatus: "PENDING" | "APPROVED" | "REJECTED" | "FAKE"
}

export interface AuthResponse {
  access_token: string
  refresh_token: string
}

export interface ApiResponse<T> {
  status: number
  message: string
  data: T
}

export interface PaginatedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}

export enum JobType {
  SYNC_HRM = "SYNC_HRM"
}

export enum JobStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS", 
  COMPLETED = "COMPLETED",
  FAILED = "FAILED"
}

export interface JobResponse {
  id: string
  jobType: JobType
  jobStatus: JobStatus
  description?: string
  createdDate: string
  modifiedDate: string
}
