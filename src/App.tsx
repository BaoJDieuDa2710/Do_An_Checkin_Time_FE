import type React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { useAuthStore } from "./hooks/useAuth"
import { Header } from "./components/layout/Header"
import { LoginPage } from "./components/auth/LoginPage"
import { EmployeeList } from "./components/employees/EmployeeList"
import { BranchList } from "./components/branches/BranchList"
import { CheckInGallery } from "./components/checkins/CheckInGallery"
import {DeviceList} from "./components/device/DeviceList";
import { NotFoundPage } from "./components/layout/NotFoundPage"
import { RoleList } from "./components/roles/RoleList"
import {PermissionList} from "./components/permissions/PermissionList";
import { Toaster } from "react-hot-toast"
import ForbiddenPage from "./components/layout/ForbiddenPage"
import { SettingsPage } from "./components/setting/SettingsPage"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthStore()

  if (!user || user?.roles?.includes("ADMIN") === false) {
    return <ForbiddenPage />
  }

  return <>{children}</>
}

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="container mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/employees"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminRoute>
                    <EmployeeList />
                  </AdminRoute>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/branches"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminRoute>
                    <BranchList />
                  </AdminRoute>
                </Layout>
              </ProtectedRoute>
            }
          />
            <Route
                path="/devices"
                element={
                    <ProtectedRoute>
                        <Layout>
                          <AdminRoute>
                            <DeviceList />
                          </AdminRoute>
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/roles"
                element={
                    <ProtectedRoute>
                        <Layout>
                          <AdminRoute>
                            <RoleList />
                          </AdminRoute>
                        </Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/permissions"
                element={
                    <ProtectedRoute>
                        <Layout>
                          <AdminRoute>
                            <PermissionList />
                          </AdminRoute>
                        </Layout>
                    </ProtectedRoute>
                }
            />
          <Route
            path="/images"
            element={
              <ProtectedRoute>
                <Layout>
                  <CheckInGallery />
                </Layout>
              </ProtectedRoute>
            }
          />
           <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <AdminRoute>
                    <SettingsPage />
                  </AdminRoute>
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/images" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}

export default App
