import type React from "react"
import { useAuthStore } from "../../hooks/useAuth"
import {
  Users,
  ImageIcon,
  FileText,
  Download,
  AlertTriangle,
  Monitor,
  Building,
  MessageSquare,
  ChevronDown,
  Shield,
  Key,
  LogOutIcon,
  Link,
  Settings,
  Tally1,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

export const Header: React.FC = () => {
  const { user, logout } = useAuthStore()
  const nav = useNavigate();

  const menuItems = [
    { icon: Users, label: "Employees", href: "/employees" , isAdmin: true },
    { icon: ImageIcon, label: "Images", href: "/images" , isAdmin: false },
    { icon: Monitor, label: "Manage Device", href: "/devices" , isAdmin: true },
    { icon: Building, label: "Company Branch", href: "/branches" , isAdmin: true },
    { icon: Shield, label: "Manage Role", href: "/roles" , isAdmin: true },
    { icon: Key, label: "Manage Permission", href: "/permissions" , isAdmin: true },
    { icon: Settings, label: "Settings", href: "/settings" },
  ]

  return (
      <header className="bg-slate-700 text-white sticky top-0 w-full shadow-md z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-8">
              <div className="text-xl font-bold">NCCPLUS.</div>

            <nav className="flex items-center space-x-1">
              {menuItems.map((item) => (
                <div
                  key={item.label}
                  onClick={(e) => {
                    e.preventDefault();
                    nav(item.href);
                  }}
                  className={`${
                    item.isAdmin && !user?.roles?.includes("ADMIN") ? "hidden" : ""
                  } flex cursor-pointer items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:bg-slate-600 transition-colors`}
                >
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>

              ))}
            </nav>
          </div>

            <div className="flex items-center space-x-4">
              <button className="p-2 rounded-md hover:bg-slate-600 transition-colors">
                <Tally1 className="w-5 h-5" />
              </button>

              <div className="text-sm">NCC</div>

            <div className="flex items-center space-x-2">
              <span className="text-sm">Hello, {user?.name || "User"}</span>
              <button
                onClick={logout}
                className="flex items-center space-x-1 text-sm hover:text-gray-300 transition-colors"
              >
                <LogOutIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
