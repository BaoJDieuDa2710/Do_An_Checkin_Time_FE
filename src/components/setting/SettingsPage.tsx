"use client"

import type React from "react"
import { useState } from "react"
import { CronjobSettings } from "./CronjobSettings"
import { Settings, Clock, Shield, Bell, Database } from "lucide-react"

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("cronjob")

  const tabs = [
    {
      id: "cronjob",
      label: "Cronjob",
      icon: Clock,
      component: CronjobSettings,
    },
    {
      id: "security",
      label: "Security",
      icon: Shield,
      component: () => (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Security settings will be available soon...</p>
        </div>
      ),
      disabled: true,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      component: () => (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Notification settings will be available soon...</p>
        </div>
      ),
      disabled: true,
    },
    {
      id: "database",
      label: "Database",
      icon: Database,
      component: () => (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-500">Database settings will be available soon...</p>
        </div>
      ),
      disabled: true,
    },
  ]

  const activeTabData = tabs.find((tab) => tab.id === activeTab)
  const ActiveComponent = activeTabData?.component || (() => null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Settings className="w-8 h-8 text-teal-600" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your system configuration and preferences</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? "border-teal-500 text-teal-600"
                    : tab.disabled
                      ? "border-transparent text-gray-400 cursor-not-allowed"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
                disabled={tab.disabled}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.disabled && <span className="text-xs">(Soon)</span>}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        <ActiveComponent />
      </div>
    </div>
  )
}
