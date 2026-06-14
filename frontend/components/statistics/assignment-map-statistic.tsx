"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  MapPin, RefreshCw, Calendar, Users, 
  Map, ClipboardList, Info, Eye
} from "lucide-react";

import { usersApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// 🛠️ Import các thành phần Dialog từ Shadcn UI
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface OccupiedProvince {
  employeeName: string;
  activityContent: string;
  customerName: string;
}

export function AssignmentMap() {
  const [isOpen, setIsOpen] = useState(false);
  const [occupiedProvinces, setOccupiedProvinces] = useState<Record<string, OccupiedProvince>>({});
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadMapStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.getMapStatus(selectedDate);
      setOccupiedProvinces(data?.occupiedProvinces || {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu bản đồ phân công");
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  // Chỉ gọi API khi Pop-up được mở ra để tối ưu hiệu năng (Tránh load ngầm)
  useEffect(() => {
    if (isOpen) {
      void loadMapStats();
    }
  }, [isOpen, loadMapStats]);

  // Hàm kiểm tra và lấy thông tin nhân sự dựa trên tên vùng
  const getAreaDetails = (mapAreaName: string) => {
    const matchedKey = Object.keys(occupiedProvinces).find(key => 
      key.toLowerCase().includes(mapAreaName.toLowerCase()) || 
      mapAreaName.toLowerCase().includes(key.toLowerCase())
    );
    return matchedKey ? occupiedProvinces[matchedKey] : null;
  };

  const activeAssignmentsArray = Object.entries(occupiedProvinces);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* NÚT BẤM KÍCH HOẠT POPUP Ở GIAO DIỆN CHÍNH */}
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm">
          <Map className="h-4 w-4 text-indigo-500" />
          <span>Xem Sơ Đồ Địa Bàn Cần Thơ</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse ml-1" />
        </Button>
      </DialogTrigger>

      {/* NỘI DUNG POPUP (Mở rộng kích thước lớn để chứa đủ bản đồ và danh sách) */}
      <DialogContent className="max-w-6xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 sm:p-6">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Eye className="h-5 w-5 text-indigo-600" /> Hệ Thống Check Địa Bàn & Tránh Trùng Lịch
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Nhân viên xem các khu vực <span className="text-red-500 font-bold">Màu Đỏ</span> (đã có người đăng ký) và <span className="text-slate-400 font-bold">Màu Xám</span> (địa bàn trống) để linh hoạt sắp xếp tuyến hoạt động phù hợp.
          </DialogDescription>
        </DialogHeader>

        {/* Thanh Bộ Lọc Ngày & Refresh nằm ngay đầu Pop-up */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-lg border my-2">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="h-4 w-4 text-slate-500" />
            <span className="font-semibold">Xem lịch trình ngày:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border rounded px-2 py-1 bg-background text-foreground font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <Button variant="ghost" size="sm" onClick={() => void loadMapStats()} disabled={loading} className="h-8 gap-1 text-xs">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Tải lại dữ liệu
          </Button>
        </div>

        {/* Khu vực xử lý Trạng thái Loading / Error */}
        {loading ? (
          <div className="flex flex-col justify-center items-center py-24 space-y-2">
            <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="text-xs text-muted-foreground font-medium">Đang đồng bộ dữ liệu vị trí các nhân sự...</p>
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium my-4">
            {error}
          </div>
        ) : (
          /* GRID CHỨA BẢN ĐỒ VÀ BẢNG THÔNG TIN */
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3 items-start mt-2">
            
            {/* Cột 1 & 2: Sơ đồ SVG trực quan */}
            <Card className="lg:col-span-2 shadow-sm border-slate-100">
              <CardHeader className="py-3 bg-slate-50/50 border-b">
                <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Map className="h-4 w-4 text-indigo-500" /> Bản đồ phân rã phường xã/quận huyện
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center p-4 min-h-[400px] bg-white relative">
                
                <svg viewBox="0 0 600 500" className="w-full h-auto max-h-[400px]" xmlns="http://www.w3.org/2000/svg">
                  {/* Vùng Thốt Nốt */}
                  <path
                    d="M80,60 L180,40 L210,120 L150,180 L70,130 Z"
                    className="transition-all duration-200 cursor-pointer stroke-white stroke-[2px] hover:opacity-80"
                    fill={getAreaDetails("Thốt Nốt") ? "#ef4444" : "#cbd5e1"}
                  >
                    <title>{getAreaDetails("Thốt Nốt") ? `Đã chiếm lĩnh: ${getAreaDetails("Thốt Nốt")?.employeeName}` : "Thốt Nốt: Địa bàn trống - Bạn có thể đăng ký lịch tại đây!"}</title>
                  </path>

                  {/* Vùng Ô Môn */}
                  <path
                    d="M150,180 L210,120 L310,190 L260,280 L140,240 Z"
                    className="transition-all duration-200 cursor-pointer stroke-white stroke-[2px] hover:opacity-80"
                    fill={getAreaDetails("Ô Môn") || getAreaDetails("Cờ Đỏ") ? "#ef4444" : "#e2e8f0"}
                  >
                    <title>{getAreaDetails("Ô Môn") ? `Đã chiếm lĩnh: ${getAreaDetails("Ô Môn")?.employeeName}` : "Ô Môn / Cờ Đỏ: Địa bàn trống - Bạn có thể đăng ký lịch tại đây!"}</title>
                  </path>

                  {/* Vùng Bình Thủy */}
                  <path
                    d="M310,190 L390,230 L350,290 L290,260 Z"
                    className="transition-all duration-200 cursor-pointer stroke-white stroke-[2px] hover:opacity-80"
                    fill={getAreaDetails("Bình Thủy") ? "#ef4444" : "#e2e8f0"}
                  >
                    <title>{getAreaDetails("Bình Thủy") ? `Đã chiếm lĩnh: ${getAreaDetails("Bình Thủy")?.employeeName}` : "Bình Thủy: Địa bàn trống - Bạn có thể đăng ký lịch tại đây!"}</title>
                  </path>

                  {/* Vùng Ninh Kiều */}
                  <path
                    d="M350,290 L430,310 L410,370 L340,350 Z"
                    className="transition-all duration-200 cursor-pointer stroke-white stroke-[2px] hover:opacity-80"
                    fill={getAreaDetails("Ninh Kiều") ? "#ef4444" : "#cbd5e1"}
                  >
                    <title>{getAreaDetails("Ninh Kiều") ? `Đã chiếm lĩnh: ${getAreaDetails("Ninh Kiều")?.employeeName}` : "Ninh Kiều: Địa bàn trống - Bạn có thể đăng ký lịch tại đây!"}</title>
                  </path>

                  {/* Vùng Cái Răng */}
                  <path
                    d="M340,350 L410,370 L390,450 L310,420 Z"
                    className="transition-all duration-200 cursor-pointer stroke-white stroke-[2px] hover:opacity-80"
                    fill={getAreaDetails("Cái Răng") ? "#ef4444" : "#e2e8f0"}
                  >
                    <title>{getAreaDetails("Cái Răng") ? `Đã chiếm lĩnh: ${getAreaDetails("Cái Răng")?.employeeName}` : "Cái Răng: Địa bàn trống - Bạn có thể đăng ký lịch tại đây!"}</title>
                  </path>

                  {/* Vùng Phong Điền */}
                  <path
                    d="M260,280 L290,260 L340,350 L310,420 L210,380 Z"
                    className="transition-all duration-200 cursor-pointer stroke-white stroke-[2px] hover:opacity-80"
                    fill={getAreaDetails("Phong Điền") ? "#ef4444" : "#e2e8f0"}
                  >
                    <title>{getAreaDetails("Phong Điền") ? `Đã chiếm lĩnh: ${getAreaDetails("Phong Điền")?.employeeName}` : "Phong Điền: Địa bàn trống - Bạn có thể đăng ký lịch tại đây!"}</title>
                  </path>

                  {/* Chữ hiển thị địa danh trên bản đồ */}
                  <text x="110" y="100" fontSize="11" fontWeight="600" fill="#475569" className="pointer-events-none select-none">Thốt Nốt</text>
                  <text x="190" y="200" fontSize="12" fontWeight="600" fill="#475569" className="pointer-events-none select-none">Ô Môn</text>
                  <text x="315" y="240" fontSize="11" fontWeight="600" fill="#475569" className="pointer-events-none select-none">Bình Thủy</text>
                  <text x="355" y="325" fontSize="13" fontWeight="700" fill="#1e293b" className="pointer-events-none select-none">NINH KIỀU</text>
                  <text x="335" y="400" fontSize="11" fontWeight="600" fill="#475569" className="pointer-events-none select-none">Cái Răng</text>
                  <text x="245" y="330" fontSize="11" fontWeight="600" fill="#475569" className="pointer-events-none select-none">Phong Điền</text>
                </svg>

                {/* Chú thích màu sắc */}
                <div className="flex flex-wrap gap-4 mt-4 text-xs border-t pt-3 w-full justify-center">
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#e2e8f0] border border-slate-300" />
                    <span className="text-slate-600 font-medium">Địa bàn trống (Có thể chọn)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="h-3 w-3 rounded-full bg-[#ef4444]" />
                    <span className="text-red-600 font-bold">Đã có người bám chốt (Nên tránh)</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cột 3: Danh sách nhật ký bám chốt */}
            <div className="space-y-4">
              <Card className="shadow-sm border-slate-100">
                <CardHeader className="py-3 bg-slate-50/50 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <ClipboardList className="h-4 w-4 text-blue-500" /> Tình trạng phủ vùng
                  </CardTitle>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground font-medium">Số vùng đã có lịch làm việc:</span>
                    <span className="font-bold text-base text-red-600">{activeAssignmentsArray.length} vùng</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-slate-100">
                <CardHeader className="py-3 bg-slate-50/50 border-b">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-amber-500" /> Danh sách nhân sự bám chốt
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 max-h-[280px] overflow-y-auto">
                  {activeAssignmentsArray.length === 0 ? (
                    <div className="text-center py-10 text-xs text-muted-foreground space-y-1 p-4">
                      <Info className="h-6 w-6 text-muted-foreground/40 mx-auto mb-1" />
                      <p className="font-medium text-emerald-600">Hôm nay toàn bộ địa bàn đang trống!</p>
                      <p className="text-[11px] text-muted-foreground/70">Mọi người tự do lựa chọn tuyến phù hợp.</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader className="bg-slate-50 sticky top-0 z-10">
                        <TableRow>
                          <TableHead className="text-[11px] h-8">Địa bàn</TableHead>
                          <TableHead className="text-[11px] h-8">Nhân sự</TableHead>
                          <TableHead className="text-[11px] h-8">Tác vụ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {activeAssignmentsArray.map(([wardName, details], idx) => (
                          <TableRow key={idx} className="hover:bg-slate-50/80">
                            <TableCell className="font-bold text-slate-900 text-[11px] py-2">
                              <div className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-red-500 shrink-0" />
                                <span className="truncate max-w-[80px]">{wardName}</span>
                              </div>
                            </TableCell>
                            <TableCell className="font-semibold text-indigo-600 text-[11px] py-2">
                              {details.employeeName}
                            </TableCell>
                            <TableCell className="py-2">
                              <div className="text-[10px] space-y-0.5 leading-tight">
                                <p className="font-medium text-slate-700 truncate max-w-[100px]">{details.activityContent}</p>
                                <p className="text-[9px] text-muted-foreground truncate max-w-[100px]">
                                  Khách: {details.customerName}
                                </p>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}