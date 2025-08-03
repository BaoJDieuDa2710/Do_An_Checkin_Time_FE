// components/ForbiddenPage.tsx
import React from "react";
import { AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

const ForbiddenPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md text-center border border-gray-200">
        <div className="flex justify-center mb-4 text-red-500">
          <AlertTriangle className="w-16 h-16" />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Bạn không có quyền truy cập vào trang này
        </h1>
        <p className="text-gray-600 mb-6">
          Vui lòng liên hệ quản trị viên nếu bạn cho rằng đây là lỗi.
        </p>
        <Link to="/" className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition">
          Quay về trang chủ
        </Link>
      </div>
    </div>
  );
};

export default ForbiddenPage;
