import React from "react"

export const NotFoundPage: React.FC = () => {
  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold mb-4">404 - Không tìm thấy trang</h1>
      <p className="text-lg text-gray-600">Trang bạn tìm kiếm không tồn tại.</p>
    </div>
  )
}