"use client";

import { useEffect, useState } from "react";
import { User as UserIcon, Briefcase, Mail, Phone, Shield, RefreshCw } from "lucide-react";

import { usersApi } from "@/lib/api";
import { type User } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShipperStatistic } from "../statistics/shipper-statistic";
import { SellerStatistic } from "../statistics/seller-statistic";
import { AssignmentMap } from "../statistics/assignment-map-statistic"; 

export function UserDashboard() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSession() {
      try {
        setLoading(true);
        const data = await usersApi.getProfile();
        setCurrentUser(data.user);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to authenticate session");
      } finally {
        setLoading(false);
      }
    }
    void fetchSession();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !currentUser) {
    return (
      <div className="rounded-lg bg-destructive/10 p-4 text-sm text-destructive font-medium max-w-md mx-auto mt-10 border border-destructive/20 text-center">
        {error || "Phiên làm việc hết hạn. Vui lòng đăng nhập lại."}
      </div>
    );
  }

  const userRole = currentUser.role?.toLowerCase();

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* 🌟 PROFILE BANNER HEADER (Đã cải tiến layout & Tích hợp nút Map) */}
      <Card className="bg-gradient-to-r from-slate-50 via-white to-slate-50 border-slate-200/80 shadow-sm relative overflow-hidden">
        {/* Điểm trang trí nền nhẹ nhàng */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            
            {/* Khối thông tin nhân sự */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-indigo-50 flex items-center justify-center text-xl sm:text-2xl font-bold text-indigo-600 shadow-inner border border-indigo-100 shrink-0">
                {currentUser.username?.[0]?.toUpperCase() || "E"}
              </div>
              <div className="space-y-1">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Chào mừng trở lại, {currentUser.fullName || currentUser.username}!
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Hệ thống phân tích hiệu suất thương mại và điều phối tuyến hôm nay.
                </p>
              </div>
            </div>

            {/* Khối Actions: Chứa Badge thông tin và NÚT BẢN ĐỒ POPUP hệ thống */}
            <div className="flex flex-wrap items-center gap-2.5 sm:self-start lg:self-center">
              <Badge variant="outline" className="flex items-center gap-1 bg-white border-slate-200 px-2.5 py-1 text-xs text-slate-600 shadow-sm">
                <Briefcase className="h-3 w-3 text-slate-400" />
                {currentUser.department || "Chưa thuộc phòng ban"}
              </Badge>
              <Badge className="flex items-center gap-1 bg-slate-900 hover:bg-slate-900 px-2.5 py-1 text-xs capitalize text-white shadow-sm">
                <Shield className="h-3 w-3 text-indigo-400" />
                Quyền: {currentUser.role}
              </Badge>

              {/* 🛠️ BẢN ĐỒ DẠNG POPUP: Giờ đây tất cả các role (Seller, Shipper) đều có quyền click mở ra xem */}
              <div className="ml-0 sm:ml-2">
                <AssignmentMap />
              </div>
            </div>

          </div>

          {/* Dòng liên hệ phụ bên dưới dạng nét đứt scannable */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-dashed border-slate-200 text-xs sm:text-sm text-muted-foreground">
            <div className="flex items-center gap-2 hover:text-slate-900 transition-colors">
              <Mail className="h-4 w-4 text-slate-400 shrink-0" />
              <span className="truncate">{currentUser.email || "Chưa cập nhật Email"}</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-900 transition-colors">
              <Phone className="h-4 w-4 text-slate-400 shrink-0" />
              <span>{currentUser.phoneNumber || "Chưa liên kết SĐT"}</span>
            </div>
            <div className="flex items-center gap-2 hover:text-slate-900 transition-colors">
              <UserIcon className="h-4 w-4 text-slate-400 shrink-0" />
              <span>Tài khoản: <strong className="text-slate-700 font-semibold">@{currentUser.username}</strong></span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 📈 CORE STATISTIC SECTION (Phần báo cáo thống kê theo Role công việc) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-200">
        <div className="p-1 bg-slate-50/50 border-b border-slate-100" /> {/* Điểm nhấn viền trên nhẹ */}
        <div className="p-4 sm:p-6">
          {userRole === "shipper" ? (
            <ShipperStatistic 
              userId={currentUser.id}
              userName={currentUser.fullName || currentUser.username} 
            />
          ) : (
            <SellerStatistic 
              userId={currentUser.id}
              userName={currentUser.fullName || currentUser.username} 
            />
          )}
        </div>
      </div>

    </div>
  );
}