"use client";

import { useCallback, useEffect, useState } from "react";
import { 
  Activity, DollarSign, TrendingUp, MapPin,
  RefreshCw, Percent, BarChart3, PieChart as PieIcon, 
  Calendar, Users, Clock, AlertCircle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

import { usersApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface SellerStatisticProps {
  userId: number | string;
  userName?: string;
}

const PIE_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0
  }).format(value);
}

const extractArray = (data: any, expectedKey: string): any[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data[expectedKey] && data[expectedKey][expectedKey] && Array.isArray(data[expectedKey][expectedKey])) {
    return data[expectedKey][expectedKey];
  }
  if (data[expectedKey] && Array.isArray(data[expectedKey])) {
    return data[expectedKey];
  }
  return [];
};

const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2.5 shadow-sm text-xs">
        <p className="font-bold text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-medium">
            {entry.name}: {typeof entry.value === "number" ? formatCurrency(entry.value) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function SellerStatistic({ userId, userName }: SellerStatisticProps) {
  const [overview, setOverview] = useState<any>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [statusBreakdown, setStatusBreakdown] = useState<any[]>([]);
  const [recentSales, setRecentSales] = useState<any[]>([]);
  const [debtors, setDebtors] = useState<any[]>([]);
  
  // States lưu trữ toàn bộ danh sách địa giới hành chính gốc từ hệ thống
  const [availableProvinces, setAvailableProvinces] = useState<string[]>([]);
  const [availableWards, setAvailableWards] = useState<string[]>([]);

  // States bộ lọc người dùng chọn
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<string>("2026");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedWard, setSelectedWard] = useState<string>("all");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!userId || userId === "NaN") {
      setError("ID người dùng không hợp lệ.");
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const safeId = typeof userId === 'string' ? encodeURIComponent(userId) : userId;
      
      const params = {
        month: selectedMonth,
        year: selectedYear,
        province: selectedProvince,
        ward: selectedWard
      };

      const [overviewData, locationsData, statusData, salesData, debtorsData] = await Promise.all([
        usersApi.getSellerOverviewStats(safeId, params),
        usersApi.getLocationStats(safeId, params),
        usersApi.getStatusBreakdown(safeId, params),
        usersApi.getRecentSalesTimeline(safeId, params),
        usersApi.getTopDebtors(safeId, { province: selectedProvince, ward: selectedWard })
      ]);

      setOverview(overviewData);
      
      const locArray = extractArray(locationsData, 'locations');
      setLocations(locArray);
      
      // SỬA LỖI: Luôn bóc tách danh sách Tỉnh nếu danh sách hiển thị ban đầu chưa có
      if (availableProvinces.length === 0 && locArray.length > 0) {
        const provinces = Array.from(new Set(locArray.map((l: any) => l.province).filter(Boolean))) as string[];
        setAvailableProvinces(provinces);
      }

      setStatusBreakdown(extractArray(statusData, 'breakdown'));
      setRecentSales(extractArray(salesData, 'timeline'));
      setDebtors(extractArray(debtorsData, 'debtors'));

    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải dữ liệu báo cáo");
    } finally {
      setLoading(false);
    }
  }, [userId, selectedMonth, selectedYear, selectedProvince, selectedWard, availableProvinces.length]);

  // SỬA LỖI: Tách logic cập nhật danh sách Xã thành một useEffect riêng biệt.
  // Mỗi khi `locations` thay đổi hoặc `selectedProvince` thay đổi, danh sách xã sẽ được làm mới tự động.
  useEffect(() => {
    if (locations.length > 0) {
      const filteredWards = locations
        .filter((l: any) => selectedProvince === "all" || l.province === selectedProvince)
        .map((l: any) => l.ward)
        .filter(Boolean);
      
      // Loại bỏ trùng lặp phần tử
      setAvailableWards(Array.from(new Set(filteredWards)) as string[]);
    } else {
      setAvailableWards([]);
    }
  }, [locations, selectedProvince]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  // Hàm xử lý thay đổi Tỉnh/Thành phố
  const handleProvinceChange = (province: string) => {
    setSelectedProvince(province);
    setSelectedWard("all"); // Reset xã về "Tất cả" tránh lệch logic dữ liệu
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive font-medium mb-4">
        {error}
      </div>
    );
  }

  const locationChartData = locations.map(loc => {
    const labelName = selectedProvince === "all" 
      ? (loc.province || "N/A") 
      : `${loc.ward || "Xã chưa rõ"}`;
      
    return {
      name: labelName,
      "Tiền khách đã trả": (Number(loc.revenueGenerated) || 0) - (Number(loc.outstandingDebt) || 0),
      "Tiền khách còn thiếu": Number(loc.outstandingDebt) || 0
    };
  });

  const funnelChartData = statusBreakdown.map(sb => {
    const rawStatus = sb.statusName || sb.status || "Chưa rõ";
    const statusLabelMap: Record<string, string> = {
      draft: "Đang báo giá",
      pending: "Chờ sếp duyệt",
      confirmed: "Khách đã chốt",
      processing: "Đang làm hợp đồng",
      shipping: "Đang bàn giao",
      completed: "Đã xong xuôi",
      cancelled: "Bị hủy / Thất bại"
    };
    return {
      name: statusLabelMap[rawStatus] || rawStatus,
      value: Number(sb.count) || 0
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-bold tracking-tight">
            Sổ Theo Dõi Bán Hàng {userName ? ` - ${userName}` : ""}
          </h3>
          <p className="text-sm text-muted-foreground">
            Xem danh sách hợp đồng mang về, tiến độ tiền về và danh sách khách hàng chưa thanh toán xong.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          {/* Bộ lọc Tỉnh/Thành phố */}
          <div className="flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 bg-background h-9 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <span className="font-medium hidden sm:inline">Tỉnh thành:</span>
            <Select value={selectedProvince} onValueChange={handleProvinceChange}>
              <SelectTrigger className="border-0 p-0 h-auto w-[110px] focus:ring-0 shadow-none text-foreground font-semibold">
                <SelectValue placeholder="Tất cả tỉnh" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả tỉnh</SelectItem>
                {availableProvinces.map((prov) => (
                  <SelectItem key={prov} value={prov}>{prov}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* SỬA LỖI BỘ LỌC XÃ: Không dùng thuộc tính `disabled`, cho phép bấm chọn thoải mái */}
          <div className="flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 bg-background h-9 text-xs text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 text-indigo-500" />
            <span className="font-medium hidden sm:inline">Xã/Phường:</span>
            <Select 
              value={selectedWard} 
              onValueChange={setSelectedWard}
            >
              <SelectTrigger className="border-0 p-0 h-auto w-[120px] focus:ring-0 shadow-none text-foreground font-semibold">
                <SelectValue placeholder="Tất cả xã" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả xã</SelectItem>
                {availableWards.map((ward) => (
                  <SelectItem key={ward} value={ward}>{ward}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bộ lọc Thời gian (Tháng/Năm) */}
          <div className="flex items-center gap-1.5 border rounded-md px-2.5 py-1.5 bg-background h-9 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            <span className="font-medium hidden sm:inline">Thời gian:</span>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="border-0 p-0 h-auto w-[80px] focus:ring-0 shadow-none text-foreground font-semibold">
                <SelectValue placeholder="Tháng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Cả năm</SelectItem>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>Tháng {i + 1}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-muted-foreground/40">/</span>

            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="border-0 p-0 h-auto w-[55px] focus:ring-0 shadow-none text-foreground font-semibold">
                <SelectValue placeholder="Năm" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button variant="outline" size="sm" onClick={() => void loadStats()} className="h-9 w-9 p-0">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {overview && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="p-6 flex items-center justify-between space-y-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tổng số hợp đồng</p>
                <div className="text-2xl font-bold">{overview.totalActivities || 0}</div>
              </div>
              <Activity className="h-8 w-8 text-blue-500 bg-blue-50 p-1.5 rounded-lg" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between space-y-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tỷ lệ chốt đơn thành công</p>
                <div className="text-2xl font-bold">{overview.conversionRate || 0}%</div>
              </div>
              <Percent className="h-8 w-8 text-purple-500 bg-purple-50 p-1.5 rounded-lg" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between space-y-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tổng doanh số mang về</p>
                <div className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(overview.grossRevenue || 0)}
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500 bg-emerald-50 p-1.5 rounded-lg" />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 flex items-center justify-between space-y-0">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Tiền hợp đồng khách chưa trả</p>
                <div className="text-2xl font-bold text-amber-600">
                  {formatCurrency(overview.pendingRevenue || 0)}
                </div>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-600 bg-amber-50 p-1.5 rounded-lg" />
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <BarChart3 className="h-5 w-5 text-indigo-600" /> Tình hình tiền về theo khu vực khách hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {locations.length === 0 ? (
              <p className="text-center py-16 text-sm text-muted-foreground">Chưa có dữ liệu vùng.</p>
            ) : (
              <div className="h-[300px] w-full pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={locationChartData} barGap={6}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} tickLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `${val / 1000000}M`} />
                    <Tooltip content={<CustomChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Tiền khách đã trả" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Tiền khách còn thiếu" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <PieIcon className="h-5 w-5 text-blue-600" /> Trạng thái xử lý các đơn hàng
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <p className="text-center py-16 text-sm text-muted-foreground">Chưa có dữ liệu.</p>
            ) : (
              <div className="h-[300px] w-full flex flex-col sm:flex-row items-center justify-center gap-4">
                <div className="h-full w-full sm:w-[50%]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={funnelChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={4} dataKey="value">
                        {funnelChartData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col gap-2 w-full sm:w-[50%] text-xs">
                  {funnelChartData.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                      <span className="font-medium text-muted-foreground truncate max-w-[120px]">{item.name}</span>
                      <span className="ml-auto font-bold">{item.value} đơn</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Users className="h-5 w-5 text-amber-500" /> Danh sách khách hàng còn nợ tiền (Cũ + Mới)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {debtors.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">Khách đã trả hết tiền, không nợ đồng nào.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên khách hàng / Công ty</TableHead>
                    <TableHead>Số điện thoại</TableHead>
                    <TableHead className="text-right">Tổng số tiền còn nợ</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {debtors.map((debtor, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="font-semibold">{debtor.customerName || debtor.companyName}</TableCell>
                      <TableCell>{debtor.phoneNumber || "Không có số"}</TableCell>
                      <TableCell className="text-right text-amber-600 font-bold">{formatCurrency(debtor.outstandingDebt || 0)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold">
              <Clock className="h-5 w-5 text-indigo-500" /> Các hợp đồng vừa chốt gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentSales.length === 0 ? (
              <p className="text-center py-6 text-sm text-muted-foreground">Chưa chốt được hợp đồng nào mới.</p>
            ) : (
              <div className="space-y-4 relative before:absolute before:inset-0 before:left-[11px] before:bg-muted before:w-[2px] h-[280px] overflow-y-auto pr-2">
                {recentSales.map((sale, idx) => (
                  <div key={idx} className="flex gap-4 relative items-start">
                    <div className="h-6 w-6 rounded-full bg-emerald-100 border-2 border-emerald-500 flex items-center justify-center shrink-0 z-10">
                      <DollarSign className="h-3 w-3 text-emerald-600" />
                    </div>
                    <div className="flex-1 bg-slate-50 rounded-lg p-3 text-xs border border-slate-100 space-y-1">
                      <div className="flex justify-between font-bold text-slate-800">
                        <span>{sale.customerName || "Khách hàng mới"}</span>
                        <span className="text-emerald-600">{formatCurrency(sale.amount || 0)}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px]">Gói dịch vụ: {sale.productName || "Hợp đồng hệ thống"}</p>
                      <p className="text-[10px] text-slate-400">{sale.createdAt ? new Date(sale.createdAt).toLocaleString("vi-VN") : "Vừa xong"}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}