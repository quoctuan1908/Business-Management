"use client";

import { useCallback, useEffect, useState } from "react";
import { Pencil, Plus, RefreshCw, Trash2, DollarSign, User as UserIcon, Mail, Phone, Briefcase, Calculator, CheckCircle2, Clock, Filter } from "lucide-react";

import { salariesApi, usersApi } from "@/lib/api";
import type { Salary, SalaryWithUser, User } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const emptyForm = {
  id: 0,
  userId: "",
  month: String(new Date().getMonth() + 1),
  year: String(new Date().getFullYear()),
  baseSalary: "0",
  commission: "0",
  bonus: "0",
  isPaid: false,
  createdAt: String(new Date()),
  updatedAt: String(new Date())
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(value);
}

export function SalariesPanel() {
  const [salaries, setSalaries] = useState<SalaryWithUser[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterMonth, setFilterMonth] = useState<string>(String(new Date().getMonth() + 1));
  const [filterYear, setFilterYear] = useState<string>(String(new Date().getFullYear()));
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const [calcDialogOpen, setCalcDialogOpen] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [calcMonth, setCalcMonth] = useState(String(new Date().getMonth() + 1));
  const [calcYear, setCalcYear] = useState(String(new Date().getFullYear()));
  const [calcRate, setCalcRate] = useState("5"); 

  const [selectedUser, setSelectedUser] = useState<SalaryWithUser["user"] | null>(null);
  const [userModalOpen, setUserModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [{ salaries: salaryList }, userList] = await Promise.all([
        salariesApi.getAll(),
        usersApi.getAll(),
      ]);
      setSalaries(salaryList);
      setUsers(userList);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function openCreate() {
    setForm({
      ...emptyForm,
      userId: users[0] ? String(users[0].id) : "",
      month: filterMonth,
      year: filterYear,
    });
    setDialogOpen(true);
  }

  function openEdit(salary: Salary & { isPaid?: boolean | number }) {
    setForm({
      id: salary.id,
      userId: String(salary.userId),
      month: String(salary.month),
      year: String(salary.year),
      baseSalary: String(salary.baseSalary),
      commission: String(salary.commission),
      bonus: String(salary.bonus),
      isPaid: salary.isPaid === true,
      createdAt: String(salary.createdAt),
      updatedAt: String(salary.updatedAt)
    });
    setDialogOpen(true);
  }

  function showUserProfile(user: SalaryWithUser["user"]) {
    setSelectedUser(user);
    setUserModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const now = new Date().toISOString();
      
      const payload = {
        id: Number(form.id),
        userId: Number(form.userId),
        month: Number(form.month),
        year: Number(form.year),
        baseSalary: Number(form.baseSalary || 0),
        commission: Number(form.commission || 0),
        bonus: Number(form.bonus || 0),
        isPaid: Boolean(form.isPaid),
        createdAt: form.id === 0 ? now : form.createdAt,
        updatedAt: now
      };

      if (payload.id === 0) {
        await salariesApi.add(payload);
      } else {
        await salariesApi.update(payload);
      }

      setDialogOpen(false);
      await load();
    } catch (err: any) {
      setError(err.errors?.[0]?.info || err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleAutomatedCalculate(e: React.FormEvent) {
    e.preventDefault();
    setCalculating(true);
    setError(null);
    try {
      const rateFloat = Number(calcRate || 0) / 100;
      const res = await salariesApi.calculate({
        month: Number(calcMonth),
        year: Number(calcYear),
        commissionRate: rateFloat
      });

      setFilterMonth(calcMonth);
      setFilterYear(calcYear);

      setCalcDialogOpen(false);
      await load();
      alert(res.message || "Tính toán bảng lương thành công!");
    } catch (err: any) {
      setError(err.message || "Tính toán tự động thất bại.");
    } finally {
      setCalculating(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Xóa bản ghi lương này?")) return;
    try {
      await salariesApi.delete(id);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  const filteredSalaries = salaries.filter(
    (s) => String(s.month) === filterMonth && String(s.year) === filterYear
  );

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-xl font-bold">
          <DollarSign className="h-6 w-6 text-green-600" />
          Quản lý lương
        </CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void load()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Tải lại
          </Button>
          
          <Button variant="secondary" size="sm" onClick={() => setCalcDialogOpen(true)}>
            <Calculator className="h-4 w-4 mr-1 text-blue-600" />
            Tính lương tự động
          </Button>

          <Button size="sm" onClick={openCreate} disabled={users.length === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Thêm lương thủ công
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-wrap items-center gap-3 bg-muted/40 p-3 rounded-lg mb-4 border text-sm">
          <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span>Bộ lọc kỳ lương:</span>
          </div>
          
          <div className="w-32">
            <Select value={filterMonth} onValueChange={setFilterMonth}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Chọn tháng" />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((m) => (
                  <SelectItem key={m} value={m}>Tháng {m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="w-32">
            <Select value={filterYear} onValueChange={setFilterYear}>
              <SelectTrigger className="h-9 bg-background">
                <SelectValue placeholder="Chọn năm" />
              </SelectTrigger>
              <SelectContent>
                {["2024", "2025", "2026", "2027"].map((y) => (
                  <SelectItem key={y} value={y}>Năm {y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-xs text-muted-foreground ml-auto italic">
            Tìm thấy {filteredSalaries.length} bản ghi cho Kỳ {filterMonth}/{filterYear}
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium">
            {error}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSalaries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg bg-muted/10">
            Không có dữ liệu bảng lương cho Tháng {filterMonth}/{filterYear}. 
            <p className="text-xs mt-1">Bạn có thể bấm nút "Tính lương tự động" để quét và tạo nhanh bảng lương hàng loạt.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhân viên</TableHead>
                <TableHead>Kỳ lương</TableHead>
                <TableHead>Lương cơ bản</TableHead>
                <TableHead>Hoa hồng</TableHead>
                <TableHead>Thưởng</TableHead>
                <TableHead>Tổng cộng</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSalaries.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>
                    <button
                      onClick={() => showUserProfile(s.user)}
                      className="font-semibold text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left"
                    >
                      {s.user?.fullName || s.user?.username || `User #${s.userId}`}
                    </button>
                    <span className="block text-xs text-muted-foreground italic">
                      @{s.user?.username}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{`${s.month}/${s.year}`}</TableCell>
                  <TableCell>{formatCurrency(s.baseSalary)}</TableCell>
                  <TableCell>{formatCurrency(s.commission)}</TableCell>
                  <TableCell>{formatCurrency(s.bonus)}</TableCell>
                  <TableCell className="font-bold text-green-700">
                    {formatCurrency(s.baseSalary + s.commission + s.bonus)}
                  </TableCell>
                  
                  <TableCell>
                    {(s as any).isPaid ? (
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 gap-1 font-medium">
                        <CheckCircle2 className="h-3 w-3" /> Đã trả
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 gap-1 font-medium">
                        <Clock className="h-3 w-3" /> Chưa trả
                      </Badge>
                    )}
                  </TableCell>

                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>
                      <Pencil className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => void handleDelete(s.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <Dialog open={calcDialogOpen} onOpenChange={setCalcDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-600" />
              Tính toán hệ thống lương tự động
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(e) => void handleAutomatedCalculate(e)}>
            <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md border border-blue-100">
              Hệ thống sẽ quét toàn bộ dòng tiền thực thu (Payments) và tổng hợp số đại lý mới được duyệt để tự động tạo bảng lương cho tháng đã chọn.
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="calc-month">Tháng tính toán</Label>
                 <Input id="calc-month" type="number" min="1" max="12" value={calcMonth} onChange={(e) => setCalcMonth(e.target.value)} required />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="calc-year">Năm</Label>
                 <Input id="calc-year" type="number" min="2000" value={calcYear} onChange={(e) => setCalcYear(e.target.value)} required />
               </div>
            </div>

            <div className="grid gap-2">
               <Label htmlFor="calc-rate">Tỷ lệ hoa hồng (%)</Label>
               <Input id="calc-rate" type="number" step="0.1" min="0" max="100" value={calcRate} onChange={(e) => setCalcRate(e.target.value)} required />
            </div>

            <Button type="submit" disabled={calculating} className="w-full bg-blue-600 hover:bg-blue-700">
              {calculating ? "Đang quét dữ liệu & tính toán..." : "Chạy tính lương hàng loạt"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {form.id === 0 ? "Thêm bản ghi lương" : "Cập nhật lương"}
            </DialogTitle>
          </DialogHeader>
          <form className="grid gap-4" onSubmit={(e) => void handleSubmit(e)}>
            <div className="grid gap-2">
              <Label>Nhân viên</Label>
              <Select
                value={form.userId}
                onValueChange={(v) => setForm((f) => ({ ...f, userId: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.fullName || u.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="month">Tháng</Label>
                 <Input id="month" type="number" min="1" max="12" value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="year">Năm</Label>
                 <Input id="year" type="number" min="2000" value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))} />
               </div>
            </div>
            
            <div className="grid gap-2">
               <Label htmlFor="baseSalary">Lương cơ bản</Label>
               <Input id="baseSalary" type="number" value={form.baseSalary} onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="grid gap-2">
                 <Label htmlFor="commission">Hoa hồng</Label>
                 <Input id="commission" type="number" value={form.commission} onChange={(e) => setForm((f) => ({ ...f, commission: e.target.value }))} />
               </div>
               <div className="grid gap-2">
                 <Label htmlFor="bonus">Thưởng</Label>
                 <Input id="bonus" type="number" value={form.bonus} onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))} />
               </div>
            </div>

            <div className="grid gap-2">
              <Label>Trạng thái thanh toán</Label>
              <Select
                value={String(form.isPaid)}
                onValueChange={(v) => setForm((f) => ({ ...f, isPaid: v === "true" }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">Chưa thanh toán (Treo lương)</SelectItem>
                  <SelectItem value="true">Đã thanh toán (Giải ngân thành công)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={saving || !form.userId} className="w-full">
              {saving ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Hồ sơ nhân viên
            </DialogTitle>
          </DialogHeader>
          {selectedUser ? (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary">
                  {selectedUser.username[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{selectedUser.fullName || selectedUser.username}</h3>
                  <Badge variant="secondary" className="mt-1 capitalize">
                    {selectedUser.role}
                  </Badge>
                </div>
              </div>

              <div className="grid gap-4 border-t pt-4">
                <div className="flex items-center gap-3">
                  <Briefcase className="h-4 w-4 text-muted-foreground" />
                  <div className="grid gap-0.5">
                    <p className="text-xs text-muted-foreground">Phòng ban</p>
                    <p className="text-sm font-medium">{selectedUser.department || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <div className="grid gap-0.5">
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{selectedUser.email || "N/A"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div className="grid gap-0.5">
                    <p className="text-xs text-muted-foreground">Số điện thoại</p>
                    <p className="text-sm font-medium">{selectedUser.phoneNumber || "N/A"}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-center py-4 text-muted-foreground">Không tìm thấy thông tin nhân viên.</p>
          )}
          <Button onClick={() => setUserModalOpen(false)} variant="outline" className="w-full">
            Đóng
          </Button>
        </DialogContent>
      </Dialog>
    </Card>
  );
}