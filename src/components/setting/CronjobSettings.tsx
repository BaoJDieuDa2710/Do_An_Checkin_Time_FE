"use client"

import React from "react"

import type { ReactElement } from "react"
import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsService, type SettingsRequest, type CronjobSettingsResponse } from "../../services/setting"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "../ui/Card"
import { Input } from "../ui/Input"
import { Button } from "../ui/Button"
import { Switch } from "../ui/Switch"
import { Select } from "../ui/Select"
import { Clock, Save, RefreshCw, CheckCircle, AlertCircle, Edit2, X } from "lucide-react"
import toast from "react-hot-toast"

interface EditingJob {
  name?: string
  id: string
  cronExpression: string
  enabled: boolean
}

interface FormData {
  cronExpression: string
  enabled: boolean
}

interface FormErrors {
  cronExpression?: string
}

export const CronjobSettings: React.FC = (): ReactElement => {
  const queryClient = useQueryClient()
  const [editingJob, setEditingJob] = useState<EditingJob | null>(null)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [formData, setFormData] = useState<FormData>({
    cronExpression: "",
    enabled: false
  })
  const [formErrors, setFormErrors] = useState<FormErrors>({})

  const { data: settings, isLoading, error } = useQuery({
    queryKey: ["settings"],
    queryFn: settingsService.getSettings,
  })

  const updateSettingsMutation = useMutation({
    mutationFn: ({ data, id }: { data: SettingsRequest; id: string }) => 
      settingsService.updateSettings(data, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] })
      setEditingJob(null)
      setShowAdvanced(false)
      setFormData({ cronExpression: "", enabled: false })
      toast.success("Settings updated successfully")
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || "Failed to update settings"
      toast.error(errorMessage)
    },
  })

  const cronPresets = [
    { value: "0 0 0 * * *", label: "Hàng ngày lúc nửa đêm" },
    { value: "0 0 0 */2 * *", label: "Mỗi 2 ngày lúc nửa đêm" },
    { value: "0 0 0 * * 0", label: "Hàng tuần Chủ nhật lúc nửa đêm" },
    { value: "0 0 0 1 * *", label: "Hàng tháng ngày 1 lúc nửa đêm" },
    { value: "0 0 */6 * * *", label: "Mỗi 6 giờ" },
    { value: "0 0 */12 * * *", label: "Mỗi 12 giờ" },
    { value: "0 0 9 * * *", label: "Hàng ngày lúc 9:00 sáng" },
    { value: "0 0 18 * * *", label: "Hàng ngày lúc 6:00 chiều" },
    { value: "0 */15 * * * *", label: "Mỗi 15 phút" },
    { value: "0 0 9 * * 1-5", label: "9:00 sáng các ngày làm việc" },
    { value: "custom", label: "Tùy chỉnh" },
  ]

  const startEditing = (job: CronjobSettingsResponse) => {
    const editJob = {
      name: job.name,
      id: job.id!,
      cronExpression: job.cronExpression,
      enabled: job.enabled
    }
    setEditingJob(editJob)
    setFormData({
      cronExpression: job.cronExpression,
      enabled: job.enabled
    })
    setFormErrors({})
    
    // Check if current cron expression matches any preset
    const matchingPreset = cronPresets.find(preset => preset.value === job.cronExpression)
    setShowAdvanced(!matchingPreset || matchingPreset.value === "custom")
  }

  const cancelEditing = () => {
    setEditingJob(null)
    setShowAdvanced(false)
    setFormData({ cronExpression: "", enabled: false })
    setFormErrors({})
  }

  const validateForm = (): boolean => {
    const errors: FormErrors = {}
    
    if (formData.enabled) {
      if (!formData.cronExpression || formData.cronExpression.trim() === "") {
        errors.cronExpression = "Biểu thức cron là bắt buộc"
      } else {
        // Basic pattern validation
        if (!/^[*\-,\/0-9\s]+$/.test(formData.cronExpression)) {
          errors.cronExpression = "Biểu thức cron chỉ được chứa số, *, -, /, , và khoảng trắng"
        } else {
          // Check 6 fields
          const parts = formData.cronExpression.trim().split(/\s+/)
          if (parts.length !== 6) {
            errors.cronExpression = "Biểu thức cron phải có đúng 6 trường (giây phút giờ ngày tháng thứ)"
          }
        }
      }
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingJob) return
    
    if (!validateForm()) return
    
    updateSettingsMutation.mutate({
      data: {
        cronExpression: formData.cronExpression,
        enabled: formData.enabled
      },
      id: editingJob.id
    })
  }

  const handlePresetChange = (preset: string) => {
    if (preset !== "custom") {
      setFormData(prev => ({ ...prev, cronExpression: preset }))
      setFormErrors(prev => ({ ...prev, cronExpression: undefined }))
      setShowAdvanced(false)
    } else {
      setShowAdvanced(true)
    }
  }

  const handleCronExpressionChange = (value: string) => {
    setFormData(prev => ({ ...prev, cronExpression: value }))
    // Clear error when user starts typing
    if (formErrors.cronExpression) {
      setFormErrors(prev => ({ ...prev, cronExpression: undefined }))
    }
  }

  const handleEnabledChange = (enabled: boolean) => {
    setFormData(prev => ({ ...prev, enabled }))
  }

  const toggleJobStatus = (job: CronjobSettingsResponse) => {
    updateSettingsMutation.mutate({
      data: {
        cronExpression: job.cronExpression,
        enabled: !job.enabled
      },
      id: job.id!
    })
  }

  // Debug logs
  useEffect(() => {
    console.log("Form values:", formData)
  }, [formData])

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 animate-spin text-teal-600" />
          <span>Đang tải cài đặt...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">Không thể tải cài đặt cronjob</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["settings"] })}
            className="mt-2"
          >
            Thử lại
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Edit Form */}
      {editingJob && (
        <Card className="border-teal-200">
          <CardHeader className="bg-teal-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-teal-600" />
                <CardTitle>Chỉnh sửa Cronjob</CardTitle>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={cancelEditing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <CardDescription>
              Chỉnh sửa lịch trình và trạng thái của cronjob
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={onSubmit} className="space-y-6">
              {/* Enable/Disable Switch */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="text-sm font-medium text-gray-900">
                    Kích hoạt Cronjob {editingJob?.name}
                  </h4>
                  <p className="text-sm text-gray-500">Bật/tắt cronjob này</p>
                </div>
                <Switch
                  checked={formData.enabled}
                  onCheckedChange={handleEnabledChange}
                />
              </div>

              {formData.enabled && (
                <div className="space-y-4">
                  {/* Schedule Preset */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lịch trình có sẵn
                    </label>
                    <Select
                      options={cronPresets}
                      value={cronPresets.find((preset) => preset.value === formData.cronExpression)?.value || "custom"}
                      onChange={(e) => handlePresetChange(e.target.value)}
                    />
                  </div>

                  {/* Custom Cron Expression */}
                  {(showAdvanced || !cronPresets.find((preset) => preset.value === formData.cronExpression)) && (
                    <div>
                      <Input
                        label="Biểu thức Cron tùy chỉnh"
                        value={formData.cronExpression}
                        onChange={(e) => handleCronExpressionChange(e.target.value)}
                        error={formErrors.cronExpression}
                        placeholder="0 0 0 * * *"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Định dạng: giây phút giờ ngày tháng thứ-trong-tuần (ví dụ: "0 0 0 * * *" cho hàng ngày lúc nửa đêm)
                      </p>
                    </div>
                  )}

                  {/* Current Schedule Display */}
                  {formData.cronExpression && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <h5 className="text-sm font-medium text-blue-900 mb-2">Lịch trình hiện tại</h5>
                      <p className="text-sm text-blue-700">
                        {cronPresets.find((preset) => preset.value === formData.cronExpression)?.label ||
                          `Tùy chỉnh: ${formData.cronExpression}`}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <Button type="button" variant="secondary" onClick={cancelEditing}>
                  Hủy
                </Button>
                <Button
                  type="submit"
                  className="bg-teal-500 hover:bg-teal-600"
                  disabled={updateSettingsMutation.isPending}
                >
                  {updateSettingsMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </Button>
              </div>

              {/* Success/Error Messages */}
              {updateSettingsMutation.isSuccess && (
                <div className="bg-green-50 border border-green-200 rounded-md p-3">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <p className="text-sm text-green-700">Lưu cài đặt thành công!</p>
                  </div>
                </div>
              )}

              {updateSettingsMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex items-center">
                    <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                    <p className="text-sm text-red-700">
                      Không thể lưu cài đặt. Vui lòng thử lại.
                    </p>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      )}

      {/* Cronjob List */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-teal-600" />
            <CardTitle>Danh sách Cronjobs</CardTitle>
          </div>
          <CardDescription>
            Quản lý các tác vụ tự động và lịch trình hoạt động
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!settings || settings.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Chưa có cronjob nào được cấu hình</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settings.map((job) => (
                <div key={job.id} className="border border-gray-200 rounded-lg p-4 hover:border-teal-300 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h4 className="text-sm font-medium text-gray-900">{job.name}</h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            job.enabled 
                              ? "bg-green-100 text-green-800" 
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {job.enabled ? "Đang hoạt động" : "Tạm dừng"}
                        </span>
                      </div>
                      
                      {job.description && (
                        <p className="text-sm text-gray-500 mb-2">{job.description}</p>
                      )}
                      
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Biểu thức: <code className="bg-gray-100 px-1 rounded">{job.cronExpression}</code></span>
                        <span>
                          Lịch trình: {cronPresets.find(p => p.value === job.cronExpression)?.label || "Tùy chỉnh"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* Quick Toggle */}
                      <Switch
                        checked={job.enabled}
                        onCheckedChange={() => toggleJobStatus(job)}
                        disabled={updateSettingsMutation.isPending}
                      />
                      
                      {/* Edit Button */}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => startEditing(job)}
                        disabled={editingJob?.id === job.id}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle>Hướng dẫn biểu thức Cron</CardTitle>
          <CardDescription>
            Hiểu về định dạng biểu thức cron để tùy chỉnh lịch trình
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h5 className="font-medium mb-2">Định dạng:</h5>
              <code className="bg-gray-100 p-2 rounded block">giây phút giờ ngày tháng thứ</code>
              <p className="text-gray-500 mt-1">Các trường được phân cách bằng dấu cách</p>
              <div className="mt-3 space-y-1 text-xs text-gray-600">
                <div>• Giây: 0-59</div>
                <div>• Phút: 0-59</div>
                <div>• Giờ: 0-23</div>
                <div>• Ngày: 1-31</div>
                <div>• Tháng: 1-12</div>
                <div>• Thứ: 0-6 (0=Chủ nhật)</div>
              </div>
            </div>
            <div>
              <h5 className="font-medium mb-2">Ví dụ phổ biến:</h5>
              <ul className="space-y-1 text-gray-600">
                <li><code>0 0 0 * * *</code> - Hàng ngày lúc 0:00</li>
                <li><code>0 0 9 * * 1-5</code> - 9:00 sáng các ngày làm việc</li>
                <li><code>0 */15 * * * *</code> - Mỗi 15 phút</li>
                <li><code>0 0 0 1 * *</code> - Ngày đầu mỗi tháng</li>
                <li><code>0 30 8 * * 1</code> - 8:30 sáng thứ 2 hàng tuần</li>
                <li><code>*/30 * * * * *</code> - Mỗi 30 giây</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
